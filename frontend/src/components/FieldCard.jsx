import styles from './FieldCard.module.css'

export default function FieldCard({ field, selected, onClick }) {
  return (
    <button
      className={`${styles.card} ${selected ? styles.selected : ''}`}
      onClick={() => onClick(field.id)}
      type="button"
    >
      <span className={styles.emoji}>{field.emoji}</span>
      <span className={styles.name}>{field.name}</span>
      {selected && <span className={styles.check}>✓</span>}
    </button>
  )
}