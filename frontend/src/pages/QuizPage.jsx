import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import QuestionCard from '../components/QuestionCard'
import ProgressBar from '../components/ProgressBar'
import { quizService } from '../services/api'
import { ArrowRight, ArrowLeft, CheckSquare, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import styles from './QuizPage.module.css'
import { logEvent } from 'firebase/analytics'
import { analytics } from '../firebase'

export default function QuizPage() {
  const location = useLocation()
  const navigate  = useNavigate()

  const { quizId, questions, topic, field, learnMode, lesson } = location.state || {}

  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers]           = useState({})
  const [submitting, setSubmitting]     = useState(false)
  const [direction, setDirection]       = useState('next')

  if (!questions || questions.length === 0) { navigate('/setup'); return null }

  const currentQuestion  = questions[currentIndex]
  const selectedForCurrent = answers[currentIndex] ?? null
  const isLast           = currentIndex === questions.length - 1
  const answeredCount    = Object.keys(answers).length

  const handleSelect = (optionIndex) => {
    setAnswers(prev => ({ ...prev, [currentIndex]: optionIndex }))
  }

  const handleNext = () => { setDirection('next'); setCurrentIndex(p => p + 1) }
  const handlePrev = () => { setDirection('prev'); setCurrentIndex(p => p - 1) }

  const handleSubmit = async () => {
    if (answeredCount < questions.length) {
      const first = questions.findIndex((_, i) => answers[i] === undefined)
      toast.error(`Please answer question ${first + 1} first`)
      setCurrentIndex(first)
      return
    }

    setSubmitting(true)

    // learnMode: compute results client-side then save to DB
    if (learnMode) {
      let saved = null

      const results = questions.map((q, i) => {
        const selectedIndex = Number(answers[i])
        const isCorrect     = selectedIndex === q.correctIndex
        return {
          question: q.question, options: q.options,
          correctIndex: q.correctIndex, selectedIndex, isCorrect,
          explanation: '',
        }
      })
      const score = results.filter(r => r.isCorrect).length

      logEvent(analytics, 'quiz_completed', { topic, field, score, total: questions.length, mode: 'learn' })


      // Save to DB for history (non-blocking — don't crash if it fails)
      try {
        saved = await quizService.saveLearnResult({ field, topic, questions, results })
        toast.success('Saved to your history!')
      } catch (e) {
        toast.error(e?.response?.data?.message || 'Could not save to history.')
      }

      // Let LearnResultsPage recover after refresh.
      // (Only the id matters; the page can re-fetch the full result from the backend.)
      if (saved?.resultId) {
        localStorage.setItem('quizmind_last_learn_resultId', saved.resultId)
      } else {
        localStorage.removeItem('quizmind_last_learn_resultId')
      }

      navigate('/learn/results', {
        state: {
          score,
          total: questions.length,
          topic,
          field,
          results,
          lesson,
          resultId: saved?.resultId || null,
        }
      })
      return
    } 

    // Normal mode: submit to backend
    try {
      const data = await quizService.submit(quizId, answers)

      logEvent(analytics, 'quiz_completed', { topic, field, score: data.score, total: data.total, mode: 'quiz' })

      navigate(`/results/${data.resultId}`, { state: data })
    } catch (err) {
      toast.error('Failed to submit. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.meta}>
            <span className={styles.fieldBadge}>{field}</span>
            <span className={styles.topicText}>{topic}</span>
            {learnMode && <span className={styles.learnBadge}>🎓 Learn & Quiz</span>}
          </div>
          <ProgressBar current={currentIndex + 1} total={questions.length} />
        </div>

        <div key={`${currentIndex}-${direction}`} className={`${styles.questionWrap} ${styles[direction]}`}>
          <QuestionCard
            question={currentQuestion}
            selectedIndex={selectedForCurrent}
            onSelect={handleSelect}
            revealed={false}
          />
        </div>

        <div className={styles.nav}>
          <button className="btn btn-secondary" onClick={handlePrev} disabled={currentIndex === 0}>
            <ArrowLeft size={16} /> Prev
          </button>

          <div className={styles.dots}>
            {questions.map((_, i) => (
              <button
                key={i}
                className={`${styles.dot} ${i === currentIndex ? styles.dotActive : ''} ${answers[i] !== undefined ? styles.dotDone : ''}`}
                onClick={() => { setDirection(i > currentIndex ? 'next' : 'prev'); setCurrentIndex(i) }}
                title={`Q${i + 1}`}
              />
            ))}
          </div>

          {isLast ? (
            <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}
              style={{ minWidth: '140px', justifyContent: 'center' }}>
              {submitting
                ? <><Loader2 size={16} className={styles.spin} /> Submitting…</>
                : <><CheckSquare size={16} /> Finish</>}
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleNext}>
              Next <ArrowRight size={16} />
            </button>
          )}
        </div>

        <div className={styles.hint}>
          <span className={styles.hintCount}>{answeredCount}/{questions.length} answered</span>
          {answeredCount === questions.length && !isLast && (
            <span className={styles.hintReady}>✓ Ready to submit!</span>
          )}
        </div>
      </div>
    </div>
  )
}