import { useCallback, useEffect, useState } from "react"
import type { FormEvent } from "react"
import {
  Bell, Boxes, ChevronLeft, ChevronRight, CircleDollarSign, FileWarning, Gauge,
  Handshake, LayoutDashboard, Leaf, LoaderCircle, LogOut, Menu, MessageSquareText,
  PackageCheck, Search, Send, ShieldCheck, ShoppingBasket, Sprout, UserRoundCog,
  UsersRound, X,
} from "lucide-react"
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts"
import {
  getDashboard, getMe, getPendingListings, getReports, getUsers, moderateListing,
  sendBroadcast, sendOtp, session, updateReport,
  updateUser, verifyOtp,
} from "./api"
import type { AdminUser, DashboardData } from "./api"

type Page = "dashboard" | "users" | "listings" | "moderation" | "notifications" | "modules"
type AuthUser = Awaited<ReturnType<typeof getMe>>

const nav = [
  { id: "dashboard" as Page, label: "Dashboard", icon: LayoutDashboard },
  { id: "users" as Page, label: "Users", icon: UsersRound },
  { id: "listings" as Page, label: "Market Listings", icon: ShoppingBasket },
  { id: "moderation" as Page, label: "Reports & Safety", icon: ShieldCheck },
  { id: "notifications" as Page, label: "Notifications", icon: Bell },
  { id: "modules" as Page, label: "All Modules", icon: Boxes },
]

function nameOf(user: AdminUser) {
  return user.profile?.name || "VADI User"
}

function formatDate(value?: string | null) {
  if (!value) return "—"
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value))
}

function Login({ onLogin }: { onLogin: (user: AuthUser) => void }) {
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState("")
  const [sessionId, setSessionId] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError("")
    try {
      if (!sessionId) {
        const result = await sendOtp(phone.replace(/\D/g, "").slice(-10))
        setSessionId(result.sessionId)
      } else {
        const user = await verifyOtp(phone.replace(/\D/g, "").slice(-10), otp, sessionId)
        if (String(user.role).toLowerCase() !== "admin" && !user.isAdmin) {
          session.clear()
          throw new Error("This account does not have admin access.")
        }
        onLogin(user)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in")
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-visual">
        <div className="brand brand-light"><span className="brand-mark">🌱</span><div><b>VADI</b><small>Admin Panel</small></div></div>
        <div className="login-message">
          <span className="eyebrow">Built for farmers, managed with care</span>
          <h1>Grow impact.<br />Manage smarter.</h1>
          <p>A single place to support VADI users, moderate the community, and run daily operations.</p>
        </div>
      </section>
      <section className="login-card-wrap">
        <form className="login-card" onSubmit={submit}>
          <div className="login-icon"><Leaf size={28} /></div>
          <h2>Admin sign in</h2>
          <p>Use your registered VADI admin mobile number.</p>
          <label>Mobile number</label>
          <div className="phone-input"><span>+91</span><input autoFocus={!sessionId} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98765 43210" disabled={!!sessionId} required /></div>
          {sessionId && <><label>One-time password</label><input className="text-input" autoFocus value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="Enter 6-digit OTP" required /></>}
          {error && <div className="alert error">{error}</div>}
          <button className="primary wide" disabled={busy || phone.replace(/\D/g, "").length < 10}>{busy && <LoaderCircle className="spin" size={18} />}{sessionId ? "Verify & sign in" : "Send OTP"}</button>
          {sessionId && <button className="link-button" type="button" onClick={() => { setSessionId(""); setOtp(""); setError("") }}>Change mobile number</button>}
        </form>
      </section>
    </main>
  )
}

function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState("")
  useEffect(() => { getDashboard().then(setData).catch((e) => setError(e.message)) }, [])
  if (error) return <EmptyState title="Dashboard unavailable" detail={error} />
  if (!data) return <Loading />

  const cards = [
    { label: "Total Users", value: data.metrics.totalUsers, icon: UsersRound, tone: "green" },
    { label: "Farmers", value: data.metrics.farmers, icon: Sprout, tone: "blue" },
    { label: "Growth Partners", value: data.metrics.dealers, icon: Handshake, tone: "orange" },
    { label: "Market Listings", value: data.metrics.listings, icon: ShoppingBasket, tone: "purple" },
    { label: "Dealer Bills", value: data.metrics.dealerBills, icon: CircleDollarSign, tone: "pink" },
  ]

  return (
    <>
      <PageTitle title="Welcome back, Admin! 🌿" subtitle="Here’s what’s happening with VADI today." />
      <div className="metric-grid">
        {cards.map(({ label, value, icon: Icon, tone }) => <article className={`metric-card ${tone}`} key={label}><div className="metric-icon"><Icon /></div><div><span>{label}</span><strong>{value.toLocaleString("en-IN")}</strong><small>Live from VADI</small></div></article>)}
      </div>
      <div className="dashboard-grid">
        <section className="panel chart-panel">
          <PanelHead title="User Growth" subtitle="New registrations in the last 7 days" />
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data.growth}><defs><linearGradient id="growth" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#16885b" stopOpacity={0.3}/><stop offset="95%" stopColor="#16885b" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9efec"/><XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString("en-IN", { weekday: "short" })} axisLine={false} tickLine={false}/><YAxis allowDecimals={false} axisLine={false} tickLine={false}/><Tooltip/><Area type="monotone" dataKey="users" stroke="#16885b" strokeWidth={3} fill="url(#growth)"/></AreaChart>
          </ResponsiveContainer>
        </section>
        <section className="panel health-panel">
          <PanelHead title="Platform Health" subtitle="Items needing attention" />
          <Health label="Pending reports" value={data.metrics.pendingReports} icon={FileWarning} urgent={data.metrics.pendingReports > 0} />
          <Health label="Blocked users" value={data.metrics.blockedUsers} icon={UserRoundCog} />
          <Health label="Community posts" value={data.metrics.feedPosts} icon={MessageSquareText} />
          <Health label="Active listings" value={data.metrics.listings} icon={PackageCheck} />
        </section>
      </div>
      <section className="panel">
        <PanelHead title="Recent Users" subtitle="Latest VADI registrations" />
        <UserTable users={data.recentUsers} compact />
      </section>
    </>
  )
}

function Users() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [search, setSearch] = useState("")
  const [role, setRole] = useState("all")
  const [status, setStatus] = useState("all")
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState("")

  const load = useCallback(async (page = 1) => {
    setBusy(true)
    setError("")
    try {
      const result = await getUsers({ page, search, role, status })
      setUsers(result.data)
      setPagination({ page: result.pagination.page, pages: result.pagination.pages, total: result.pagination.total })
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to load users") }
    finally { setBusy(false) }
  }, [search, role, status])

  // The debounce intentionally refreshes server data whenever a filter changes.
  // oxlint-disable react/set-state-in-effect
  useEffect(() => { const id = setTimeout(() => load(1), 250); return () => clearTimeout(id) }, [load])
  // oxlint-enable react/set-state-in-effect

  async function patchUser(user: AdminUser, payload: { isBlocked?: boolean; role?: string }) {
    try {
      const updated = await updateUser(user.id, payload)
      setUsers((rows) => rows.map((row) => row.id === user.id ? updated : row))
    } catch (e) { setError(e instanceof Error ? e.message : "Update failed") }
  }

  return (
    <>
      <PageTitle title="Users" subtitle={`${pagination.total.toLocaleString("en-IN")} registered accounts`} />
      <section className="panel">
        <div className="filters">
          <div className="search-box"><Search size={18}/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, mobile, village or district" /></div>
          <select value={role} onChange={(e) => setRole(e.target.value)}><option value="all">All roles</option><option value="farmer">Farmers</option><option value="dealer">Dealers</option><option value="admin">Admins</option></select>
          <select value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">All status</option><option value="active">Active</option><option value="blocked">Blocked</option></select>
        </div>
        {error && <div className="alert error">{error}</div>}
        {busy ? <Loading /> : <UserTable users={users} onRole={(user, nextRole) => patchUser(user, { role: nextRole })} onBlock={(user) => patchUser(user, { isBlocked: !user.isBlocked })} />}
        <div className="pagination"><button disabled={pagination.page <= 1} onClick={() => load(pagination.page - 1)}><ChevronLeft size={17}/> Previous</button><span>Page {pagination.page} of {Math.max(1, pagination.pages)}</span><button disabled={pagination.page >= pagination.pages} onClick={() => load(pagination.page + 1)}>Next <ChevronRight size={17}/></button></div>
      </section>
    </>
  )
}

function UserTable({ users, compact, onRole, onBlock }: { users: AdminUser[]; compact?: boolean; onRole?: (u: AdminUser, role: string) => void; onBlock?: (u: AdminUser) => void }) {
  if (!users.length) return <EmptyState title="No users found" detail="Try changing your search or filters." />
  return <div className="table-wrap"><table><thead><tr><th>User</th><th>Role</th><th>Location</th><th>Status</th><th>Joined</th>{!compact && <th>Action</th>}</tr></thead><tbody>{users.map((user) => <tr key={user.id}><td><div className="user-cell"><div className="avatar">{nameOf(user).charAt(0).toUpperCase()}</div><div><b>{nameOf(user)}</b><small>+91 {user.phone}</small></div></div></td><td>{compact ? <span className={`badge ${user.role}`}>{user.role}</span> : <select className="role-select" value={user.role} onChange={(e) => onRole?.(user, e.target.value)}><option value="farmer">Farmer</option><option value="dealer">Dealer</option><option value="admin">Admin</option></select>}</td><td>{user.profile ? `${user.profile.village}, ${user.profile.district}` : "Profile incomplete"}</td><td><span className={`status ${user.isBlocked ? "blocked" : "active"}`}>{user.isBlocked ? "Blocked" : "Active"}</span></td><td>{formatDate(user.createdAt)}</td>{!compact && <td><button className={user.isBlocked ? "success-button" : "danger-button"} onClick={() => onBlock?.(user)}>{user.isBlocked ? "Unblock" : "Block"}</button></td>}</tr>)}</tbody></table></div>
}

function Queue({ kind }: { kind: "listings" | "reports" }) {
  const [items, setItems] = useState<Array<Record<string, unknown>>>([])
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState("")
  const load = useCallback(async () => {
    setBusy(true)
    try { const result = kind === "listings" ? await getPendingListings() : await getReports(); setItems(result.data || []) }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to load queue") }
    finally { setBusy(false) }
  }, [kind])
  useEffect(() => { load() }, [load])
  async function act(id: string, action: string) {
    try {
      if (kind === "listings") await moderateListing(id, action as "approved" | "rejected", action === "rejected" ? "Rejected by admin" : undefined)
      else await updateReport(id, action as "resolved" | "dismissed")
      setItems((all) => all.filter((item) => String(item._id || item.id) !== id))
    } catch (e) { setError(e instanceof Error ? e.message : "Action failed") }
  }
  return <>
    <PageTitle title={kind === "listings" ? "Market Listings" : "Reports & Safety"} subtitle={kind === "listings" ? "Review and approve farmer marketplace posts." : "Resolve community reports and keep VADI safe."} />
    <section className="panel">
      {error && <div className="alert error">{error}</div>}
      {busy ? <Loading /> : !items.length ? <EmptyState title="All caught up!" detail="There are no pending items in this queue." /> :
        <div className="queue">{items.map((item) => {
          const id = String(item._id || item.id)
          const reporter = item.reporter as Record<string, unknown> | undefined
          const preview = item.targetPreview as Record<string, unknown> | undefined
          return <article className="queue-item" key={id}><div className="queue-icon">{kind === "listings" ? <ShoppingBasket/> : <FileWarning/>}</div><div className="queue-copy"><b>{String(item.title || preview?.title || `${item.targetType || item.target_type || "Content"} report`)}</b><p>{String(item.description || preview?.text || preview?.caption || item.reason || "Review this submitted item.")}</p><small>{kind === "reports" ? `Reported by ${String(reporter?.name || reporter?.phone || "a user")}` : `Category: ${String(item.category || "General")}`}</small></div><div className="queue-actions"><button className="secondary" onClick={() => act(id, kind === "listings" ? "rejected" : "dismissed")}>{kind === "listings" ? "Reject" : "Dismiss"}</button><button className="primary" onClick={() => act(id, kind === "listings" ? "approved" : "resolved")}>{kind === "listings" ? "Approve" : "Resolve"}</button></div></article>
        })}</div>}
    </section>
  </>
}

function Notifications() {
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [message, setMessage] = useState("")
  const [busy, setBusy] = useState(false)
  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setMessage("")
    try { await sendBroadcast({ title, body }); setMessage("Broadcast queued successfully."); setTitle(""); setBody("") }
    catch (err) { setMessage(err instanceof Error ? err.message : "Unable to send broadcast") }
    finally { setBusy(false) }
  }
  return <>
    <PageTitle title="Notifications" subtitle="Send important updates to every VADI user." />
    <section className="panel form-panel">
      <div className="broadcast-art"><div><Send size={32}/></div><h3>Broadcast message</h3><p>This notification will be delivered to all registered devices and saved in each user’s inbox.</p></div>
      <form className="broadcast-form" onSubmit={submit}><label>Notification title</label><input className="text-input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} placeholder="e.g. Today’s mandi prices are live" required/><label>Message</label><textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={300} placeholder="Write a clear message for VADI users…" required/><small>{body.length}/300 characters</small>{message && <div className="alert">{message}</div>}<button className="primary" disabled={busy}>{busy ? <LoaderCircle className="spin" size={18}/> : <Send size={18}/>} Send to all users</button></form>
    </section>
  </>
}

function Modules({ go }: { go: (page: Page) => void }) {
  const modules = [
    { title: "User management", detail: "Search, filter, assign roles and block accounts.", icon: UsersRound, page: "users" as Page },
    { title: "Farm marketplace", detail: "Approve or reject pending farmer listings.", icon: ShoppingBasket, page: "listings" as Page },
    { title: "Content moderation", detail: "Resolve reports and protect the community.", icon: ShieldCheck, page: "moderation" as Page },
    { title: "Push broadcasts", detail: "Send updates to all registered users.", icon: Bell, page: "notifications" as Page },
    { title: "Growth partners", detail: "Partner assignment is available through the VADI partner APIs.", icon: Handshake },
    { title: "Store advertisements", detail: "Banner and store-ad APIs are connected to the VADI backend.", icon: Gauge },
    { title: "Advisory queue", detail: "Expert crop-advisory responses are supported by the backend.", icon: Sprout },
    { title: "Market prices", detail: "APMC prices and scheduled alerts run from the existing service.", icon: CircleDollarSign },
  ]
  return <><PageTitle title="VADI Modules" subtitle="Administration capabilities available across the VADI platform."/><div className="module-grid">{modules.map(({ title, detail, icon: Icon, page }) => <article className="module-card" key={title}><div className="module-icon"><Icon/></div><h3>{title}</h3><p>{detail}</p>{page && <button className="text-action" onClick={() => go(page)}>Open module <ChevronRight size={16}/></button>}</article>)}</div></>
}

function App() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [checking, setChecking] = useState(!!session.get())
  const [page, setPage] = useState<Page>("dashboard")
  const [mobileNav, setMobileNav] = useState(false)

  useEffect(() => {
    if (!session.get()) return
    getMe().then((user) => {
      if (String(user.role).toLowerCase() !== "admin" && !user.isAdmin) session.clear()
      else setAuthUser(user)
    }).catch(() => session.clear()).finally(() => setChecking(false))
  }, [])

  if (checking) return <div className="app-loading"><Loading /></div>
  if (!authUser) return <Login onLogin={setAuthUser} />

  const content = page === "dashboard" ? <Dashboard /> : page === "users" ? <Users /> : page === "listings" ? <Queue kind="listings" /> : page === "moderation" ? <Queue kind="reports" /> : page === "notifications" ? <Notifications /> : <Modules go={setPage} />
  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? "open" : ""}`}>
      <button className="mobile-close" onClick={() => setMobileNav(false)}><X/></button>
      <div className="brand"><span className="brand-mark">🌱</span><div><b>VADI</b><small>Admin Panel</small></div></div>
      <nav>{nav.map(({ id, label, icon: Icon }) => <button key={id} className={page === id ? "active" : ""} onClick={() => { setPage(id); setMobileNav(false) }}><Icon size={19}/>{label}</button>)}</nav>
      <div className="sidebar-note"><Leaf/><b>ખેડૂત સાથે<br/>સમૃદ્ધ ગુજરાત</b><small>Growing Together<br/>with Farmers</small></div>
    </aside>
    <div className="main-shell">
      <header><button className="menu-button" onClick={() => setMobileNav(true)}><Menu/></button><div className="header-search"><Search size={17}/><span>VADI administration</span></div><div className="admin-profile"><div className="avatar">A</div><div><b>Admin</b><small>+91 {authUser.phone}</small></div><button title="Sign out" onClick={() => { session.clear(); setAuthUser(null) }}><LogOut size={18}/></button></div></header>
      <main className="content">{content}</main>
      <footer>© {new Date().getFullYear()} VADI. Built for farmers, by farmers.</footer>
    </div>
    {mobileNav && <button className="overlay" onClick={() => setMobileNav(false)} aria-label="Close menu"/>}
  </div>
}

function PageTitle({ title, subtitle }: { title: string; subtitle: string }) { return <div className="page-title"><div><h1>{title}</h1><p>{subtitle}</p></div><span className="today">{new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" }).format(new Date())}</span></div> }
function PanelHead({ title, subtitle }: { title: string; subtitle: string }) { return <div className="panel-head"><div><h2>{title}</h2><p>{subtitle}</p></div></div> }
function Health({ label, value, icon: Icon, urgent }: { label: string; value: number; icon: typeof FileWarning; urgent?: boolean }) { return <div className="health-row"><span className={urgent ? "urgent" : ""}><Icon size={18}/></span><b>{label}</b><strong>{value.toLocaleString("en-IN")}</strong></div> }
function Loading() { return <div className="loading"><LoaderCircle className="spin"/><span>Loading VADI data…</span></div> }
function EmptyState({ title, detail }: { title: string; detail: string }) { return <div className="empty"><Leaf/><h3>{title}</h3><p>{detail}</p></div> }

export default App
