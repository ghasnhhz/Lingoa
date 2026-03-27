import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { Users, ArrowRight, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import styles from './RoomCreatePage.module.css'

export default function RoomCreatePage() {
  const { user }  = useAuth()
  const navigate  = useNavigate()
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    setLoading(true)
    try {
      const { data } = await api.post('/room/create')
      navigate(`/room/${data.code}/lobby`, { state: { isTeacher: true } })
    } catch (err) {
      toast.error('Failed to create room. Try again.')
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.icon}><Users size={32} /></div>
        <h1 className={styles.title}>Create a Quiz Room</h1>
        <p className={styles.subtitle}>
          A 6-digit code will be generated. Share it with your students
          and start a live quiz when everyone has joined.
        </p>

        <div className={styles.features}>
          {[
            { emoji: '👥', text: 'Students join with a code — no account needed' },
            { emoji: '⚡', text: 'AI generates questions on any topic instantly' },
            { emoji: '🏆', text: 'Live leaderboard shown after everyone finishes' },
            { emoji: '⏱', text: 'Set a time limit per question' },
          ].map(f => (
            <div key={f.emoji} className={styles.feature}>
              <span>{f.emoji}</span>
              <span>{f.text}</span>
            </div>
          ))}
        </div>

        <button
          className="btn btn-primary"
          onClick={handleCreate}
          disabled={loading}
          style={{ fontSize: '16px', padding: '14px 40px' }}
        >
          {loading
            ? <><Loader2 size={18} className={styles.spin} /> Creating room…</>
            : <><ArrowRight size={18} /> Create room</>}
        </button>
      </div>
    </div>
  )
}