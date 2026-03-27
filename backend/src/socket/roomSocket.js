const Room   = require('../models/Room')
const Groq   = require('groq-sdk')
const groq   = new Groq({ apiKey: process.env.GROQ_API_KEY })

const DIFFICULTY_PROMPTS = {
  beginner:     'BEGINNER level — test basic definitions and simple recall.',
  intermediate: 'INTERMEDIATE level — test understanding and application of concepts.',
  advanced:     'ADVANCED level — test deep understanding, edge cases, and tricky distractors.',
}

// ── Generate questions via Groq ───────────────────────────────
async function generateQuestions(field, topic, count, difficulty = 'intermediate') {
  const diffNote = DIFFICULTY_PROMPTS[difficulty] || DIFFICULTY_PROMPTS.intermediate
  const prompt = `Generate exactly ${count} multiple choice questions about "${topic}" in the field of "${field}".
${diffNote}
Each question must have exactly 4 options, only one correct.
Respond with ONLY valid JSON, no markdown:
{
  "questions": [
    { "question": "...", "options": ["A","B","C","D"], "correctIndex": 0 }
  ]
}`
  const res     = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7, max_tokens: 4000,
  })
  const raw     = res.choices[0].message.content.trim()
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
  const parsed  = JSON.parse(cleaned)
  return parsed.questions
}

// ── Compute leaderboard ───────────────────────────────────────
function buildLeaderboard(room) {
  return room.students
    .filter(s => !s.kicked)
    .map(s => ({ id: s._id, name: s.name, score: s.score, total: room.questions.length, finished: s.finished }))
    .sort((a, b) => b.score - a.score)
    .map((s, i) => ({ ...s, rank: i + 1 }))
}

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`)

    // ── room:join ─────────────────────────────────────────────
    socket.on('room:join', async ({ code, name, userId }) => {
      try {
        const room = await Room.findOne({ code: code.toUpperCase() })
        if (!room) return socket.emit('room:error', { message: 'Room not found' })
        if (room.status === 'finished') return socket.emit('room:error', { message: 'This room has ended' })

        // Check if rejoining
        let student = room.students.find(s =>
          (userId && s.userId?.toString() === userId) ||
          (!userId && s.name === name && !s.kicked)
        )

        if (student) {
          // Rejoin — update socketId
          student.socketId = socket.id
          student.kicked   = false
        } else {
          // New student
          if (room.status === 'active') {
            return socket.emit('room:error', { message: 'Quiz already in progress' })
          }
          room.students.push({ userId: userId || null, name, socketId: socket.id })
          student = room.students[room.students.length - 1]
        }

        await room.save()
        socket.join(code)

        // Send room state to joiner
        socket.emit('room:joined', {
          roomId:          room._id,
          code:            room.code,
          status:          room.status,
          topic:           room.topic,
          field:           room.field,
          timePerQuestion: room.timePerQuestion,
          studentId:       student._id,
          questions:       room.status === 'active' ? room.questions : [],
          students: room.students.filter(s => !s.kicked).map(s => ({
            id: s._id, name: s.name, finished: s.finished,
          })),
        })

        // Notify everyone else
        io.to(code).emit('room:student_joined', {
          id: student._id, name: student.name, finished: false,
        })

        console.log(`👤 ${name} joined room ${code}`)
      } catch (err) {
        console.error('room:join error:', err.message)
        socket.emit('room:error', { message: 'Failed to join room' })
      }
    })

    // ── room:teacher_join ─────────────────────────────────────
    socket.on('room:teacher_join', async ({ code, userId }) => {
      try {
        const room = await Room.findOne({ code: code.toUpperCase() })
        if (!room) return socket.emit('room:error', { message: 'Room not found' })
        if (room.teacher.toString() !== userId) {
          return socket.emit('room:error', { message: 'Not authorized' })
        }

        room.teacherSocketId = socket.id
        await room.save()
        socket.join(code)

        socket.emit('room:teacher_joined', {
          roomId:          room._id,
          code:            room.code,
          status:          room.status,
          topic:           room.topic,
          field:           room.field,
          timePerQuestion: room.timePerQuestion,
          questions:       room.questions,
          students: room.students.filter(s => !s.kicked).map(s => ({
            id: s._id, name: s.name, finished: s.finished, score: s.score,
          })),
        })
        console.log(`👨‍🏫 Teacher joined room ${code}`)
      } catch (err) {
        socket.emit('room:error', { message: 'Failed to join room' })
      }
    })

    // ── room:start ────────────────────────────────────────────
    socket.on('room:start', async ({ code, field, topic, count, timePerQuestion, userId }) => {
      try {
        const room = await Room.findOne({ code: code.toUpperCase() })
        if (!room) return socket.emit('room:error', { message: 'Room not found' })

        // Accept if socket matches teacherSocketId OR userId matches teacher
        const isTeacher = room.teacherSocketId === socket.id ||
          (userId && room.teacher.toString() === userId)
        if (!isTeacher) {
          return socket.emit('room:error', { message: 'Only the teacher can start' })
        }
        if (room.status !== 'waiting') {
          return socket.emit('room:error', { message: 'Room already started' })
        }

        socket.emit('room:generating', { message: 'Generating questions…' })

        const questions = await generateQuestions(field, topic, Number(count), difficulty || 'intermediate')

        room.field           = field
        room.topic           = topic
        room.questionCount   = Number(count)
        room.timePerQuestion = Number(timePerQuestion) || 30
        room.questions       = questions
        room.status          = 'active'
        room.startedAt       = new Date()

        // Reset all student answers
        room.students.forEach(s => {
          s.answers  = {}
          s.score    = 0
          s.finished = false
        })

        await room.save()

        // Send questions to everyone in room
        io.to(code).emit('room:quiz_started', {
          questions: questions.map((q, i) => ({
            id: i, question: q.question, options: q.options,
          })),
          timePerQuestion: room.timePerQuestion,
          topic:           room.topic,
          field:           room.field,
        })

        console.log(`🚀 Room ${code} started with ${questions.length} questions`)
      } catch (err) {
        console.error('room:start error:', err.message)
        socket.emit('room:error', { message: 'Failed to start quiz. Try again.' })
      }
    })

    // ── room:submit ───────────────────────────────────────────
    socket.on('room:submit', async ({ code, studentId, answers }) => {
      try {
        const room = await Room.findOne({ code: code.toUpperCase() })
        if (!room || room.status !== 'active') return

        const student = room.students.id(studentId)
        if (!student || student.finished) return

        // Score
        let score = 0
        room.questions.forEach((q, i) => {
          if (Number(answers[i]) === q.correctIndex) score++
        })

        student.answers  = answers
        student.score    = score
        student.finished = true
        await room.save()

        // Confirm to student
        socket.emit('room:submitted', { score, total: room.questions.length })

        // Update progress for teacher
        const finished = room.students.filter(s => !s.kicked && s.finished).length
        const total    = room.students.filter(s => !s.kicked).length
        io.to(code).emit('room:progress', { finished, total })

        // If everyone finished — auto show leaderboard
        if (finished === total) {
          await endRoom(room, io, code)
        }

        console.log(`✅ ${student.name} submitted in room ${code} — score ${score}/${room.questions.length}`)
      } catch (err) {
        console.error('room:submit error:', err.message)
        socket.emit('room:error', { message: 'Failed to submit answers' })
      }
    })

    // ── room:kick ─────────────────────────────────────────────
    socket.on('room:kick', async ({ code, studentId, userId }) => {
      try {
        const room = await Room.findOne({ code: code.toUpperCase() })
        if (!room) return
        const isTeacher = room.teacherSocketId === socket.id ||
          (userId && room.teacher.toString() === userId)
        if (!isTeacher) return

        const student = room.students.id(studentId)
        if (!student) return

        student.kicked = true
        await room.save()

        // Notify kicked student
        const studentSocket = io.sockets.sockets.get(student.socketId)
        if (studentSocket) {
          studentSocket.emit('room:kicked', { message: 'You have been removed from the room' })
          studentSocket.leave(code)
        }

        // Notify everyone
        io.to(code).emit('room:student_kicked', { studentId })
        console.log(`🚫 ${student.name} kicked from room ${code}`)
      } catch (err) {
        console.error('room:kick error:', err.message)
      }
    })

    // ── room:end ──────────────────────────────────────────────
    socket.on('room:end', async ({ code, userId }) => {
      try {
        const room = await Room.findOne({ code: code.toUpperCase() })
        if (!room) return
        const isTeacher = room.teacherSocketId === socket.id ||
          (userId && room.teacher.toString() === userId)
        if (!isTeacher) return

        await endRoom(room, io, code)
      } catch (err) {
        console.error('room:end error:', err.message)
      }
    })

    // ── disconnect ────────────────────────────────────────────
    socket.on('disconnect', async () => {
      try {
        // Find room where this socket was a student or teacher
        const room = await Room.findOne({
          $or: [
            { teacherSocketId: socket.id },
            { 'students.socketId': socket.id },
          ]
        })
        if (!room) return

        if (room.teacherSocketId === socket.id) {
          room.teacherSocketId = null
          await room.save()
        } else {
          const student = room.students.find(s => s.socketId === socket.id)
          if (student) {
            student.socketId = null
            await room.save()
            io.to(room.code).emit('room:student_left', { studentId: student._id })
          }
        }
      } catch (err) {
        // silent
      }
      console.log(`❌ Socket disconnected: ${socket.id}`)
    })
  })
}

// ── Shared end room logic ─────────────────────────────────────
async function endRoom(room, io, code) {
  room.status     = 'finished'
  room.finishedAt = new Date()
  await room.save()

  const leaderboard = buildLeaderboard(room)
  io.to(code).emit('room:leaderboard', {
    leaderboard,
    topic: room.topic,
    field: room.field,
  })
  console.log(`🏁 Room ${code} finished`)
}