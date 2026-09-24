import { Leaf, X } from "lucide-react"
import { LayoutDashboard, ShieldCheck, ShoppingBasket, UsersRound, Wallet } from "lucide-react"
import type { Page } from "../types"

const nav = [
  { id: "dashboard" as Page, label: "Dashboard", icon: LayoutDashboard },
  { id: "users" as Page, label: "Users", icon: UsersRound },
  { id: "accounts" as Page, label: "Income & Expense", icon: Wallet },
  { id: "listings" as Page, label: "Market Listings", icon: ShoppingBasket },
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
      <button className="mobile-close" onClick={onClose}><X /></button>
      <div className="brand">
        <img className="brand-logo" src="/vadi-logo-light.png" alt="VADI" />
      </div>
      <nav>
        {nav.map(({ id, label, icon: Icon }) => (
          <button key={id} className={page === id ? "active" : ""} onClick={() => onNavigate(id)}>
            <Icon size={19} />
            {label}
          </button>
        ))}
      </nav>
      <div className="sidebar-note">
        <Leaf />
        <b>ખેડૂત સાથે<br />સમૃદ્ધ ગુજરાત</b>
        <small>Growing Together<br />with Farmers</small>
      </div>
    </aside>
  )
}
