import { useMemo, useState } from 'react'
import { SURVEY_FIELDS } from './surveySchema.js'

function emptyAnswers() {
  const answers = {}
  for (const field of SURVEY_FIELDS) {
    answers[field.name] = field.type === 'multi-select' ? [] : ''
  }
  return answers
}

function missingRequired(answers) {
  return SURVEY_FIELDS.filter((field) => {
    if (field.optional) return false
    const value = answers[field.name]
    if (field.type === 'multi-select') return !value || value.length === 0
    return String(value ?? '').trim() === ''
  })
}

function FieldInput({ field, value, onChange, students }) {
  if (field.type === 'name') {
    return (
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select your name</option>
        {students.map((s) => (
          <option key={s.id} value={s.name}>
            {s.name}
          </option>
        ))}
      </select>
    )
  }

  if (field.type === 'dropdown') {
    return (
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select one</option>
        {field.values.map((v) => (
          <option key={v} value={v}>
            {v}
          </option>
        ))}
      </select>
    )
  }

  if (field.type === 'scale') {
    return (
      <div className="scale">
        {field.values.map((v) => (
          <label key={v}>
            <input
              type="radio"
              name={field.name}
              value={v}
              checked={String(value) === String(v)}
              onChange={() => onChange(v)}
            />
            {v}
          </label>
        ))}
      </div>
    )
  }

  if (field.type === 'multi-select') {
    const selected = value || []
    return (
      <div className="multiselect">
        {field.values.map((v) => (
          <label key={v}>
            <input
              type="checkbox"
              checked={selected.includes(v)}
              onChange={(e) => {
                onChange(
                  e.target.checked ? [...selected, v] : selected.filter((item) => item !== v),
                )
              }}
            />
            {v}
          </label>
        ))}
      </div>
    )
  }

  return (
    <textarea
      rows={3}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

export default function Survey({ students }) {
  const [answers, setAnswers] = useState(emptyAnswers)
  const [missing, setMissing] = useState([])
  const [error, setError] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)

  const missingLabels = useMemo(
    () => missing.map((name) => SURVEY_FIELDS.find((f) => f.name === name)?.label || name),
    [missing],
  )

  function update(name, value) {
    setAnswers((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const absent = missingRequired(answers)
    if (absent.length) {
      setMissing(absent.map((f) => f.name))
      setError(null)
      return
    }

    setMissing([])
    setError(null)
    setSaving(true)
    try {
      const res = await fetch('/api/survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(answers),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Backend responded ${res.status}`)
      }
      setSubmitted(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (submitted) {
    return (
      <section className="survey">
        <h2>Survey submitted</h2>
        <p>Thanks — your answers were saved.</p>
        <button
          type="button"
          className="randomize"
          onClick={() => {
            setAnswers(emptyAnswers())
            setSubmitted(false)
            setError(null)
            setMissing([])
          }}
        >
          Submit another response
        </button>
      </section>
    )
  }

  return (
    <section className="survey">
      <h2>Survey</h2>
      <p className="subtitle">All questions are required unless marked optional.</p>

      <form className="survey-form" onSubmit={handleSubmit} noValidate>
        {SURVEY_FIELDS.map((field) => (
          <label className="survey-field" key={field.name}>
            <span>
              {field.label}
              {field.optional ? ' (optional)' : ''}
            </span>
            <FieldInput
              field={field}
              value={answers[field.name]}
              onChange={(value) => update(field.name, value)}
              students={students}
            />
          </label>
        ))}

        {missingLabels.length > 0 && (
          <p className="error">
            Please fill in: {missingLabels.join(', ')}
          </p>
        )}
        {error && <p className="error">{error}</p>}

        <button className="randomize" type="submit" disabled={saving}>
          {saving ? 'Submitting…' : 'Submit'}
        </button>
      </form>
    </section>
  )
}
