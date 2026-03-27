import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { MessageSquare, X, Send, Loader2, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import styles from './FeedbackButton.module.css'

export default function FeedbackButton() {
  const { user } = useAuth()
  const [open,     setOpen]     = useState(false)
  const [message,  setMessage]  = useState('')
  const [loading,  setLoading]  = useState(false)
  const [sent,     setSent]     = useState(false)

  const handleSend = async () => {
    if (!message.trim()) return
    setLoading(true)
    try {
      await api.post('/feedback', {
        message:  message.trim(),
        userName: user?.name || 'Anonymous',
      })
      setSent(true)
      setMessage('')
      setTimeout(() => {
        setSent(false)
        setOpen(false)
      }, 2000)
    } catch {
      toast.error('Failed to send. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSend()
  }

  return (
    <>
      {/* Popup */}
      {open && (
        <div className={styles.popup}>
          <div className={styles.popupHeader}>
            <span className={styles.popupTitle}>Send feedback</span>
            <button className={styles.closeBtn} onClick={() => { setOpen(false); setMessage('') }}>
              <X size={16} />
            </button>
          </div>

          {sent ? (
            <div className={styles.sentState}>
              <CheckCircle size={32} className={styles.sentIcon} />
              <p>Thanks for your feedback!</p>
            </div>
          ) : (
            <>
              <textarea
                className={styles.textarea}
                placeholder="What's on your mind? Bug, idea, or suggestion…"
                value={message}
                onChange={e => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={4}
                autoFocus
              />
              <div className={styles.popupFooter}>
                <span className={styles.hint}>⌘ Enter to send</span>
                <button
                  className="btn btn-primary"
                  onClick={handleSend}
                  disabled={loading || !message.trim()}
                  style={{ padding: '9px 18px', fontSize: '14px' }}
                >
                  {loading
                    ? <><Loader2 size={14} className={styles.spin} /> Sending…</>
                    : <><Send size={14} /> Send</>}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Floating trigger button */}
      <button
        className={`${styles.trigger} ${open ? styles.triggerActive : ''}`}
        onClick={() => setOpen(v => !v)}
        title="Send feedback"
      >
        {open ? <X size={20} /> : <MessageSquare size={20} />}
        {!open && <span>Feedback</span>}
      </button>
    </>
  )
}