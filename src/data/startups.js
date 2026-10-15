// Sample listings from the design mockup — replace with real data later.
const BLURB =
  'Sample listing — a one-line description of what this startup builds and who it’s for.'

export const STARTUPS = [
  { id: 1, name: 'Sample Co. Alpha', initials: 'SA', location: 'Waterloo, ON', founded: 2024, sector: 'Climate', stage: 'Seed', size: '11–50', hiring: true, blurb: BLURB, logoColor: '#C6F432' },
  { id: 2, name: 'Sample Co. Beta', initials: 'SB', location: 'Toronto, ON', founded: 2023, sector: 'Dev tools', stage: 'Series A', size: '11–50', hiring: true, blurb: BLURB, logoColor: '#A5B4FC' },
  { id: 3, name: 'Sample Co. Gamma', initials: 'SG', location: 'Montréal, QC', founded: 2025, sector: 'Health', stage: 'Pre-seed', size: '1–10', hiring: false, blurb: BLURB, logoColor: '#FDBA74' },
  { id: 4, name: 'Sample Co. Delta', initials: 'SD', location: 'Remote', founded: 2022, sector: 'Fintech', stage: 'Series B+', size: '51–200', hiring: true, blurb: BLURB, logoColor: '#93C5FD' },
  { id: 5, name: 'Sample Co. Epsilon', initials: 'SE', location: 'Vancouver, BC', founded: 2024, sector: 'AI', stage: 'Seed', size: '1–10', hiring: true, blurb: BLURB, logoColor: '#F9A8D4' },
  { id: 6, name: 'Sample Co. Zeta', initials: 'SZ', location: 'Waterloo, ON', founded: 2025, sector: 'Education', stage: 'Pre-seed', size: '1–10', hiring: false, blurb: BLURB, logoColor: '#FDE68A' },
  { id: 7, name: 'Sample Co. Eta', initials: 'SH', location: 'Ottawa, ON', founded: 2021, sector: 'AI', stage: 'Series A', size: '51–200', hiring: true, blurb: BLURB, logoColor: '#86EFAC' },
  { id: 8, name: 'Sample Co. Theta', initials: 'ST', location: 'Remote', founded: 2023, sector: 'Dev tools', stage: 'Seed', size: '1–10', hiring: false, blurb: BLURB, logoColor: '#C4B5FD' },
  { id: 9, name: 'Sample Co. Iota', initials: 'SI', location: 'Calgary, AB', founded: 2022, sector: 'Climate', stage: 'Series A', size: '11–50', hiring: true, blurb: BLURB, logoColor: '#67E8F9' },
]

export const SECTORS = ['AI', 'Climate', 'Dev tools', 'Fintech', 'Health', 'Education']
export const STAGES = ['Pre-seed', 'Seed', 'Series A', 'Series B+']
export const SIZES = ['1–10', '11–50', '51–200']
