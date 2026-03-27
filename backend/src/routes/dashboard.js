const express = require('express')
const router  = express.Router()
const { protect } = require('../middleware/authMiddleware')
const Quiz = require('../models/Quiz')

// ── GET /api/dashboard/stats ──────────────────────────────────
router.get('/stats', protect, async (req, res) => {
  try {
    const userId = req.user._id

    const quizzes = await Quiz.find({ user: userId, submitted: true })
      .sort({ createdAt: -1 })
      .select('topic field mode score total createdAt resultId')

    if (quizzes.length === 0) {
      return res.json({
        totalQuizzes: 0,
        avgScore:     0,
        streak:       0,
        bestTopic:    null,
        weakestTopic: null,
        recent:       [],
      })
    }

    // Avg score
    const avgScore = Math.round(
      quizzes.reduce((sum, q) => sum + (q.score / q.total) * 100, 0) / quizzes.length
    )

    // Streak — count consecutive days with at least one quiz
    const streak = calcStreak(quizzes)

    // Best & weakest topic (min 2 attempts)
    const topicMap = {}
    quizzes.forEach(q => {
      if (!topicMap[q.topic]) topicMap[q.topic] = { scores: [], topic: q.topic }
      topicMap[q.topic].scores.push((q.score / q.total) * 100)
    })
    const topicAvgs = Object.values(topicMap)
      .filter(t => t.scores.length >= 1)
      .map(t => ({
        topic: t.topic,
        avg:   Math.round(t.scores.reduce((a, b) => a + b, 0) / t.scores.length),
        count: t.scores.length,
      }))
      .sort((a, b) => b.avg - a.avg)

    const bestTopic    = topicAvgs[0]    || null
    const weakestTopic = topicAvgs[topicAvgs.length - 1] || null

    // Recent 5
    const recent = quizzes.slice(0, 5).map(q => ({
      resultId:  q.resultId,
      topic:     q.topic,
      field:     q.field,
      mode:      q.mode,
      score:     q.score,
      total:     q.total,
      percent:   Math.round((q.score / q.total) * 100),
      createdAt: q.createdAt,
    }))

    res.json({
      totalQuizzes: quizzes.length,
      avgScore,
      streak,
      bestTopic,
      weakestTopic,
      recent,
    })
  } catch (err) {
    console.error('Dashboard stats error:', err.message)
    res.status(500).json({ message: 'Server error' })
  }
})

// ── Streak calculator ─────────────────────────────────────────
function calcStreak(quizzes) {
  const days = new Set(
    quizzes.map(q => new Date(q.createdAt).toISOString().split('T')[0])
  )
  const sorted = Array.from(days).sort().reverse()
  if (!sorted.length) return 0

  const today     = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  // Streak must include today or yesterday
  if (sorted[0] !== today && sorted[0] !== yesterday) return 0

  let streak = 1
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1])
    const curr = new Date(sorted[i])
    const diff = (prev - curr) / 86400000
    if (diff === 1) streak++
    else break
  }
  return streak
}

module.exports = router