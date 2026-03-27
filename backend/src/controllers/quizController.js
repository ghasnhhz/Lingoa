const Groq = require('groq-sdk')
const { v4: uuidv4 } = require('uuid')
const Quiz = require('../models/Quiz')

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

// ── Difficulty instructions ───────────────────────────────────
const DIFFICULTY_PROMPTS = {
  beginner:     'These should be BEGINNER level — test basic definitions, simple recall, and foundational concepts. Questions should be straightforward.',
  intermediate: 'These should be INTERMEDIATE level — test understanding and application of concepts. Mix straightforward and slightly tricky questions.',
  advanced:     'These should be ADVANCED level — test deep understanding, edge cases, nuanced differences, and analytical thinking. Include tricky distractors.',
}

// ── Helper: call Groq to generate questions ───────────────────
const generateQuestionsWithAI = async (field, topic, count, difficulty = 'intermediate') => {
  const difficultyInstruction = DIFFICULTY_PROMPTS[difficulty] || DIFFICULTY_PROMPTS.intermediate

  const prompt = `You are a quiz generator. Generate exactly ${count} multiple choice questions about "${topic}" in the field of "${field}".

${difficultyInstruction}

Rules:
- Each question must have exactly 4 answer options
- Only one option is correct
- Be specific and clear, no ambiguous questions

Respond with ONLY valid JSON, no explanation, no markdown, no backticks.
Use exactly this format:
{
  "questions": [
    {
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0
    }
  ]
}`

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 4000,
  })

  const raw = response.choices[0].message.content.trim()
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
  const parsed = JSON.parse(cleaned)

  if (!parsed.questions || !Array.isArray(parsed.questions)) {
    throw new Error('Invalid AI response structure')
  }

  return parsed.questions
}

// ── Helper: get explanations for wrong answers ────────────────
const generateExplanations = async (questions, answers) => {
  // Convert Mongoose docs to plain objects safely
  const plainQuestions = questions.map(q => ({
    question:     q.question,
    options:      Array.from(q.options),
    correctIndex: q.correctIndex,
  }))

  const wrongOnes = plainQuestions
    .map((q, i) => ({ ...q, selectedIndex: Number(answers[i] ?? -1), index: i }))
    .filter(q => q.selectedIndex !== q.correctIndex)

  if (wrongOnes.length === 0) return {}

  const prompt = `For each question below, the student answered incorrectly.
Write a SHORT, clear explanation (1-2 sentences) of why the correct answer is right.

${wrongOnes.map((q, i) => `Q${i + 1}: ${q.question}
Options: ${q.options.map((o, idx) => `${idx}: ${o}`).join(' | ')}
Student chose: option ${q.selectedIndex} ("${q.options[q.selectedIndex] ?? 'none'}")
Correct answer: option ${q.correctIndex} ("${q.options[q.correctIndex]}")`).join('\n\n')}

Respond with ONLY valid JSON, no markdown, no backticks:
{
  "explanations": ["explanation for Q1", "explanation for Q2", ...]
}`

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens: 1500,
    })

    const raw = response.choices[0].message.content.trim()
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
    const parsed = JSON.parse(cleaned)

    const explanationMap = {}
    // Guard: make sure explanations array exists
    const explanations = Array.isArray(parsed.explanations) ? parsed.explanations : []
    wrongOnes.forEach((q, i) => {
      explanationMap[q.index] = explanations[i] || ''
    })
    return explanationMap
  } catch (err) {
    // If explanation generation fails, return empty map — don't crash the whole submit
    console.error('Explanation generation failed (non-fatal):', err.message)
    return {}
  }
}


// ── POST /api/quiz/generate ───────────────────────────────────
const generate = async (req, res) => {
  try {
    const { field, topic } = req.body
    const count      = Number(req.body.count)
    const difficulty = req.body.difficulty || 'intermediate'

    if (!field || !topic || !count) {
      return res.status(400).json({ message: 'field, topic and count are required' })
    }

    if (count < 1 || count > 20) {
      return res.status(400).json({ message: 'count must be between 1 and 20' })
    }

    const questions = await generateQuestionsWithAI(field, topic, count, difficulty)

    const quiz = await Quiz.create({
      user: req.user._id,
      field,
      topic,
      questions,
    })

    res.status(201).json({
      quizId: quiz._id,
      questions: questions.map((q, i) => ({
        id:           i,
        question:     q.question,
        options:      q.options,
        correctIndex: q.correctIndex,
      })),
    })
  } catch (err) {
    console.error('Generate error:', err.message)
    if (err instanceof SyntaxError) {
      return res.status(500).json({ message: 'AI returned invalid response. Please try again.' })
    }
    res.status(500).json({ message: 'Failed to generate quiz. Please try again.' })
  }
}


// ── POST /api/quiz/:quizId/submit ─────────────────────────────
const submit = async (req, res) => {
  try {
    const { quizId } = req.params
    const { answers } = req.body  // { "0": 2, "1": 0, ... }

    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ message: 'answers are required' })
    }

    const quiz = await Quiz.findById(quizId)
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' })
    if (quiz.submitted) return res.status(400).json({ message: 'Quiz already submitted' })
    if (quiz.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    // Score answers
    let score = 0
    quiz.questions.forEach((q, i) => {
      if (Number(answers[i]) === q.correctIndex) score++
    })

    // Get AI explanations for wrong answers (won't crash if it fails)
    const explanationMap = await generateExplanations(quiz.questions, answers)

    // Build results array from plain values
    const results = quiz.questions.map((q, i) => {
      const selectedIndex = Number(answers[i] ?? -1)
      const isCorrect = selectedIndex === q.correctIndex
      return {
        question:      q.question,
        options:       Array.from(q.options),
        correctIndex:  q.correctIndex,
        selectedIndex,
        isCorrect,
        explanation:   explanationMap[i] || '',
      }
    })

    const resultId = uuidv4()

    quiz.submitted = true
    quiz.score     = score
    quiz.total     = quiz.questions.length
    quiz.resultId  = resultId
    quiz.results   = results
    await quiz.save()

    res.json({
      resultId,
      score,
      total:   quiz.questions.length,
      topic:   quiz.topic,
      field:   quiz.field,
      results,
    })
  } catch (err) {
    console.error('Submit error:', err.message)
    res.status(500).json({ message: 'Failed to submit quiz. Please try again.' })
  }
}


// ── GET /api/results/:resultId  (public) ─────────────────────
const getResult = async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ resultId: req.params.resultId })
    if (!quiz || !quiz.submitted) {
      return res.status(404).json({ message: 'Result not found' })
    }

    res.json({
      resultId:  quiz.resultId,
      score:     quiz.score,
      total:     quiz.total,
      topic:     quiz.topic,
      field:     quiz.field,
      createdAt: quiz.createdAt,
      results:   quiz.results,
    })
  } catch (err) {
    console.error('GetResult error:', err.message)
    res.status(500).json({ message: 'Server error' })
  }
}


// ── POST /api/quiz/save-learn-result ─────────────────────────
// Saves a client-side learn & quiz result to DB for history
const saveLearnResult = async (req, res) => {
  try {
    const { field, topic, questions, results } = req.body

    if (!field || !topic || !results || !Array.isArray(results)) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    const score    = results.filter(r => r.isCorrect).length
    const resultId = require('uuid').v4()

    // Use results to rebuild questions if not provided
    const qs = (questions && questions.length > 0)
      ? questions.map(q => ({
          question:     q.question,
          options:      Array.isArray(q.options) ? q.options : [],
          correctIndex: q.correctIndex ?? 0,
        }))
      : results.map(r => ({
          question:     r.question,
          options:      Array.isArray(r.options) ? r.options : [],
          correctIndex: r.correctIndex ?? 0,
        }))

    await Quiz.create({
      user:      req.user._id,
      field,
      topic,
      mode:      'learn',
      questions: qs,
      submitted: true,
      score,
      total:     results.length,
      resultId,
      results:   results.map(r => ({
        question:      r.question,
        options:       Array.isArray(r.options) ? r.options : [],
        correctIndex:  r.correctIndex ?? 0,
        selectedIndex: r.selectedIndex ?? -1,
        isCorrect:     r.isCorrect ?? false,
        explanation:   r.explanation || '',
      })),
    })

    res.status(201).json({ resultId, score, total: results.length })
  } catch (err) {
    console.error('SaveLearnResult error:', err.message)
    res.status(500).json({ message: 'Failed to save result' })
  }
}


// ── GET /api/quiz/history ─────────────────────────────────────
const getHistory = async (req, res) => {
  try {
    const quizzes = await Quiz.find({ user: req.user._id, submitted: true })
      .sort({ createdAt: -1 })
      .select('resultId topic field mode score total createdAt')

    res.json(quizzes)
  } catch (err) {
    console.error('History error:', err.message)
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = { generate, submit, getResult, getHistory, saveLearnResult }