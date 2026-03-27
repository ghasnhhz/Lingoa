import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { useRoom } from '../hooks/useRoom'
import { Users, ArrowRight, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import styles from './RoomJoinPage.module.css'

export default function RoomJoinPage() {
  const { code }  = useParams()
  const navigate  = useNavigate()
  const { user }  = useAuth()
  const [room,    setRoom]    = useState(null)
  const [name,    setName]    = useState(user?.name || '')
  const [loading, setLoading] = useState(false)
  const [joining, setJoining] = useState(false)

  const { emit } = useRoom({
    'room:joined': (data) => {
      navigate(`/room/${code}/lobby`, {
        state: { isTeacher: false, studentId: data.studentId, name, roomData: data }
      })
    },
    'room:error': (data) => {
      toast.error(data.message)
      setJoining(false)
    },
  })

  useEffect(() => {
    const fetchRoom = async () => {
      setLoading(true)
      try {
        const { data } = await api.get(`/room/${code}`)
        setRoom(data)
        if (data.status === 'finished') {
          toast.error('This room has already ended')
          navigate('/')
        }
      } catch {
        toast.error('Room not found')
        navigate('/')
      } finally {
        setLoading(false)
      }
    }
    fetchRoom()
  }, [code])

  const handleJoin = () => {
    if (!name.trim()) return toast.error('Please enter your name')
    setJoining(true)
    emit('room:join', { code: code.toUpperCase(), name: name.trim(), userId: user?.id || null })
  }

  if (loading) return (
    <div className={styles.page}>
      <div className={styles.card}>
        <Loader2 size={28} className={styles.spin} />
        <p>Loading room…</p>
      </div>
    </div>
  )

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.codeBadge}>{code.toUpperCase()}</div>
        <h1 className={styles.title}>Join the room</h1>
        {room && (
          <p className={styles.teacher}>
            Hosted by <strong>{room.teacher?.name}</strong>
            {' · '}{room.studentCount} student{room.studentCount !== 1 ? 's' : ''} joined
          </p>
        )}

        <div className={styles.field}>
          <label className="label">Your name</label>
          <input
            className="input"
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
            autoFocus
          />
        </div>

        <button
          className="btn btn-primary"
          onClick={handleJoin}
          disabled={joining || !name.trim()}
          style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
        >
          {joining
            ? <><Loader2 size={16} className={styles.spin} /> Joining…</>
            : <><ArrowRight size={16} /> Join room</>}
        </button>
      </div>
    </div>
  )
}