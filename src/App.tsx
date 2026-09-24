import { useEffect, useState } from "react"
import { getMe, session } from "./api"
import type { SessionUser } from "./api"
import Header from "./components/Header"
import Loading from "./components/Loading"
import Login from "./components/Login"
import Sidebar from "./components/Sidebar"
import AccountsPage from "./pages/AccountsPage"
import DashboardPage from "./pages/DashboardPage"
import FarmerPage from "./pages/FarmerPage"
import ListingsPage from "./pages/ListingsPage"
import ReviewQueuePage from "./pages/ReviewQueuePage"
import UsersPage from "./pages/UsersPage"
import type { Page } from "./types"

export default function App() {
  const [authUser, setAuthUser] = useState<SessionUser | null>(null)
  const [checking, setChecking] = useState(!!session.get())
  const [page, setPage] = useState<Page>("dashboard")
  const [profileUserId, setProfileUserId] = useState<string | null>(null)
  const [mobileNav, setMobileNav] = useState(false)
  const [search, setSearch] = useState("")

  useEffect(() => {
    if (!session.get()) return
    getMe().then((user) => {
      if (String(user.role).toLowerCase() !== "admin" && !user.isAdmin) session.clear()
      else setAuthUser(user)
    }).catch(() => session.clear()).finally(() => setChecking(false))
  }, [])

  if (checking) return <div className="app-loading"><Loading /></div>
  if (!authUser) return <Login onLogin={setAuthUser} />

  const content = profileUserId
    ? <FarmerPage userId={profileUserId} onBack={() => setProfileUserId(null)} />
    : page === "dashboard"
    ? <DashboardPage search={search} onOpenUsers={() => setPage("users")} onOpenAccounts={() => setPage("accounts")} onOpenListings={() => setPage("listings")} />
    : page === "users"
      ? <UsersPage onOpenUser={setProfileUserId} />
      : page === "accounts"
        ? <AccountsPage />
        : page === "listings"
          ? <ListingsPage onOpenUser={setProfileUserId} />
          : <ReviewQueuePage kind="reports" />

  return (
    <div className="app-shell">
      <Sidebar page={page} open={mobileNav} onNavigate={(next) => { setPage(next); setProfileUserId(null); setMobileNav(false) }} onClose={() => setMobileNav(false)} />
      <div className="main-shell">
        <Header user={authUser} query={search} onQuery={setSearch} onMenu={() => setMobileNav(true)} onSignOut={() => { session.clear(); setAuthUser(null) }} />
        <main className="content">{content}</main>
        <footer>© {new Date().getFullYear()} VADI. Built for farmers, by farmers.</footer>
      </div>
      {mobileNav && <button className="overlay" onClick={() => setMobileNav(false)} aria-label="Close menu" />}
    </div>
  )
}
