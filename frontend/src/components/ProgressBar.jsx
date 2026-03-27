import styles from './ProgressBar.module.css'

export default function ProgressBar({ current, total }) {
  const percent = Math.round((current / total) * 100)

  return (
    <div className={styles.wrapper}>
      <div className={styles.info}>
        <span className={styles.label}>Question {current} of {total}</span>
        <span className={styles.percent}>{percent}%</span>
      </div>
      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}