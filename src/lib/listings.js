// Mapping between rows of the Supabase `listings` table and the shape StartupCard renders.

export function initialsOf(name) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (!words.length) return 'YS'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

// A `listings` row → a startup for StartupCard and the Browse filters.
export function fromListingRow(row) {
  return {
    id: row.id,
    name: row.name,
    initials: initialsOf(row.name),
    location: row.location,
    founded: row.year,
    website: row.website,
    blurb: row.one_line_description,
    sector: row.sector,
    email: row.email,
    stage: row.stage,
    size: row.team_size,
    logoColor: row.color,
    hiring: row.hiring,
    listedAt: row.created_at,
  }
}

// The For founders form → a row to insert. Empty optional fields are stored as null.
// user_id isn't sent: it defaults to auth.uid() in the database, and RLS only allows inserting as yourself.
export function toListingRow(form) {
  return {
    name: form.name.trim(),
    location: form.location.trim() || null,
    year: form.founded ? Number(form.founded) : null,
    website: form.website.trim() || null,
    one_line_description: form.blurb.trim() || null,
    sector: form.sector,
    email: form.email.trim(),
    stage: form.stage,
    team_size: form.size,
    color: form.logoColor,
    hiring: form.hiring,
  }
}
