import styles from './ResultCard.module.css'

const OPTION_LABELS = ['A', 'B', 'C', 'D']

function shortExplanation(text) {
  const t = (text || '').trim()
  if (!t) return ''
  const firstSentence = t.split(/(?<=[.!?])\s+/)[0] || t
  return firstSentence.length > 140 ? `${firstSentence.slice(0, 140)}…` : firstSentence
}

export default function ResultCard({ result, index, shortExplanationOnly = false }) {
  const isCorrect = result.isCorrect
  const short = !isCorrect ? shortExplanation(result.explanation) : ''

  return (
    <div className={`${styles.card} ${isCorrect ? styles.correct : styles.wrong}`}>
      <div className={styles.header}>
        <span className={styles.number}>Q{index + 1}</span>
        <span className={`${styles.badge} ${isCorrect ? styles.badgeCorrect : styles.badgeWrong}`}>
          {isCorrect ? '✓ Correct' : '✗ Incorrect'}
        </span>
      </div>

      <p className={styles.question}>{result.question}</p>

      <div className={styles.answers}>
        {!isCorrect && (
          <div className={styles.answerRow}>
            <span className={styles.answerLabel}>Your answer:</span>
            <span className={`${styles.answerBadge} ${styles.wrong}`}>
              {OPTION_LABELS[result.selectedIndex]} — {result.options[result.selectedIndex]}
            </span>
          </div>
        )}
        <div className={styles.answerRow}>
          <span className={styles.answerLabel}>Correct answer:</span>
          <span className={`${styles.answerBadge} ${styles.correct}`}>
            {OPTION_LABELS[result.correctIndex]} — {result.options[result.correctIndex]}
          </span>
        </div>
      </div>

      {!isCorrect && result.explanation && (
        <div className={styles.explanation}>
          <span className={styles.explanationIcon}>💡</span>
          <p>{shortExplanationOnly ? short : result.explanation}</p>
        </div>
      )}
    </div>
  )
}