import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LoadingScreen from '../components/LoadingScreen'
import TopicAutocomplete from '../components/TopicAutocomplete'
import DifficultySelector from '../components/DifficultySelector'
import { learnService } from '../services/api'
import { ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import styles from './LearnSetupPage.module.css'

const COUNTS = [5, 8, 10, 15]
const FIELD  = 'languages'

export default function LearnSetupPage() {
  const navigate = useNavigate()
  const [topic,      setTopic]      = useState('')
  const [difficulty, setDifficulty] = useState('intermediate')
  const [count,      setCount]      = useState(8)
  const [loading,    setLoading]    = useState(false)

  const canSubmit = topic.trim().length >= 2 && difficulty && !loading

  const handleGenerate = async () => {
    if (!canSubmit) return
    setLoading(true)
    try {
      const data = await learnService.generate({ field: FIELD, topic: topic.trim(), count, difficulty })
      navigate('/learn/lesson', {
        state: { lesson: data.lesson, questions: data.questions, topic: topic.trim(), field: FIELD, count, difficulty }
      })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate lesson. Try again.')
      setLoading(false)
    }
  }

  return (
    <>
      {loading && <LoadingScreen topic={topic} count={`a lesson + ${count} questions`} />}
      <div className={styles.page}>
        <div className={styles.container}>

          <div className={styles.header}>
            <span className={styles.modeBadge}>🎓 Learn & Quiz</span>
            <h1 className={styles.title}>Learn a topic, then get tested</h1>
            <p className={styles.subtitle}>
              AI writes a structured English lesson on your topic. Read it, understand it —
              then prove it with a quiz built from exactly what you learned.
            </p>
          </div>

          {/* Step 1 — Topic */}
          <div className={styles.step}>
            <div className={styles.stepLabel}>
              <span className={styles.stepNum}>1</span>
              <span>What do you want to learn?</span>
            </div>
            <TopicAutocomplete
              field={FIELD}
              value={topic}
              onChange={setTopic}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              placeholder="e.g. Past simple tense, Phrasal verbs, Articles…"
            />
          </div>

          {/* Step 2 — Difficulty */}
          <div className={styles.step}>
            <div className={styles.stepLabel}>
              <span className={styles.stepNum}>2</span>
              <span>Difficulty level</span>
            </div>
            <DifficultySelector value={difficulty} onChange={setDifficulty} />
          </div>

          {/* Step 3 — Count */}
          <div className={styles.step}>
            <div className={styles.stepLabel}>
              <span className={styles.stepNum}>3</span>
              <span>How many quiz questions after the lesson?</span>
            </div>
            <div className={styles.countRow}>
              {COUNTS.map(n => (
                <button
                  key={n}
                  className={`${styles.countBtn} ${count === n ? styles.countActive : ''}`}
                  onClick={() => setCount(n)}
                  type="button"
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <button
            className={`btn btn-primary ${styles.generateBtn}`}
            onClick={handleGenerate}
            disabled={!canSubmit}
          >
            Generate lesson <ArrowRight size={18} />
          </button>

        </div>
      </div>
    </>
  )
}