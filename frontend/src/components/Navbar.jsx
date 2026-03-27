import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Brain, LayoutDashboard, History, LogOut, LogIn, Sparkles, Users } from 'lucide-react'
import styles from './Navbar.module.css'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => { logout(); navigate('/') }
  const isActive = (path) => location.pathname.startsWith(path)

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <Link to={user ? '/dashboard' : '/'} className={styles.logo}>
          <div className={styles.logoIcon}><Brain size={18} /></div>
          <span className={styles.logoText}>Lingoa</span>
        </Link>

        <div className={styles.actions}>
          {user ? (
            <>
              <Link to="/dashboard" className={`${styles.link} ${isActive('/dashboard') ? styles.active : ''}`}>
                <LayoutDashboard size={16} />
                <span>Dashboard</span>
              </Link>
              <Link to="/history" className={`${styles.link} ${isActive('/history') ? styles.active : ''}`}>
                <History size={16} />
                <span>History</span>
              </Link>
              <Link to="/room" className={`${styles.link} ${isActive('/room') ? styles.active : ''}`}>
                <Users size={16} />
                <span>Rooms</span>
              </Link>
              <span className={styles.divider} />
              <span className={styles.userName}>Hi, {user.name.split(' ')[0]}</span>
              <button onClick={handleLogout} className={styles.logoutBtn}>
                <LogOut size={15} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={`btn btn-ghost ${styles.loginBtn}`}>
                <LogIn size={16} /> Sign in
              </Link>
              <Link to="/register" className="btn btn-primary" style={{ padding: '9px 20px', fontSize: '14px' }}>
                <Sparkles size={14} /> Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}