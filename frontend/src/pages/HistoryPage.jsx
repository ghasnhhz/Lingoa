import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { quizService } from '../services/api'
import { Clock, ChevronRight, Trophy, Loader2, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'
import styles from './HistoryPage.module.css'

function ScoreBadge({ score, total }) {
  const percent = Math.round((score / total) * 100)
  const color = percent >= 80 ? styles.green : percent >= 50 ? styles.blue : styles.red
  return (
    <span className={`${styles.scoreBadge} ${color}`}>
      {score}/{total} · {percent}%
    </span>
  )
}

function formatDate(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function HistoryPage() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    quizService.getHistory()
      .then(setHistory)
      .catch(() => toast.error('Failed to load history'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className={styles.loading}>
        <Loader2 size={26} className={styles.spin} />
        <span>Loading your quizzes…</span>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Your quiz history</h1>
          <p className={styles.subtitle}>{history.length} quiz{history.length !== 1 ? 'zes' : ''} completed</p>
          <Link to="/setup" className="btn btn-primary" style={{ marginTop: 8 }}>
            + New quiz
          </Link>
        </div>

        {history.length === 0 ? (
          <div className={styles.empty}>
            <BookOpen size={40} strokeWidth={1.5} />
            <h3>No quizzes yet</h3>
            <p>Start your first quiz and it'll appear here.</p>
            <Link to="/setup" className="btn btn-primary">Take a quiz</Link>
          </div>
        ) : (
          <div className={styles.list}>
            {history.map((item) => (
              <Link
                key={item.resultId}
                to={`/results/${item.resultId}`}
                className={styles.item}
              >
                <div className={styles.itemIcon} style={{
                  background: item.mode === 'learn' ? 'linear-gradient(135deg,#f0fdf4,#dcfce7)' : 'var(--indigo-50)',
                  color: item.mode === 'learn' ? '#16a34a' : 'var(--indigo-500)',
                }}>
                  <BookOpen size={18} />
                </div>
                <div className={styles.itemInfo}>
                  <span className={styles.itemTopic}>{item.topic}</span>
                  <div className={styles.itemMeta}>
                    <span className={`${styles.modeBadge} ${item.mode === 'learn' ? styles.modeBadgeLearn : styles.modeBadgeQuiz}`}>
                      {item.mode === 'learn' ? '🎓 Learn & Quiz' : '⚡ Quick Quiz'}
                    </span>
                    <span className={styles.metaDot}>·</span>
                    <span className={styles.itemField}>{item.field}</span>
                    <span className={styles.metaDot}>·</span>
                    <Clock size={12} />
                    <span>{formatDate(item.createdAt)}</span>
                  </div>
                </div>
                <div className={styles.itemRight}>
                  <ScoreBadge score={item.score} total={item.total} />
                  <ChevronRight size={16} className={styles.arrow} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}