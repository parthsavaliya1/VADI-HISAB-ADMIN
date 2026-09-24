import { useEffect, useState } from "react"
import { ChevronDown, Search, X } from "lucide-react"
import { getUsers } from "../api"
import type { AdminUser } from "../api"
import { nameOf } from "../utils/format"

export default function FarmerPicker({
  userId,
  label,
  onChange,
}: {
  userId: string
  label: string
  onChange: (userId: string, label: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [users, setUsers] = useState<AdminUser[]>([])

  useEffect(() => {
    const id = setTimeout(async () => {
      try {
        const result = await getUsers({ page: 1, limit: 40, search: query })
        setUsers(result.data || [])
      } catch {
        setUsers([])
      }
    }, 200)
    return () => clearTimeout(id)
  }, [query])

  function choose(user?: AdminUser) {
    if (!user) {
      onChange("", "All farmers")
    } else {
      onChange(user.id, `${nameOf(user)} · ${user.phone}`)
    }
    setOpen(false)
    setQuery("")
  }

  return (
    <div className={`farmer-picker ${open ? "open" : ""}`}>
      <button type="button" className="farmer-trigger" onClick={() => setOpen((value) => !value)}>
        <span>{label}</span>
        <ChevronDown size={16} />
      </button>
      {open && (
        <div className="farmer-menu">
          <div className="search-box">
            <Search size={16} />
            <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a farmer" />
          </div>
          <button type="button" className={!userId ? "active" : ""} onClick={() => choose()}>All farmers</button>
          {users.map((user) => (
            <button type="button" key={user.id} className={user.id === userId ? "active" : ""} onClick={() => choose(user)}>
              <b>{nameOf(user)}</b>
              <small>+91 {user.phone}{user.profile?.village ? ` · ${user.profile.village}` : ""}</small>
            </button>
          ))}
          {!users.length && <p>No farmers match that search.</p>}
          <button type="button" className="picker-close" onClick={() => setOpen(false)}><X size={14} /> Close</button>
        </div>
      )}
    </div>
  )
}
