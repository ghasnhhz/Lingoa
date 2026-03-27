import styles from './QuestionCard.module.css'

const OPTION_LABELS = ['A', 'B', 'C', 'D']

export default function QuestionCard({ question, selectedIndex, onSelect, revealed }) {
  return (
    <div className={`${styles.card} animate-scaleIn`}>
      <p className={styles.questionText}>{question.question}</p>

      <div className={styles.options}>
        {question.options.map((option, i) => {
          let state = ''
          if (revealed) {
            if (i === question.correctIndex) state = 'correct'
            else if (i === selectedIndex && i !== question.correctIndex) state = 'wrong'
          } else if (i === selectedIndex) {
            state = 'selected'
          }

          return (
            <button
              key={i}
              className={`${styles.option} ${state ? styles[state] : ''}`}
              onClick={() => !revealed && onSelect(i)}
              disabled={revealed}
              type="button"
            >
              <span className={styles.label}>{OPTION_LABELS[i]}</span>
              <span className={styles.text}>{option}</span>
              {revealed && i === question.correctIndex && (
                <span className={styles.checkmark}>✓</span>
              )}
              {revealed && i === selectedIndex && i !== question.correctIndex && (
                <span className={styles.xmark}>✗</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}