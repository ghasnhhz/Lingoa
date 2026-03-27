import { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useRoom } from '../hooks/useRoom'
import DifficultySelector from '../components/DifficultySelector'
import { Users, Copy, Check, Play, X, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import styles from './RoomLobbyPage.module.css'

const COUNTS = [5, 10, 15, 20]
const TIMES  = [15, 20, 30, 45, 60]
const FIELD  = 'languages'

export default function RoomLobbyPage() {
  const { code }     = useParams()
  const location     = useLocation()
  const navigate     = useNavigate()
  const { user }     = useAuth()
  const isTeacher    = location.state?.isTeacher || false
  const studentId    = location.state?.studentId
  const studentName  = location.state?.name

  const [students,    setStudents]    = useState(location.state?.roomData?.students || [])
  const [copied,      setCopied]      = useState(false)
  const [generating,  setGenerating]  = useState(false)
  const [topic,       setTopic]       = useState('')
  const [count,       setCount]       = useState(10)
  const [timePQ,      setTimePQ]      = useState(30)
  const [difficulty,  setDifficulty]  = useState('intermediate')

  const { emit } = useRoom({
    'room:teacher_joined': (data) => { setStudents(data.students) },
    'room:student_joined': (s)    => { setStudents(prev => [...prev.filter(x => x.id !== s.id), s]) },
    'room:student_left':   ({ studentId: sid }) => {
      setStudents(prev => prev.filter(s => s.id !== sid))
    },
    'room:student_kicked': ({ studentId: sid }) => {
      setStudents(prev => prev.filter(s => s.id !== sid))
    },
    'room:kicked': () => {
      toast.error('You were removed from the room')
      navigate('/')
    },
    'room:generating': () => setGenerating(true),
    'room:quiz_started': (data) => {
      navigate(`/room/${code}/quiz`, {
        state: { questions: data.questions, timePerQuestion: data.timePerQuestion,
          topic: data.topic, field: data.field, studentId, isTeacher, userId: user?.id }
      })
    },
    'room:error': (data) => {
      toast.error(data.message)
      setGenerating(false)
    },
  })

  useEffect(() => {
    if (isTeacher && user) {
      emit('room:teacher_join', { code, userId: user.id })
    }
  }, [])

  const handleCopy = () => {
    navigator.clipboard.writeText(`${window.location.origin}/room/${code}`)
    setCopied(true)
    toast.success('Link copied!')
    setTimeout(() => setCopied(false), 2500)
  }

  const handleStart = () => {
    if (!topic.trim()) return toast.error('Please enter a topic')
    if (!field) return toast.error('Please select a field')
    emit('room:start', { code, field: FIELD, topic: topic.trim(), count, timePerQuestion: timePQ, userId: user?.id, difficulty })
  }

  const handleKick = (sid) => {
    emit('room:kick', { code, studentId: sid, userId: user?.id })
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.codeBadge}>{code}</span>
            <div>
              <h1 className={styles.title}>
                {isTeacher ? 'Your Quiz Room' : 'Waiting for quiz to start…'}
              </h1>
              <p className={styles.subtitle}>
                {isTeacher
                  ? 'Set up your quiz below, then click Start when everyone has joined'
                  : `You're in! Hang tight while the teacher sets up the quiz.`}
              </p>
            </div>
          </div>
          <button className="btn btn-secondary" onClick={handleCopy}>
            {copied ? <Check size={15}/> : <Copy size={15}/>}
            {copied ? 'Copied!' : 'Copy link'}
          </button>
        </div>

        <div className={styles.body}>

          {/* Students panel */}
          <div className={styles.studentsPanel}>
            <div className={styles.panelHeader}>
              <Users size={16} />
              <span>Students ({students.length})</span>
            </div>
            {students.length === 0 ? (
              <div className={styles.noStudents}>
                <p>Waiting for students to join…</p>
                <p className={styles.shareHint}>Share the code <strong>{code}</strong> or the link above</p>
              </div>
            ) : (
              <div className={styles.studentList}>
                {students.map(s => (
                  <div key={s.id} className={styles.studentRow}>
                    <div className={styles.studentAvatar}>
                      {s.name.charAt(0).toUpperCase()}
                    </div>
                    <span className={styles.studentName}>{s.name}</span>
                    {isTeacher && (
                      <button
                        className={styles.kickBtn}
                        onClick={() => handleKick(s.id)}
                        title="Remove student"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Teacher setup panel */}
          {isTeacher && (
            <div className={styles.setupPanel}>
              <h3 className={styles.setupTitle}>Quiz Setup</h3>

              <div className={styles.setupStep}>
                <label className="label">Topic</label>
                <input
                  className="input"
                  type="text"
                  placeholder="e.g. Past simple tense, Phrasal verbs, Articles…"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                />
              </div>

              <div className={styles.setupStep}>
                <label className="label">Difficulty</label>
                <DifficultySelector value={difficulty} onChange={setDifficulty} />
              </div>

              <div className={styles.setupRow}>
                <div className={styles.setupStep}>
                  <label className="label">Questions</label>
                  <div className={styles.btnRow}>
                    {COUNTS.map(n => (
                      <button key={n}
                        className={`${styles.optBtn} ${count === n ? styles.optActive : ''}`}
                        onClick={() => setCount(n)} type="button">{n}</button>
                    ))}
                  </div>
                </div>
                <div className={styles.setupStep}>
                  <label className="label">Seconds per question</label>
                  <div className={styles.btnRow}>
                    {TIMES.map(t => (
                      <button key={t}
                        className={`${styles.optBtn} ${timePQ === t ? styles.optActive : ''}`}
                        onClick={() => setTimePQ(t)} type="button">{t}s</button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                className="btn btn-primary"
                onClick={handleStart}
                disabled={generating || students.length === 0}
                style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
              >
                {generating
                  ? <><Loader2 size={16} className={styles.spin} /> Generating questions…</>
                  : <><Play size={16} /> Start quiz</>}
              </button>
              {students.length === 0 && (
                <p className={styles.waitHint}>Waiting for at least 1 student to join</p>
              )}
            </div>
          )}

          {/* Student waiting animation */}
          {!isTeacher && (
            <div className={styles.waitingPanel}>
              <div className={styles.waitOrb} />
              <p className={styles.waitText}>The teacher is setting up your quiz…</p>
              <p className={styles.waitSub}>You'll be redirected automatically when it starts</p>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}