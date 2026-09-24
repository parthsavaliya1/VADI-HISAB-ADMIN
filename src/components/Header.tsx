import { LogOut, Menu, Search } from "lucide-react"
import type { SessionUser } from "../api"

export default function Header({
  user,
  query,
  onQuery,
  onMenu,
  onSignOut,
}: {
  user: SessionUser
  query: string
  onQuery: (value: string) => void
  onMenu: () => void
  onSignOut: () => void
}) {
  return (
    <header>
      <button className="menu-button" onClick={onMenu}><Menu /></button>
      <label className="header-search">
        <Search size={17} />
        <input value={query} onChange={(event) => onQuery(event.target.value)} placeholder="Search users, mobile, village or district" />
      </label>
      <div className="admin-profile">
        <div className="avatar">A</div>
        <div>
          <b>Admin</b>
          <small>+91 {user.phone}</small>
        </div>
        <button title="Sign out" onClick={onSignOut}><LogOut size={18} /></button>
      </div>
    </header>
  )
}
