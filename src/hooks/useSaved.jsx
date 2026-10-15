import { createContext, useContext, useState } from 'react'

// Saved startup IDs, shared by Browse (bookmark toggles) and the Saved page.
const SavedContext = createContext(null)

export function SavedProvider({ children }) {
  const [savedIds, setSavedIds] = useState([])

  function toggleSaved(id) {
    setSavedIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]))
  }

  return <SavedContext value={{ savedIds, toggleSaved }}>{children}</SavedContext>
}

// Provider and hook share a file on purpose; edits here do a full reload instead of fast refresh.
// eslint-disable-next-line react-refresh/only-export-components
export function useSaved() {
  return useContext(SavedContext)
}
