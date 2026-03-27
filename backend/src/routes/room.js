const express = require('express')
const router  = express.Router()
const { protect } = require('../middleware/authMiddleware')
const Room = require('../models/Room')

// ── Generate unique 6-char room code ─────────────────────────
function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

// ── POST /api/room/create ─────────────────────────────────────
router.post('/create', protect, async (req, res) => {
  try {
    let code, exists
    do {
      code  = generateCode()
      exists = await Room.findOne({ code })
    } while (exists)

    const room = await Room.create({
      code,
      teacher: req.user._id,
    })

    res.status(201).json({ code: room.code, roomId: room._id })
  } catch (err) {
    console.error('Create room error:', err.message)
    res.status(500).json({ message: 'Failed to create room' })
  }
})

// ── GET /api/room/:code ───────────────────────────────────────
router.get('/:code', async (req, res) => {
  try {
    const room = await Room.findOne({ code: req.params.code.toUpperCase() })
      .populate('teacher', 'name email')
    if (!room) return res.status(404).json({ message: 'Room not found' })

    res.json({
      code:            room.code,
      status:          room.status,
      teacher:         room.teacher,
      topic:           room.topic,
      field:           room.field,
      timePerQuestion: room.timePerQuestion,
      studentCount:    room.students.filter(s => !s.kicked).length,
      students:        room.students.filter(s => !s.kicked).map(s => ({
        id: s._id, name: s.name, finished: s.finished,
      })),
    })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

// ── GET /api/room/history/mine ────────────────────────────────
router.get('/history/mine', protect, async (req, res) => {
  try {
    const rooms = await Room.find({ teacher: req.user._id })
      .sort({ createdAt: -1 })
      .select('code status topic field studentCount createdAt finishedAt')
    res.json(rooms)
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router