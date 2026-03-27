import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import FeedbackButton from './components/FeedbackButton'
import { useEffect } from 'react'
import { logEvent } from 'firebase/analytics'
import { analytics } from './firebase'

import LandingPage      from './pages/LandingPage'
import DashboardPage    from './pages/DashboardPage'
import LoginPage        from './pages/LoginPage'
import RegisterPage     from './pages/RegisterPage'
import SetupPage        from './pages/SetupPage'
import QuizPage         from './pages/QuizPage'
import ResultsPage      from './pages/ResultsPage'
import HistoryPage      from './pages/HistoryPage'
import LearnSetupPage   from './pages/LearnSetupPage'
import LessonPage       from './pages/LessonPage'
import LearnResultsPage from './pages/LearnResultsPage'
import RoomCreatePage   from './pages/RoomCreatePage'
import RoomJoinPage     from './pages/RoomJoinPage'
import RoomLobbyPage    from './pages/RoomLobbyPage'
import RoomQuizPage     from './pages/RoomQuizPage'
import RoomResultsPage  from './pages/RoomResultsPage'

const P = ({ children }) => <ProtectedRoute>{children}</ProtectedRoute>

// Smart home — landing for guests, dashboard for logged-in users
function HomeRoute() {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Navigate to="/dashboard" replace /> : <LandingPage />
}

export default function App() {
  useEffect(() => {
    logEvent(analytics, 'app_open')
  }, [])
  return (
    <AuthProvider>
      <BrowserRouter>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navbar />
          <Routes>            {/* Smart home */}
            <Route path="/" element={<HomeRoute />} />

            {/* Auth */}
            <Route path="/login"    element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Dashboard */}
            <Route path="/dashboard" element={<P><DashboardPage /></P>} />

            {/* Shareable results — public */}
            <Route path="/results/:resultId" element={<ResultsPage />} />

            {/* Quick Quiz */}
            <Route path="/setup"   element={<P><SetupPage /></P>} />
            <Route path="/quiz"    element={<P><QuizPage /></P>} />
            <Route path="/history" element={<P><HistoryPage /></P>} />

            {/* Learn & Quiz */}
            <Route path="/learn"         element={<P><LearnSetupPage /></P>} />
            <Route path="/learn/lesson"  element={<P><LessonPage /></P>} />
            <Route path="/learn/results" element={<P><LearnResultsPage /></P>} />

            {/* Rooms */}
            <Route path="/room"               element={<P><RoomCreatePage /></P>} />
            <Route path="/room/:code"         element={<RoomJoinPage />} />
            <Route path="/room/:code/lobby"   element={<P><RoomLobbyPage /></P>} />
            <Route path="/room/:code/quiz"    element={<P><RoomQuizPage /></P>} />
            <Route path="/room/:code/results" element={<RoomResultsPage />} />
          </Routes>
          <FeedbackButton />
        </div>

        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              fontFamily: 'DM Sans, sans-serif', fontSize: '14px',
              borderRadius: '12px', border: '1px solid #e0e7ff',
              boxShadow: '0 8px 32px rgba(99,102,241,0.15)',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#f43f5e', secondary: '#fff' } },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  )
}