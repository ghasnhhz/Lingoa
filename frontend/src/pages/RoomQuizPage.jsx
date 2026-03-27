import { useState, useEffect, useRef } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { useRoom } from '../hooks/useRoom'
import { CheckSquare, Clock, Users, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import styles from './RoomQuizPage.module.css'

const OPTION_LABELS = ['A','B','C','D']

function QuestionTimer({ seconds, onExpire, key: timerKey }) {
  const [remaining, setRemaining] = useState(seconds)
  const pct = (remaining / seconds) * 100
  const warn = pct < 30

  useEffect(() => {
    setRemaining(seconds)
    const interval = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) { clearInterval(interval); onExpire(); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [timerKey])

  return (
    <div className={`${styles.timer} ${warn ? styles.timerWarn : ''}`}>
      <Clock size={14} />
      <span>{remaining}s</span>
      <div className={styles.timerTrack}>
        <div className={`${styles.timerFill} ${warn ? styles.timerFillWarn : ''}`}
          style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function RoomQuizPage() {
  const { code }    = useParams()
  const location    = useLocation()
  const navigate    = useNavigate()
  const { questions, timePerQuestion, topic, field, studentId, isTeacher } = location.state || {}

  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers]           = useState({})
  const [submitted, setSubmitted]       = useState(false)
  const [progress, setProgress]         = useState({ finished: 0, total: 0 })
  const [submitting, setSubmitting]     = useState(false)

  const { emit } = useRoom({
    'room:progress': (data) => setProgress(data),
    'room:submitted': ({ score, total }) => {
      setSubmitted(true)
      toast.success(`Submitted! Score: ${score}/${total}`)
    },
    'room:leaderboard': (data) => {
      navigate(`/room/${code}/results`, { state: data })
    },
    'room:error': (data) => toast.error(data.message),
  })

  if (!questions) { navigate('/'); return null }

  const currentQ           = questions[currentIndex]
  const selectedForCurrent = answers[currentIndex] ?? null
  const isLast             = currentIndex === questions.length - 1
  const allAnswered        = Object.keys(answers).length === questions.length

  const handleSelect = (optIdx) => {
    if (submitted) return
    setAnswers(prev => ({ ...prev, [currentIndex]: optIdx }))
    if (!isLast) setTimeout(() => setCurrentIndex(p => p + 1), 500)
  }

  const handleSubmit = () => {
    setSubmitting(true)
    emit('room:submit', { code, studentId, answers })
  }

  const handleTimeUp = () => {
    if (!submitted && !submitting) handleSubmit()
  }

  return (
    <div className={styles.page}>
      {/* Top bar */}
      <div className={styles.topBar}>
        <div className={styles.topMeta}>
          <span className={styles.codeBadge}>{code}</span>
          <span className={styles.topicText}>{topic}</span>
        </div>
        <div className={styles.topRight}>
          {isTeacher && (
            <div className={styles.progress}>
              <Users size={14} />
              <span>{progress.finished}/{progress.total} finished</span>
            </div>
          )}
          {!submitted && !isTeacher && (
            <QuestionTimer
              key={currentIndex}
              seconds={timePerQuestion}
              onExpire={handleTimeUp}
            />
          )}
        </div>
      </div>

      <div className={styles.container}>
        {/* Teacher view */}
        {isTeacher ? (
          <div className={styles.teacherView}>
            <div className={styles.teacherCard}>
              <h2 className={styles.teacherTitle}>Quiz in progress</h2>
              <div className={styles.bigProgress}>
                <div className={styles.bigNum}>{progress.finished}</div>
                <div className={styles.bigOf}>of {progress.total} finished</div>
                <div className={styles.progressBar}>
                  <div className={styles.progressFill}
                    style={{ width: progress.total ? `${(progress.finished/progress.total)*100}%` : '0%' }}/>
                </div>
              </div>
              <button
                className="btn btn-primary"
                onClick={() => emit('room:end', { code, userId: location.state?.userId })}
                style={{ marginTop: 24 }}
              >
                End quiz & show results
              </button>
            </div>
          </div>
        ) : submitted ? (
          <div className={styles.waitResults}>
            <div className={styles.waitOrb} />
            <h2>Answers submitted!</h2>
            <p>Waiting for everyone to finish…</p>
            <p className={styles.waitSub}>Results will appear automatically</p>
          </div>
        ) : (
          <>
            {/* Progress dots */}
            <div className={styles.dots}>
              {questions.map((_, i) => (
                <div key={i} className={`${styles.dot}
                  ${i === currentIndex ? styles.dotActive : ''}
                  ${answers[i] !== undefined ? styles.dotDone : ''}`}
                  onClick={() => setCurrentIndex(i)} />
              ))}
            </div>

            {/* Question */}
            <div className={styles.questionCard}>
              <div className={styles.qHeader}>
                <span className={styles.qNum}>Question {currentIndex + 1} of {questions.length}</span>
              </div>
              <p className={styles.qText}>{currentQ.question}</p>
              <div className={styles.options}>
                {currentQ.options.map((opt, i) => (
                  <button
                    key={i}
                    className={`${styles.option} ${selectedForCurrent === i ? styles.optSelected : ''}`}
                    onClick={() => handleSelect(i)}
                    type="button"
                  >
                    <span className={styles.optLabel}>{OPTION_LABELS[i]}</span>
                    <span className={styles.optText}>{opt}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            {allAnswered && (
              <div className={styles.submitArea}>
                <button
                  className="btn btn-primary"
                  onClick={handleSubmit}
                  disabled={submitting}
                  style={{ fontSize:'16px', padding:'14px 40px' }}
                >
                  {submitting
                    ? <><Loader2 size={16} className={styles.spin}/> Submitting…</>
                    : <><CheckSquare size={16}/> Submit answers</>}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}