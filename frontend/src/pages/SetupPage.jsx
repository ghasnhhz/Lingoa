import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LoadingScreen from '../components/LoadingScreen'
import TopicAutocomplete from '../components/TopicAutocomplete'
import DifficultySelector from '../components/DifficultySelector'
import { quizService } from '../services/api'
import { ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import styles from './SetupPage.module.css'

const COUNTS = [5, 10, 15, 20]
const FIELD  = 'languages'

export default function SetupPage() {
  const navigate = useNavigate()
  const [topic,      setTopic]      = useState('')
  const [difficulty, setDifficulty] = useState('intermediate')
  const [count,      setCount]      = useState(10)
  const [loading,    setLoading]    = useState(false)

  const canSubmit = topic.trim().length >= 2 && difficulty && !loading

  const handleGenerate = async () => {
    if (!canSubmit) return
    setLoading(true)
    try {
      const data = await quizService.generate({ field: FIELD, topic: topic.trim(), count, difficulty })
      navigate('/quiz', { state: { quizId: data.quizId, questions: data.questions, topic, field: FIELD, difficulty } })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate quiz. Try again.')
      setLoading(false)
    }
  }

  return (
    <>
      {loading && <LoadingScreen topic={topic} count={count} />}
      <div className={styles.page}>
        <div className={styles.container}>

          <div className={styles.header}>
            <h1 className={styles.title}>Set up your quiz</h1>
            <p className={styles.subtitle}>
              Enter a grammar topic or vocabulary area, choose your level, and let AI generate your questions.
            </p>
          </div>

          {/* Step 1 — Topic */}
          <div className={styles.step}>
            <div className={styles.stepLabel}>
              <span className={styles.stepNum}>1</span>
              <span>What topic do you want to be tested on?</span>
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
              <span>How many questions?</span>
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
            Generate quiz <ArrowRight size={18} />
          </button>

        </div>
      </div>
    </>
  )
}