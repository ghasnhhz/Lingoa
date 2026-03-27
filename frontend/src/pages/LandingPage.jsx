import { Link } from 'react-router-dom'
import { Sparkles, ArrowRight, Zap, BookOpen, Users, CheckCircle, Share2, Clock } from 'lucide-react'
import styles from './LandingPage.module.css'

const MODES = [
  {
    emoji: '⚡',
    title: 'Quick Quiz',
    desc: 'Already know a topic? Jump straight in. Enter anything and get AI-generated questions instantly.',
    href: '/setup',
    color: 'indigo',
    examples: ['Tenses', 'Gerunds', 'Modals'],
  },
  {
    emoji: '🎓',
    title: 'Learn & Quiz',
    desc: 'New to a topic? AI writes you a structured lesson first — sections, key points, summary — then quizzes you on exactly what you read.',
    href: '/learn',
    color: 'green',
    badge: 'NEW',
    examples: ['Articles', 'Conditional sentences', 'pronouns '],
  },
  {
    emoji: '🏆',
    title: 'Live Rooms',
    desc: 'Create a room, share the code with your students, and run a live quiz. Everyone answers simultaneously — leaderboard at the end.',
    href: '/room',
    color: 'purple',
    examples: ['Classroom quiz', 'Study group', 'Team challenge'],
  },
]

const FEATURES = [
  { icon: <Zap size={20}/>,         title: 'Instant AI questions',  desc: 'Questions tailored to your exact topic in seconds.' },
  { icon: <BookOpen size={20}/>,    title: 'Built-in lessons',      desc: 'Learn from a structured AI lesson before you get tested.' },
  { icon: <Users size={20}/>,       title: 'Live multiplayer',      desc: 'Run quizzes for your whole class in real time.' },
  { icon: <CheckCircle size={20}/>, title: 'Clear explanations',    desc: 'Every wrong answer comes with a clear explanation.' },
  { icon: <Clock size={20}/>,       title: 'Timed sessions',        desc: 'Practice under real exam conditions with a timer.' },
  { icon: <Share2 size={20}/>,      title: 'Shareable results',     desc: 'Each result gets a unique URL you can share.' },
]

export default function LandingPage() {
  return (
    <div className={styles.page}>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroBadge}>
          <Sparkles size={13} /> AI-powered learning platform
        </div>
        <h1 className={styles.heroTitle}>
          Learn it. Quiz it.<br /><em>Remember it.</em>
        </h1>
        <p className={styles.heroSub}>
           Lingoa runs any English topic into smart quizzes 
          — from easy to advanced — so you actually remember what you learn.
        </p>
        <div className={styles.heroCta}>
          <Link to="/register" className="btn btn-primary" style={{ fontSize: '16px', padding: '14px 32px' }}>
            <Sparkles size={16} /> Get started free
          </Link>
          <Link to="/login" className="btn btn-secondary">
            Sign in
          </Link>
        </div>
      </section>

      {/* 3 Mode cards */}
      <section className={styles.modes}>
        <div className="container">
          <h2 className={styles.sectionTitle}>Three ways to learn</h2>
          <p className={styles.sectionSub}>
            Test yourself, learn from scratch, or challenge your whole class — all powered by AI.
          </p>
          <div className={styles.modeGrid}>
            {MODES.map((m) => (
              <Link key={m.title} to="/register" className={`${styles.modeCard} ${styles[`mode_${m.color}`]}`}>
                {m.badge && <span className={styles.badge}>{m.badge}</span>}
                <div className={styles.modeEmoji}>{m.emoji}</div>
                <h3 className={styles.modeTitle}>{m.title}</h3>
                <p className={styles.modeDesc}>{m.desc}</p>
                <div className={styles.modeExamples}>
                  {m.examples.map(e => <span key={e} className={styles.examplePill}>{e}</span>)}
                </div>
                <span className={styles.modeArrow}>
                  Try it free <ArrowRight size={14} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className={styles.features}>
        <div className="container">
          <h2 className={styles.sectionTitle}>Everything you need to score higher</h2>
          <div className={styles.featureGrid}>
            {FEATURES.map((f) => (
              <div key={f.title} className={`card ${styles.featureCard}`}>
                <div className={styles.featureIcon}>{f.icon}</div>
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p className={styles.featureDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.ctaStrip}>
        <div className={styles.ctaInner}>
          <h2>Ready to start learning smarter?</h2>
          <p>Free to use. No credit card required.</p>
          <Link to="/register" className="btn btn-primary" style={{ fontSize: '15px' }}>
            <Sparkles size={15} /> Create free account
          </Link>
        </div>
      </section>

    </div>
  )
}