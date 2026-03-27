import { useParams, useLocation, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { RotateCcw, Home } from 'lucide-react'
import styles from './RoomResultsPage.module.css'

const MEDALS = ['🥇','🥈','🥉']

export default function RoomResultsPage() {
  const { code }    = useParams()
  const location    = useLocation()
  const navigate    = useNavigate()
  const { user }    = useAuth()
  const { leaderboard, topic, field } = location.state || {}

  if (!leaderboard) { navigate('/'); return null }

  const top3 = leaderboard.slice(0, 3)
  const rest  = leaderboard.slice(3)

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        <div className={styles.header}>
          <span className={styles.codeBadge}>{code}</span>
          <h1 className={styles.title}>Final Results</h1>
          {topic && <p className={styles.topic}>{field} · {topic}</p>}
        </div>

        {/* Podium */}
        <div className={styles.podium}>
          {/* 2nd place */}
          {top3[1] && (
            <div className={`${styles.podiumSlot} ${styles.second}`}>
              <span className={styles.medal}>🥈</span>
              <div className={styles.podiumAvatar}>{top3[1].name.charAt(0)}</div>
              <span className={styles.podiumName}>{top3[1].name}</span>
              <span className={styles.podiumScore}>{top3[1].score}/{top3[1].total}</span>
              <div className={`${styles.podiumBar} ${styles.barSecond}`} />
            </div>
          )}

          {/* 1st place */}
          {top3[0] && (
            <div className={`${styles.podiumSlot} ${styles.first}`}>
              <span className={styles.crown}>👑</span>
              <span className={styles.medal}>🥇</span>
              <div className={`${styles.podiumAvatar} ${styles.avatarFirst}`}>{top3[0].name.charAt(0)}</div>
              <span className={styles.podiumName}>{top3[0].name}</span>
              <span className={styles.podiumScore}>{top3[0].score}/{top3[0].total}</span>
              <div className={`${styles.podiumBar} ${styles.barFirst}`} />
            </div>
          )}

          {/* 3rd place */}
          {top3[2] && (
            <div className={`${styles.podiumSlot} ${styles.third}`}>
              <span className={styles.medal}>🥉</span>
              <div className={styles.podiumAvatar}>{top3[2].name.charAt(0)}</div>
              <span className={styles.podiumName}>{top3[2].name}</span>
              <span className={styles.podiumScore}>{top3[2].score}/{top3[2].total}</span>
              <div className={`${styles.podiumBar} ${styles.barThird}`} />
            </div>
          )}
        </div>

        {/* Full leaderboard */}
        <div className={styles.leaderboard}>
          <h3 className={styles.lbTitle}>Full Rankings</h3>
          {leaderboard.map((s, i) => {
            const pct = Math.round((s.score / s.total) * 100)
            return (
              <div key={s.id} className={`${styles.lbRow} ${i < 3 ? styles.lbTop : ''}`}>
                <span className={styles.lbRank}>
                  {i < 3 ? MEDALS[i] : `#${i + 1}`}
                </span>
                <div className={styles.lbAvatar}>{s.name.charAt(0)}</div>
                <span className={styles.lbName}>{s.name}</span>
                <div className={styles.lbBar}>
                  <div className={styles.lbFill} style={{ width:`${pct}%` }} />
                </div>
                <span className={styles.lbScore}>{s.score}/{s.total}</span>
                <span className={styles.lbPct}>{pct}%</span>
              </div>
            )
          })}
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <Link to="/" className="btn btn-secondary">
            <Home size={16}/> Home
          </Link>
          <Link to="/room" className="btn btn-primary">
            <RotateCcw size={16}/> New room
          </Link>
        </div>

      </div>
    </div>
  )
}