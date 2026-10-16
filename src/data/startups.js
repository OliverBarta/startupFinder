// Filter and form option lists. The listings themselves come from the Supabase `listings` table.
export const SECTORS = ['AI', 'Climate', 'Dev tools', 'Fintech', 'Health', 'Education']
export const STAGES = ['Pre-seed', 'Seed', 'Series A', 'Series B+']
export const SIZES = ['1–10', '11–50', '51–200']

// Browse's "Sort by" dropdown. Home.jsx does the sorting.
export const SORTS = [
  { value: 'recent', label: 'Recently added' },
  { value: 'saved', label: 'Most saved' },
  { value: 'name', label: 'Name A–Z' },
]

// Logo background colours founders can pick from when listing a startup.
export const LOGO_COLORS = ['#C6F432', '#A5B4FC', '#FDBA74', '#93C5FD', '#F9A8D4', '#FDE68A', '#86EFAC', '#C4B5FD', '#67E8F9']
