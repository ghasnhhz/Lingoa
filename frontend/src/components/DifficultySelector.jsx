import styles from './DifficultySelector.module.css'

const LEVELS = [
  {
    id:    'beginner',
    emoji: '🟢',
    label: 'Beginner',
    desc:  'Basic definitions & simple recall',
  },
  {
    id:    'intermediate',
    emoji: '🟡',
    label: 'Intermediate',
    desc:  'Understanding & application',
  },
  {
    id:    'advanced',
    emoji: '🔴',
    label: 'Advanced',
    desc:  'Analysis, edge cases & deep understanding',
  },
]

export default function DifficultySelector({ value, onChange }) {
  return (
    <div className={styles.grid}>
      {LEVELS.map((level) => (
        <button
          key={level.id}
          type="button"
          className={`${styles.card} ${value === level.id ? styles.active : ''} ${styles[level.id]}`}
          onClick={() => onChange(level.id)}
        >
          <span className={styles.emoji}>{level.emoji}</span>
          <span className={styles.label}>{level.label}</span>
          <span className={styles.desc}>{level.desc}</span>
          {value === level.id && <span className={styles.check}>✓</span>}
        </button>
      ))}
    </div>
  )
}