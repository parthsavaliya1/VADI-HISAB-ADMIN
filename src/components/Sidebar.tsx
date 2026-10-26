import { X } from "lucide-react"
import { LayoutDashboard, ShieldCheck, ShoppingBasket, Stethoscope, UsersRound, Wallet } from "lucide-react"
import type { Page } from "../types"

const nav = [
  { id: "dashboard" as Page, label: "Dashboard", icon: LayoutDashboard },
  { id: "users" as Page, label: "Users", icon: UsersRound },
  { id: "accounts" as Page, label: "Income & Expense", icon: Wallet },
  { id: "listings" as Page, label: "Market Listings", icon: ShoppingBasket },
  { id: "crop-doctor" as Page, label: "Crop Doctor", icon: Stethoscope },
  { id: "moderation" as Page, label: "Reports & Safety", icon: ShieldCheck },
]

export default function Sidebar({
  page,
  open,
  onNavigate,
  onClose,
}: {
  page: Page
  open: boolean
  onNavigate: (page: Page) => void
  onClose: () => void
}) {
  return (
    <aside className={`sidebar ${open ? "open" : ""}`}>
      <button className="mobile-close" aria-label="Close navigation" onClick={onClose}><X /></button>
      <div className="brand">
        <img className="console-logo" src="/vadi-hisab-logo-original.png" alt="VADI" /><div><b>VADI Hisab</b><small>Admin</small></div>
      </div>
      <nav aria-label="Admin navigation">
        {nav.map(({ id, label, icon: Icon }) => (
          <button key={id} aria-current={page === id ? "page" : undefined} className={page === id ? "active" : ""} onClick={() => onNavigate(id)}>
            <Icon size={19} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-account">
        <div className="avatar">A</div>
        <div><b>Administrator</b><small>Hisab workspace</small></div>
      </div>
    </aside>
  )
}
