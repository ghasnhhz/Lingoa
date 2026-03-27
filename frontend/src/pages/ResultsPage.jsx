import { useEffect, useState } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import ResultCard from '../components/ResultCard'
import { quizService } from '../services/api'
import { Share2, RotateCcw, Trophy, Check, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import styles from './ResultsPage.module.css'

function ScoreRing({ score, total }) {
  const percent = Math.round((score / total) * 100)
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percent / 100) * circumference

  const color = percent >= 80 ? '#10b981' : percent >= 50 ? '#6366f1' : '#f43f5e'

  return (
    <div className={styles.ringWrap}>
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#e0e7ff" strokeWidth="10" />
        <circle
          cx="70" cy="70" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 70 70)"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className={styles.ringInner}>
        <span className={styles.ringScore}>{score}/{total}</span>
        <span className={styles.ringPercent}>{percent}%</span>
      </div>
    </div>
  )
}

function getVerdict(percent) {
  if (percent === 100) return { label: '🏆 Perfect!', desc: 'Flawless. You nailed every single question.' }
  if (percent >= 80) return { label: '🎉 Excellent!', desc: 'Great job! You clearly know this topic well.' }
  if (percent >= 60) return { label: '👍 Good work!', desc: 'Solid score. Review the explanations below to close the gaps.' }
  if (percent >= 40) return { label: '📖 Keep studying', desc: 'You\'re making progress. Focus on the explanations below.' }
  return { label: '💪 Keep going!', desc: 'Don\'t give up — every mistake is a lesson. Review carefully.' }
}

export default function ResultsPage() {
  const { resultId } = useParams()
  const location = useLocation()

  const [result, setResult] = useState(location.state || null)
  const [loading, setLoading] = useState(!location.state)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!result) {
      quizService.getResult(resultId)
        .then(setResult)
        .catch(() => toast.error('Result not found'))
        .finally(() => setLoading(false))
    }
  }, [resultId])

  const handleShare = () => {
    const url = `${window.location.origin}/results/${resultId}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    toast.success('Link copied to clipboard!')
    setTimeout(() => setCopied(false), 2500)
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <Loader2 size={28} className={styles.spin} />
        <span>Loading results…</span>
      </div>
    )
  }

  if (!result) {
    return (
      <div className={styles.loading}>
        <p>Result not found.</p>
        <Link to="/setup" className="btn btn-primary" style={{ marginTop: 16 }}>Start a new quiz</Link>
      </div>
    )
  }

  const percent = Math.round((result.score / result.total) * 100)
  const verdict = getVerdict(percent)
  const wrongAnswers = result.results?.filter(r => !r.isCorrect) || []
  const correctAnswers = result.results?.filter(r => r.isCorrect) || []

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        {/* Score hero */}
        <div className={styles.scoreHero}>
          <ScoreRing score={result.score} total={result.total} />
          <div className={styles.verdict}>
            <h1 className={styles.verdictLabel}>{verdict.label}</h1>
            <p className={styles.verdictDesc}>{verdict.desc}</p>
            {result.topic && (
              <span className={styles.topicTag}>{result.topic}</span>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className={styles.statsRow}>
          <div className={styles.stat}>
            <span className={styles.statNum} style={{ color: 'var(--emerald-500)' }}>{result.score}</span>
            <span className={styles.statLabel}>Correct</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statNum} style={{ color: 'var(--rose-500)' }}>{result.total - result.score}</span>
            <span className={styles.statLabel}>Incorrect</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statNum} style={{ color: 'var(--indigo-500)' }}>{result.total}</span>
            <span className={styles.statLabel}>Total</span>
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button className="btn btn-secondary" onClick={handleShare}>
            {copied ? <Check size={16} /> : <Share2 size={16} />}
            {copied ? 'Copied!' : 'Share result'}
          </button>
          <Link to="/setup" className="btn btn-primary">
            <RotateCcw size={16} />
            New quiz
          </Link>
        </div>

        {/* Wrong answers with explanations */}
        {wrongAnswers.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionDot} style={{ background: 'var(--rose-400)' }} />
              Review your mistakes ({wrongAnswers.length})
            </h2>
            <div className={styles.resultList}>
              {result.results
                .map((r, i) => ({ ...r, originalIndex: i }))
                .filter(r => !r.isCorrect)
                .map((r, wrongIdx) => (
                  <ResultCard
                    key={r.originalIndex}
                    result={r}
                    index={r.originalIndex}
                    shortExplanationOnly={wrongIdx < 3}
                  />
                ))}
            </div>
          </section>
        )}

        {/* Correct answers (collapsed hint) */}
        {correctAnswers.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionDot} style={{ background: 'var(--emerald-500)' }} />
              Correct answers ({correctAnswers.length})
            </h2>
            <div className={styles.resultList}>
              {result.results
                .map((r, i) => ({ ...r, originalIndex: i }))
                .filter(r => r.isCorrect)
                .map((r) => (
                  <ResultCard key={r.originalIndex} result={r} index={r.originalIndex} />
                ))}
            </div>
          </section>
        )}

      </div>
    </div>
  )
}