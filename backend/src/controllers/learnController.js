const Groq = require('groq-sdk')
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const DIFFICULTY_PROMPTS = {
  beginner:     'BEGINNER level — simple language, basic concepts, foundational recall. Questions should be straightforward.',
  intermediate: 'INTERMEDIATE level — clear explanations, application of concepts. Mix simple and moderately challenging questions.',
  advanced:     'ADVANCED level — deep explanations, nuanced concepts, edge cases. Questions should challenge deep understanding.',
}

// ── POST /api/learn/generate ──────────────────────────────────
const generate = async (req, res) => {
  try {
    const { field, topic } = req.body
    const count      = Number(req.body.count)
    const difficulty = req.body.difficulty || 'intermediate'
    const diffNote   = DIFFICULTY_PROMPTS[difficulty] || DIFFICULTY_PROMPTS.intermediate

    if (!field || !topic || !count) {
      return res.status(400).json({ message: 'field, topic and count are required' })
    }

    if (count < 5 || count > 15) {
      return res.status(400).json({ message: 'count must be between 5 and 15' })
    }

    const prompt = `You are an expert educator and quiz creator.

A student wants to LEARN about "${topic}" in the field of "${field}", then be TESTED on it.
Difficulty: ${diffNote}

Generate a structured lesson AND exactly ${count} multiple choice questions about the lesson content.

Respond with ONLY valid JSON. No markdown, no backticks, no explanation before or after.

{
  "lesson": {
    "title": "Clear lesson title",
    "sections": [
      { "heading": "Section 1 title", "content": "3-4 paragraphs explaining this part of the topic." },
      { "heading": "Section 2 title", "content": "3-4 paragraphs explaining this part of the topic." },
      { "heading": "Section 3 title", "content": "3-4 paragraphs explaining this part of the topic." }
    ],
    "keyPoints": [
      "Key point 1",
      "Key point 2",
      "Key point 3",
      "Key point 4",
      "Key point 5"
    ],
    "summary": "2-3 sentence summary of the whole lesson."
  },
  "questions": [
    {
      "question": "Question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0
    }
  ]
}`

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.6,
      max_tokens: 6000,
    })

    const raw     = response.choices[0].message.content.trim()
    // Strip any accidental markdown fences
    const cleaned = raw
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim()

    console.log('Groq raw response (first 200 chars):', cleaned.substring(0, 200))

    const parsed = JSON.parse(cleaned)

    if (!parsed.lesson || !parsed.questions) {
      throw new Error('Missing lesson or questions in AI response')
    }

    if (!Array.isArray(parsed.lesson.sections) || !Array.isArray(parsed.questions)) {
      throw new Error('Invalid structure in AI response')
    }

    res.status(200).json({
      lesson:    parsed.lesson,
      questions: parsed.questions.map((q, i) => ({
        id:           i,
        question:     q.question,
        options:      q.options,
        correctIndex: q.correctIndex,
      })),
    })
  } catch (err) {
    console.error('Learn generate error:', err.message)
    if (err instanceof SyntaxError) {
      return res.status(500).json({ message: 'AI returned invalid JSON. Please try again.' })
    }
    res.status(500).json({ message: 'Failed to generate lesson. Please try again.' })
  }
}

module.exports = { generate }