export const SURVEY_FIELDS = [
  {
    name: 'name',
    label: 'Your name',
    type: 'name',
    optional: false,
  },
  {
    name: 'school_year',
    label: 'What year are you?',
    type: 'dropdown',
    values: ['First-year', 'Sophomore', 'Junior', 'Senior', 'Other'],
    optional: false,
  },
  {
    name: 'working_style',
    label: 'Describe your working style in 1–2 sentences',
    type: 'text',
    optional: false,
  },
]
