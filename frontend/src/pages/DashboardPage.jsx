import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { dashboardService } from '../services/api'
import { Zap, BookOpen, Users, Clock, TrendingUp, TrendingDown, Flame, BarChart2, ChevronRight, Loader2 } from 'lucide-react'
import styles from './DashboardPage.module.css'

function formatDate(str) {
  return new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function ScoreBar({ percent }) {
  const color = percent >= 80 ? '#10b981' : percent >= 50 ? '#6366f1' : '#f43f5e'
  return (
    <div className={styles.scoreBar}>
      <div className={styles.scoreFill} style={{ width: `${percent}%`, background: color }} />
    </div>
  )
}

const MODE_LABELS = {
  quiz:  { label: '⚡ Quick Quiz', color: 'var(--indigo-50)', text: 'var(--indigo-600)' },
  learn: { label: '🎓 Learn & Quiz', color: '#f0fdf4', text: '#16a34a' },
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardService.getStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        {/* Header */}
        <div className={styles.header}>
          <div>
            <p className={styles.greeting}>{greeting()},</p>
            <h1 className={styles.name}>{user?.name} 👋</h1>
          </div>
          {stats && stats.streak > 0 && (
            <div className={styles.streakBadge}>
              <Flame size={18} className={styles.flameIcon} />
              <span>{stats.streak} day streak</span>
            </div>
          )}
        </div>

        {/* Stat cards */}
        {loading ? (
          <div className={styles.loadingRow}>
            <Loader2 size={24} className={styles.spin} />
            <span>Loading your stats…</span>
          </div>
        ) : (
          <>
            <div className={styles.statGrid}>
              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: '#eef2ff', color: 'var(--indigo-500)' }}>
                  <BarChart2 size={22} />
                </div>
                <div className={styles.statInfo}>
                  <span className={styles.statNum}>{stats.totalQuizzes}</span>
                  <span className={styles.statLabel}>Quizzes taken</span>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: '#f0fdf4', color: '#16a34a' }}>
                  <TrendingUp size={22} />
                </div>
                <div className={styles.statInfo}>
                  <span className={styles.statNum}>{stats.avgScore}%</span>
                  <span className={styles.statLabel}>Average score</span>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: '#fff7ed', color: '#ea580c' }}>
                  <Flame size={22} />
                </div>
                <div className={styles.statInfo}>
                  <span className={styles.statNum}>{stats.streak}</span>
                  <span className={styles.statLabel}>Day streak</span>
                </div>
              </div>
            </div>

            {/* Best / Weakest topic */}
            {(stats.bestTopic || stats.weakestTopic) && (
              <div className={styles.topicRow}>
                {stats.bestTopic && (
                  <div className={`${styles.topicCard} ${styles.topicBest}`}>
                    <TrendingUp size={16} />
                    <div className={styles.topicInfo}>
                      <span className={styles.topicMeta}>Best topic</span>
                      <span className={styles.topicName}>{stats.bestTopic.topic}</span>
                    </div>
                    <span className={styles.topicScore}>{stats.bestTopic.avg}%</span>
                  </div>
                )}
                {stats.weakestTopic && stats.weakestTopic.topic !== stats.bestTopic?.topic && (
                  <div className={`${styles.topicCard} ${styles.topicWeak}`}>
                    <TrendingDown size={16} />
                    <div className={styles.topicInfo}>
                      <span className={styles.topicMeta}>Needs work</span>
                      <span className={styles.topicName}>{stats.weakestTopic.topic}</span>
                    </div>
                    <span className={styles.topicScore}>{stats.weakestTopic.avg}%</span>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Action cards */}
        <div className={styles.actionGrid}>
          <Link to="/setup" className={`${styles.actionCard} ${styles.actionQuiz}`}>
            <div className={styles.actionIcon}><Zap size={26} /></div>
            <div className={styles.actionInfo}>
              <h3>Quick Quiz</h3>
              <p>Test yourself on any topic instantly</p>
            </div>
            <ChevronRight size={20} className={styles.actionArrow} />
          </Link>

          <Link to="/learn" className={`${styles.actionCard} ${styles.actionLearn}`}>
            <div className={styles.actionIcon}><BookOpen size={26} /></div>
            <div className={styles.actionInfo}>
              <h3>Learn & Quiz</h3>
              <p>Read a lesson, then get tested on it</p>
            </div>
            <ChevronRight size={20} className={styles.actionArrow} />
          </Link>

          <Link to="/room" className={`${styles.actionCard} ${styles.actionRoom}`}>
            <div className={styles.actionIcon}><Users size={26} /></div>
            <div className={styles.actionInfo}>
              <h3>Live Room</h3>
              <p>Create a room and quiz your students</p>
            </div>
            <ChevronRight size={20} className={styles.actionArrow} />
          </Link>
        </div>

        {/* Recent activity */}
        {stats && stats.recent.length > 0 && (
          <div className={styles.recentSection}>
            <div className={styles.recentHeader}>
              <h2 className={styles.recentTitle}>
                <Clock size={17} /> Recent activity
              </h2>
              <Link to="/history" className={styles.viewAll}>View all →</Link>
            </div>
            <div className={styles.recentList}>
              {stats.recent.map((q) => (
                <Link
                  key={q.resultId}
                  to={`/results/${q.resultId}`}
                  className={styles.recentItem}
                >
                  <div className={styles.recentLeft}>
                    <span className={styles.recentTopic}>{q.topic}</span>
                    <div className={styles.recentMeta}>
                      <span className={styles.recentMode}
                        style={{
                          background: MODE_LABELS[q.mode]?.color || 'var(--indigo-50)',
                          color: MODE_LABELS[q.mode]?.text || 'var(--indigo-600)',
                        }}>
                        {MODE_LABELS[q.mode]?.label || '⚡ Quiz'}
                      </span>
                      <span className={styles.recentDate}>{formatDate(q.createdAt)}</span>
                    </div>
                  </div>
                  <div className={styles.recentRight}>
                    <ScoreBar percent={q.percent} />
                    <span className={styles.recentScore}>
                      {q.score}/{q.total}
                      <span className={styles.recentPct}> · {q.percent}%</span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {stats && stats.totalQuizzes === 0 && (
          <div className={styles.emptyState}>
            <span className={styles.emptyEmoji}>🧠</span>
            <h3>You haven't taken any quizzes yet</h3>
            <p>Pick a mode above and start learning!</p>
          </div>
        )}

      </div>
    </div>
  )
}