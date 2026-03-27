require('dotenv').config({quiet: true})
const express    = require('express')
const cors       = require('cors')
const mongoose   = require('mongoose')
const http       = require('http')
const { Server } = require('socket.io')

const authRoutes      = require('./routes/auth')
const quizRoutes      = require('./routes/quiz')
//const examRoutes      = require('./routes/exam')
const learnRoutes     = require('./routes/learn')
const roomRoutes      = require('./routes/room')
const dashboardRoutes = require('./routes/dashboard')
const feedbackRoutes  = require('./routes/feedback')
const roomSocket      = require('./socket/roomSocket')

const app    = express()
const server = http.createServer(app)
const io     = new Server(server, {
  cors: {
    origin:      'http://localhost:3000',
    methods:     ['GET', 'POST'],
    credentials: true,
  }
})

const PORT = process.env.PORT || 5000

// ── Middleware ────────────────────────────────────────────────
app.use(cors({ origin: 'http://localhost:3000', credentials: true }))
app.use(express.json())

// ── REST Routes ───────────────────────────────────────────────
app.use('/api/auth',      authRoutes)
app.use('/api/quiz',      quizRoutes)
app.use('/api/results',   quizRoutes)
//app.use('/api/exam',      examRoutes)
app.use('/api/learn',     learnRoutes)
app.use('/api/room',      roomRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/feedback',  feedbackRoutes)

app.get('/api/health', (req, res) => res.json({ status: 'ok' }))
app.use((req, res) => res.status(404).json({ message: `Route ${req.originalUrl} not found` }))

// ── Socket.io ─────────────────────────────────────────────────
roomSocket(io)

// ── Connect to MongoDB then start ─────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected')
    server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))
  })
  .catch(err => { console.error('MongoDB error:', err.message); process.exit(1) })