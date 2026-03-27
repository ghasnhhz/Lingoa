import { useEffect, useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { BookOpen, RotateCcw, ArrowRight } from 'lucide-react'
import { quizService } from '../services/api'
import toast from 'react-hot-toast'
import styles from './LearnResultsPage.module.css'

const OPTION_LABELS = ['A', 'B', 'C', 'D']

function ScoreRing({ score, total }) {
  const pct = Math.round((score / total) * 100)
  const r = 54, c = 2 * Math.PI * r
  const color = pct >= 80 ? '#10b981' : pct >= 50 ? '#6366f1' : '#f43f5e'
  return (
    <div className={styles.ringWrap}>
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#e0e7ff" strokeWidth="10"/>
        <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={c} strokeDashoffset={c - (pct/100)*c}
          strokeLinecap="round" transform="rotate(-90 70 70)"
          style={{ transition: 'stroke-dashoffset 1s ease' }}/>
      </svg>
      <div className={styles.ringInner}>
        <span className={styles.ringScore}>{score}/{total}</span>
        <span className={styles.ringPct}>{pct}%</span>
      </div>
    </div>
  )
}

function getVerdict(pct) {
  if (pct === 100) return { label: '🏆 Perfect!',      desc: 'You mastered this topic completely!' }
  if (pct >= 80)  return { label: '🎉 Excellent!',     desc: 'Great understanding of the lesson.' }
  if (pct >= 60)  return { label: '👍 Good work!',     desc: 'Solid. Review the wrong answers below.' }
  if (pct >= 40)  return { label: '📖 Keep studying',  desc: 'Re-read the lesson before trying again.' }
  return              { label: '💪 Keep going!',    desc: 'Go back to the lesson and study carefully.' }
}

export default function LearnResultsPage() {
  const location = useLocation()
  const navigate  = useNavigate()

  // Prefer navigation state (fast), but fall back to DB via `resultId` (refresh-safe).
  const { score, total, topic, field, results, lesson, resultId } = location.state || {}

  const [dbResult, setDbResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const [showLesson, setShowLesson] = useState(false)

  useEffect(() => {
    const rid = resultId || localStorage.getItem('quizmind_last_learn_resultId')
    const missingBaseState = (!results || score === undefined)
    const missingExplanations =
      Array.isArray(results) &&
      results.some(r => !r.isCorrect && !(r.explanation || '').trim())

    if (!missingBaseState && !missingExplanations) return

    if (!rid && missingBaseState) {
      navigate('/learn')
      return
    }
    if (!rid) return

    setLoading(true)
    quizService.getResult(rid)
      .then((data) => setDbResult(data))
      .catch(() => {
        toast.error('Learn result not found')
        localStorage.removeItem('quizmind_last_learn_resultId')
        navigate('/learn', { replace: true })
      })
      .finally(() => setLoading(false))
  }, [resultId, results, score, navigate])

  const effective = dbResult || ((results && score !== undefined)
    ? { score, total, topic, field, results, lesson }
    : null)

  const finalScore = effective?.score
  const finalTotal = effective?.total
  const finalTopic = effective?.topic
  const finalField = effective?.field
  const finalResults = effective?.results
  const finalLesson = effective?.lesson ?? lesson

  if (loading || finalScore === undefined || !finalResults) {
    return (
      <div className={styles.loading}>
        <span>Loading your results…</span>
      </div>
    )
  }

  const pct     = Math.round((finalScore / finalTotal) * 100)
  const verdict = getVerdict(pct)
  const wrongs  = finalResults.filter(r => !r.isCorrect)
  const corrects = finalResults.filter(r =>  r.isCorrect)

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        {/* Score hero */}
        <div className={styles.scoreHero}>
          <ScoreRing score={finalScore} total={finalTotal} />
          <div className={styles.verdict}>
            <span className={styles.learnBadge}>🎓 Learn & Quiz</span>
            <h1 className={styles.verdictLabel}>{verdict.label}</h1>
            <p className={styles.verdictDesc}>{verdict.desc}</p>
            {finalTopic && <span className={styles.topicTag}>{finalTopic}</span>}
          </div>
        </div>

        {/* Stats */}
        <div className={styles.statsRow}>
          {[
            { num: finalScore,              color: 'var(--emerald-500)', label: 'Correct'   },
            { num: finalTotal - finalScore, color: 'var(--rose-500)',    label: 'Incorrect' },
            { num: finalTotal,              color: 'var(--indigo-500)',  label: 'Total'     },
          ].map(s => (
            <div key={s.label} className={styles.stat}>
              <span className={styles.statNum} style={{ color: s.color }}>{s.num}</span>
              <span className={styles.statLabel}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          {finalLesson && (
            <button className="btn btn-secondary" onClick={() => setShowLesson(v => !v)}>
              <BookOpen size={15} /> {showLesson ? 'Hide' : 'Review'} lesson
            </button>
          )}
          <Link to="/learn" className="btn btn-secondary">
            <RotateCcw size={15} /> New topic
          </Link>
          <Link to="/setup" className="btn btn-primary">
            Quick quiz <ArrowRight size={15} />
          </Link>
        </div>

        {/* Lesson review (collapsible) */}
        {showLesson && finalLesson && (
          <div className={styles.lessonReview}>
            <h3 className={styles.lessonTitle}>{finalLesson.title}</h3>
            {finalLesson.sections?.map((s, i) => (
              <div key={i} className={styles.lessonSection}>
                <h4 className={styles.lessonHeading}>{s.heading}</h4>
                {s.content?.split('\n').filter(Boolean).map((p, j) => (
                  <p key={j} className={styles.lessonPara}>{p}</p>
                ))}
              </div>
            ))}
            {finalLesson.keyPoints?.length > 0 && (
              <div className={styles.keyPoints}>
                <strong>🔑 Key points</strong>
                <ul>{finalLesson.keyPoints.map((kp, i) => <li key={i}>{kp}</li>)}</ul>
              </div>
            )}
          </div>
        )}

        {/* Wrong answers */}
        {wrongs.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.dot} style={{ background: 'var(--rose-400)' }} />
              Mistakes to review ({wrongs.length})
            </h2>
            <div className={styles.cardList}>
              {finalResults.map((r, i) => !r.isCorrect && (
                <div key={i} className={`${styles.resultCard} ${styles.wrongCard}`}>
                  <div className={styles.cardHeader}>
                    <span className={styles.qNum}>Q{i + 1}</span>
                    <span className={`${styles.badge} ${styles.badgeWrong}`}>✗ Incorrect</span>
                  </div>
                  <p className={styles.cardQuestion}>{r.question}</p>
                  <div className={styles.answerRows}>
                    <div className={styles.answerRow}>
                      <span className={styles.answerLabel}>Your answer:</span>
                      <span className={`${styles.answerBadge} ${styles.badgeWrong}`}>
                        {OPTION_LABELS[r.selectedIndex]} — {r.options[r.selectedIndex]}
                      </span>
                    </div>
                    <div className={styles.answerRow}>
                      <span className={styles.answerLabel}>Correct:</span>
                      <span className={`${styles.answerBadge} ${styles.badgeCorrect}`}>
                        {OPTION_LABELS[r.correctIndex]} — {r.options[r.correctIndex]}
                      </span>
                    </div>
                  </div>
                  {r.explanation && (
                    <div className={styles.explanation}>
                      <span className={styles.explanationIcon}>💡</span>
                      <p>{r.explanation}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Correct answers */}
        {corrects.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.dot} style={{ background: 'var(--emerald-500)' }} />
              Correct answers ({corrects.length})
            </h2>
            <div className={styles.cardList}>
              {finalResults.map((r, i) => r.isCorrect && (
                <div key={i} className={`${styles.resultCard} ${styles.correctCard}`}>
                  <div className={styles.cardHeader}>
                    <span className={styles.qNum}>Q{i + 1}</span>
                    <span className={`${styles.badge} ${styles.badgeCorrect}`}>✓ Correct</span>
                  </div>
                  <p className={styles.cardQuestion}>{r.question}</p>
                  <span className={`${styles.answerBadge} ${styles.badgeCorrect}`}>
                    {OPTION_LABELS[r.correctIndex]} — {r.options[r.correctIndex]}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  )
}