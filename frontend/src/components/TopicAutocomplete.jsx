import { useState, useRef, useEffect } from 'react'
import styles from './TopicAutocomplete.module.css'

const SUGGESTIONS = {
  languages: [
    'Past simple tense', 'Past continuous tense', 'Past perfect tense',
    'Present simple tense', 'Present continuous tense', 'Present perfect tense',
    'Future simple tense', 'Future continuous tense',
    'Conditional sentences', 'Zero conditional', 'First conditional',
    'Second conditional', 'Third conditional',
    'Passive voice', 'Reported speech', 'Indirect questions',
    'Phrasal verbs', 'Prepositions of time', 'Prepositions of place',
    'Articles (a, an, the)', 'Countable and uncountable nouns',
    'Comparatives and superlatives', 'Modal verbs',
    'Relative clauses', 'Gerunds and infinitives',
    'Collocations', 'Idioms', 'Linking words',
    'IELTS vocabulary', 'Academic writing', 'Formal vs informal language',
  ],
  // Languages MVP: keep the suggestions focused to avoid noise.
}

export default function TopicAutocomplete({ field, value, onChange, onKeyDown, placeholder }) {
  const [open, setOpen]       = useState(false)
  const [focused, setFocused] = useState(false)
  const wrapRef               = useRef(null)

  const suggestions = SUGGESTIONS[field] || []
  const typed = value.trim()
  const filtered = typed.length >= 1
    ? suggestions.filter(s => s.toLowerCase().includes(typed.toLowerCase()))
    : []

  // Show nothing on focus/click; only show recommendations after typing.
  const showDropdown = focused && field && typed.length >= 1

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false)
        setFocused(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = (suggestion) => {
    onChange(suggestion)
    setOpen(false)
    setFocused(false)
  }

  const handleChange = (e) => {
    onChange(e.target.value)
    setOpen(true)
  }

  const handleFocus = () => {
    setFocused(true)
    setOpen(true)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') { setOpen(false); setFocused(false) }
    if (onKeyDown) onKeyDown(e)
  }

  // Highlight matching text
  const highlight = (text) => {
    if (!value.trim()) return text
    const idx = text.toLowerCase().indexOf(value.toLowerCase())
    if (idx === -1) return text
    return (
      <>
        {text.slice(0, idx)}
        <mark className={styles.mark}>{text.slice(idx, idx + value.length)}</mark>
        {text.slice(idx + value.length)}
      </>
    )
  }

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <input
        className={`input ${styles.input} ${showDropdown ? styles.inputOpen : ''}`}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        autoComplete="off"
      />

      {showDropdown && open && (
        <div className={styles.dropdown}>
          {value.trim().length >= 1 && !suggestions.some(s => s.toLowerCase() === value.toLowerCase()) && (
            <div className={styles.customItem} onClick={() => handleSelect(value)}>
              <span className={styles.customIcon}>✏️</span>
              <span>Use "<strong>{value}</strong>"</span>
            </div>
          )}
          {filtered.map((s) => (
            <button
              key={s}
              className={styles.item}
              onMouseDown={(e) => { e.preventDefault(); handleSelect(s) }}
              type="button"
            >
              {highlight(s)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}