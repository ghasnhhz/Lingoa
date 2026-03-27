import styles from './LoadingScreen.module.css'

const FACTS = [
  "Spacing out information over time improves retention by up to 80%.",
  "Testing yourself is more effective than re-reading notes.",
  "The brain consolidates memory during sleep — rest after studying!",
  "Active recall beats passive review every time.",
  "Making mistakes is one of the best ways to learn.",
]

export default function LoadingScreen({ topic, count }) {
  const fact = FACTS[Math.floor(Math.random() * FACTS.length)]

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <div className={styles.orbWrap}>
          <div className={styles.orb} />
          <div className={styles.orbRing} />
          <div className={styles.orbRing2} />
        </div>

        <h2 className={styles.title}>Crafting your quiz…</h2>
        <p className={styles.sub}>
          Generating <strong>{count} questions</strong> about <strong>{topic}</strong>
        </p>

        <div className={styles.bar}>
          <div className={styles.barFill} />
        </div>

        <div className={styles.factBox}>
          <span className={styles.factIcon}>💡</span>
          <p className={styles.fact}>{fact}</p>
        </div>
      </div>
    </div>
  )
}