import { useEffect, useRef, useState } from "react"
import { ChevronDown, LogOut, Menu } from "lucide-react"
import type { SessionUser } from "../api"

export default function Header({ user, title, onMenu, onSignOut }: {
  user: SessionUser
  title: string
  query: string
  onQuery: (value: string) => void
  onMenu: () => void
  onSignOut: () => void
}) {
  const [open, setOpen] = useState(false)
  const accountRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    function close(event: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) setOpen(false)
    }
    function escape(event: KeyboardEvent) { if (event.key === "Escape") setOpen(false) }
    document.addEventListener("mousedown", close)
    document.addEventListener("keydown", escape)
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", escape) }
  }, [])
  return (
    <header>
      <div className="console-header-title">
        <button className="menu-button" aria-label="Open menu" onClick={onMenu}><Menu size={18} /></button>
        <div><h1>{title}</h1><p>Admin workspace</p></div>
      </div>
      <div className="console-account" ref={accountRef}>
        <button className="account-trigger" aria-expanded={open} aria-controls="account-menu" onClick={() => setOpen(!open)}>
          <span className="avatar">A</span><span>Administrator</span><ChevronDown size={16} />
        </button>
        {open && <div id="account-menu" className="account-menu">
          <div><b>Administrator</b><small>+91 {user.phone}</small></div>
          <button onClick={onSignOut}><LogOut size={15} /> Logout</button>
        </div>}
      </div>
    </header>
  )
}
