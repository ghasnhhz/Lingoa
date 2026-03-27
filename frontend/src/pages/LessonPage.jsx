import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { BookOpen, CheckCircle, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react'
import styles from './LessonPage.module.css'

export default function LessonPage() {
  const location = useLocation()
  const navigate  = useNavigate()

  const { lesson, questions, topic, field, count } = location.state || {}
  const [expandedSections, setExpandedSections] = useState(() =>
    Object.fromEntries((lesson?.sections || []).map((_, i) => [i, true]))
  )
  const [readConfirmed, setReadConfirmed] = useState(false)

  if (!lesson || !questions) { navigate('/learn'); return null }

  const toggleSection = (i) =>
    setExpandedSections(prev => ({ ...prev, [i]: !prev[i] }))

  const handleStartQuiz = () => {
    // Reuse the existing QuizPage — pass questions + a fake quizId handled by submit
    navigate('/quiz', {
      state: {
        quizId:    null,          // will use learnMode below
        questions,
        topic,
        field,
        learnMode: true,          // flag so QuizPage knows to skip DB submit
        lesson,                   // pass lesson for results context
      }
    })
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerMeta}>
            <span className={styles.fieldBadge}>{field}</span>
            <span className={styles.lessonLabel}>
              <BookOpen size={13} /> Lesson
            </span>
          </div>
          <h1 className={styles.lessonTitle}>{lesson.title}</h1>
          <p className={styles.lessonHint}>
            Read through the lesson, then take a {count}-question quiz based on it.
          </p>
        </div>

        {/* Sections */}
        <div className={styles.sections}>
          {lesson.sections.map((section, i) => (
            <div key={i} className={styles.sectionCard}>
              <button
                className={styles.sectionHeader}
                onClick={() => toggleSection(i)}
                type="button"
              >
                <span className={styles.sectionNum}>{i + 1}</span>
                <span className={styles.sectionHeading}>{section.heading}</span>
                {expandedSections[i]
                  ? <ChevronUp size={18} className={styles.chevron} />
                  : <ChevronDown size={18} className={styles.chevron} />}
              </button>
              {expandedSections[i] && (
                <div className={styles.sectionContent}>
                  {section.content.split('\n').filter(Boolean).map((para, j) => (
                    <p key={j} className={styles.para}>{para}</p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Key Points */}
        <div className={styles.keyPoints}>
          <h3 className={styles.keyPointsTitle}>
            <span className={styles.keyIcon}>🔑</span> Key points
          </h3>
          <ul className={styles.keyList}>
            {lesson.keyPoints.map((point, i) => (
              <li key={i} className={styles.keyItem}>
                <CheckCircle size={15} className={styles.keyCheck} />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Summary */}
        <div className={styles.summary}>
          <h3 className={styles.summaryTitle}>📋 Summary</h3>
          <p className={styles.summaryText}>{lesson.summary}</p>
        </div>

        {/* Ready CTA */}
        <div className={styles.cta}>
          <div className={styles.ctaCard}>
            <div className={styles.ctaLeft}>
              <h3 className={styles.ctaTitle}>Ready to test yourself?</h3>
              <p className={styles.ctaDesc}>
                You'll get <strong>{count} questions</strong> based on exactly this lesson.
                No outside knowledge needed.
              </p>
              <label className={styles.confirmLabel}>
                <input
                  type="checkbox"
                  checked={readConfirmed}
                  onChange={(e) => setReadConfirmed(e.target.checked)}
                  className={styles.confirmCheck}
                />
                I've read the lesson and I'm ready
              </label>
            </div>
            <button
              className={`btn btn-primary ${styles.ctaBtn}`}
              onClick={handleStartQuiz}
              disabled={!readConfirmed}
            >
              Start quiz <ArrowRight size={16} />
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}