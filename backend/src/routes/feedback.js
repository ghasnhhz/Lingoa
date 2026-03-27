const express = require('express')
const router  = express.Router()

// POST /api/feedback
router.post('/', async (req, res) => {
  try {
    const { message, userName } = req.body

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Feedback message is required' })
    }

    const token  = process.env.TELEGRAM_BOT_TOKEN
    const chatId = process.env.TELEGRAM_CHAT_ID

    if (!token || !chatId) {
      console.warn('Telegram not configured — feedback not sent')
      return res.json({ ok: true }) // fail silently for user
    }

    const sender = userName || 'Anonymous'
    const text   = `💬 *New Feedback — QuizMind*\n\n👤 *From:* ${sender}\n\n📝 ${message.trim()}`

    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id:    chatId,
          text,
          parse_mode: 'Markdown',
        }),
      }
    )

    const data = await response.json()
    if (!data.ok) {
      console.error('Telegram API error:', data)
      return res.status(500).json({ message: 'Failed to send feedback' })
    }

    res.json({ ok: true })
  } catch (err) {
    console.error('Feedback error:', err.message)
    res.status(500).json({ message: 'Failed to send feedback' })
  }
})

module.exports = router