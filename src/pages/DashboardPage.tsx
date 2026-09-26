import { useCallback, useEffect, useState } from "react"
import {
  CircleDollarSign, Receipt, ShoppingBasket, Sprout, UsersRound, Wallet,
} from "lucide-react"
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts"
import { getDashboard } from "../api"
import type { DashboardData } from "../api"
import EmptyState from "../components/EmptyState"
import Loading from "../components/Loading"
import StatCard from "../components/StatCard"
import { formatDate, isoDaysAgo, money, moneyExact, monthLabel, nameOf, percentChange, timeAgo, todayIso, trendText } from "../utils/format"

const ROLE_COLORS = [
  { key: "farmer" as const, name: "Farmers", color: "#1f9d55" },
  { key: "dealer" as const, name: "Dealers", color: "#7c3aed" },
  { key: "admin" as const, name: "Admins", color: "#3b82c4" },
  { key: "other" as const, name: "Others", color: "#f0b429" },
]
const BAR_COLORS = ["#1f9d55", "#7c3aed", "#f0b429", "#3b82c4", "#e15a52"]

function axisMoney(value: unknown) {
  return money(Number(value) || 0)
}

function billStatus(paid: number, amount: number) {
  if (!amount) return "Open"
  if (paid >= amount) return "Paid"
  if (paid > 0) return "Partial"
  return "Due"
}

export default function DashboardPage({
  search,
  onOpenUsers,
  onOpenAccounts,
  onOpenListings,
}: {
  search: string
  onOpenUsers: () => void
  onOpenAccounts: () => void
  onOpenListings: () => void
}) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState("")
  const [from, setFrom] = useState(isoDaysAgo(29))
  const [to, setTo] = useState(todayIso())
  const [preset, setPreset] = useState("30")
  const [busy, setBusy] = useState(true)

  const load = useCallback(async () => {
    setBusy(true)
    setError("")
    try {
      setData(await getDashboard({ from, to, search }))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load dashboard")
    } finally {
      setBusy(false)
    }
  }, [from, to, search])

  useEffect(() => {
    const id = setTimeout(load, 250)
    return () => clearTimeout(id)
  }, [load])

  function applyPreset(next: string) {
    const yearStart = `${new Date().getFullYear()}-01-01`
    const range = next === "today"
      ? [todayIso(), todayIso()]
      : next === "7"
        ? [isoDaysAgo(6), todayIso()]
        : next === "year"
          ? [yearStart, todayIso()]
          : [isoDaysAgo(29), todayIso()]
    setPreset(next)
    setFrom(range[0])
    setTo(range[1])
  }

  function applyCustom(nextFrom: string, nextTo: string) {
    if (!nextFrom || !nextTo) return
    const start = nextFrom <= nextTo ? nextFrom : nextTo
    const end = nextFrom <= nextTo ? nextTo : nextFrom
    const latest = todayIso()
    setPreset("custom")
    setFrom(start > latest ? latest : start)
    setTo(end > latest ? latest : end)
  }

  if (error && !data) return <EmptyState title="Dashboard unavailable" detail={error} />

  const finance = data?.finance
  const bucket = data?.range.bucket || "day"
  const rangeStart = bucket === "month" ? from.slice(0, 7) : from
  const rangeEnd = bucket === "month" ? to.slice(0, 7) : to
  const growthKey = (date: string) => (bucket === "month" ? date.slice(0, 7) : date.slice(0, 10))
  const inGrowthRange = (date: string) => {
    const key = growthKey(date)
    return key >= rangeStart && key <= rangeEnd
  }
  const istDay = (value?: string | null) => {
    if (!value) return ""
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return String(value).slice(0, 10)
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(parsed)
  }
  const inSelectedDays = (value?: string | null) => {
    const day = istDay(value)
    return !!day && day >= from && day <= to
  }
  const rangedGrowth = (data?.growth || []).filter((item) => inGrowthRange(item.date))
  const hasOutside = (data?.growth || []).some((item) => !inGrowthRange(item.date))
  const sumGrowth = (key: "users" | "listings" | "dealerBills" | "farmers" | "dealers") => rangedGrowth.reduce((total, item) => total + (Number(item[key]) || 0), 0)
  const periodUsers = hasOutside ? sumGrowth("users") : (data?.metrics.totalUsers || 0)
  const periodListings = hasOutside ? sumGrowth("listings") : (data?.metrics.listings || 0)
  const periodBills = hasOutside ? sumGrowth("dealerBills") : (data?.metrics.dealerBills || 0)
  const recentUsers = (data?.recentUsers || []).filter((user) => !hasOutside || inSelectedDays(user.createdAt))
  const recentListings = (data?.recentListings || []).filter((listing) => !hasOutside || inSelectedDays(listing.date))
  const recentBills = (data?.recentBills || []).filter((bill) => !hasOutside || inSelectedDays(bill.date))
  const roles = (() => {
    if (!hasOutside) return data?.roles || { farmer: 0, dealer: 0, admin: 0, other: 0 }
    if (recentUsers.length === periodUsers) {
      return recentUsers.reduce((counts, user) => {
        const role = user.role === "farmer" || user.role === "dealer" || user.role === "admin" ? user.role : "other"
        counts[role] += 1
        return counts
      }, { farmer: 0, dealer: 0, admin: 0, other: 0 })
    }
    const farmers = sumGrowth("farmers")
    const dealers = Math.min(sumGrowth("dealers"), Math.max(0, periodUsers - farmers))
    return { farmer: farmers, dealer: dealers, admin: 0, other: Math.max(0, periodUsers - farmers - dealers) }
  })()
  const roleTotal = roles.farmer + roles.dealer + roles.admin + roles.other
  const slices = ROLE_COLORS.map((item) => ({ ...item, value: roles[item.key] })).filter((item) => item.value > 0)
  const shortDay = (value: string) => new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
  const rangeName = preset === "today"
    ? "Today"
    : preset === "7"
      ? "Last 7 days"
      : preset === "year"
        ? "This year"
        : preset === "custom"
          ? (from === to ? shortDay(from) : `${shortDay(from)} – ${shortDay(to)}`)
          : "Last 30 days"
  const axisLabel = (value: string) => value.length === 7
    ? monthLabel(value)
    : new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
  const months = (finance?.months || []).map((item) => ({ ...item, label: axisLabel(item.month) }))
  const signups = rangedGrowth.map((item) => ({ label: axisLabel(bucket === "month" ? item.date.slice(0, 7) : item.date), users: item.users }))
  const activity = [
    ...recentUsers.slice(0, 2).map((user) => ({
      title: "New user registered",
      detail: `${nameOf(user)} · ${user.role}`,
      at: user.createdAt,
      tone: "green",
    })),
    ...recentListings.slice(0, 2).map((listing) => ({
      title: "New market listing",
      detail: listing.title,
      at: listing.date || "",
      tone: "purple",
    })),
    ...(finance?.recent || []).slice(0, 2).map((entry) => ({
      title: entry.kind === "income" ? "Income added" : "Expense added",
      detail: `${entry.category} · ${money(entry.amount)}`,
      at: entry.date || "",
      tone: entry.kind === "income" ? "green" : "red",
    })),
  ].sort((a, b) => new Date(b.at || 0).getTime() - new Date(a.at || 0).getTime()).slice(0, 4)

  return (
    <div className="home">
      <section className="welcome">
        <div>
          <h1>Welcome, Admin</h1>
          <p>Here&apos;s what&apos;s happening in your VADI platform today.</p>
        </div>
        <div className="welcome-art" aria-hidden="true">
          <svg viewBox="0 0 280 90">
            <path d="M0 70 C40 40 70 78 120 58 C170 38 190 72 240 48 C260 38 270 44 280 40 L280 90 L0 90 Z" fill="#8fd18a" />
            <path d="M0 78 C50 62 90 84 150 70 C200 58 230 76 280 64 L280 90 L0 90 Z" fill="#3f8f4a" />
            <circle cx="214" cy="22" r="10" fill="#f6c453" />
            <rect x="168" y="48" width="28" height="12" rx="3" fill="#245c32" />
            <circle cx="174" cy="62" r="4" fill="#1c3b24" />
            <circle cx="190" cy="62" r="4" fill="#1c3b24" />
          </svg>
          <em>Smart Farming<br />Stronger Tomorrow</em>
        </div>
        <div className="welcome-tools">
          <span>{new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" }).format(new Date())}</span>
          <div className="range-switch">
            {[["today", "Today"], ["7", "7 Days"], ["30", "30 Days"], ["year", "This Year"]].map(([id, label]) => (
              <button key={id} type="button" className={preset === id ? "active" : ""} onClick={() => applyPreset(id)}>{label}</button>
            ))}
          </div>
          <div className="range-dates">
            <label>
              <span>From</span>
              <input type="date" value={from} max={to || todayIso()} onChange={(event) => applyCustom(event.target.value, to)} />
            </label>
            <label>
              <span>To</span>
              <input type="date" value={to} min={from || undefined} max={todayIso()} onChange={(event) => applyCustom(from, event.target.value)} />
            </label>
          </div>
        </div>
      </section>

      {error && <div className="alert error">{error}</div>}
      {busy && !data ? <Loading /> : (
        <>
          <div className="stat-grid home-stats">
            <StatCard label="Total Users" value={periodUsers.toLocaleString("en-IN")} note={`${rangeName} · ${trendText(percentChange(periodUsers, data?.previousUsers || 0)).replace("last month", "previous period")}`} direction={periodUsers >= (data?.previousUsers || 0) ? "up" : "down"} icon={UsersRound} tone="green" points={signups.map((item) => item.users)} />
            <StatCard label="Market Listings" value={periodListings.toLocaleString("en-IN")} note={rangeName} icon={ShoppingBasket} tone="blue" points={rangedGrowth.map((item) => item.listings)} />
            <StatCard label="Dealer Bills" value={periodBills.toLocaleString("en-IN")} note={rangeName} icon={Receipt} tone="green" points={rangedGrowth.map((item) => item.dealerBills)} />
            <StatCard label="Total Income" value={money(finance?.income || 0)} title={moneyExact(finance?.income || 0)} note={`${rangeName} · ${trendText(percentChange(finance?.income || 0, finance?.previousIncome || 0)).replace("last month", "previous period")}`} direction={(finance?.income || 0) >= (finance?.previousIncome || 0) ? "up" : "down"} icon={Wallet} tone="green" points={months.map((item) => item.income)} />
            <StatCard label="Total Expense" value={money(finance?.expense || 0)} title={moneyExact(finance?.expense || 0)} note={`${rangeName} · ${trendText(percentChange(finance?.expense || 0, finance?.previousExpense || 0)).replace("last month", "previous period")}`} direction={(finance?.expense || 0) <= (finance?.previousExpense || 0) ? "up" : "down"} icon={CircleDollarSign} tone="red" points={months.map((item) => item.expense)} />
          </div>

          <div className="home-charts">
            <section className="home-card">
              <div className="home-card-head"><h2>Income vs Expense</h2><span>{rangeName}</span></div>
              <div className="chart-legend"><i className="swatch income" /> Income <i className="swatch expense" /> Expense</div>
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={months} barGap={4} margin={{ top: 22, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f0" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} minTickGap={24} tick={{ fontSize: 11, fill: "#607168" }} />
                  <YAxis axisLine={false} tickLine={false} width={58} tick={{ fontSize: 11, fill: "#607168" }} tickFormatter={axisMoney} domain={[0, (max: number) => Math.max(max * 1.12, 1)]} />
                  <Tooltip formatter={(value) => moneyExact(Number(value || 0))} />
                  <Bar dataKey="income" name="Income" fill="#1f9d55" radius={[5, 5, 0, 0]} />
                  <Bar dataKey="expense" name="Expense" fill="#ef6b63" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </section>
            <section className="home-card">
              <div className="home-card-head">
                <h2>New Users</h2>
                <span>{rangeName}</span>
              </div>
              <p className="growth-total">Joined <strong>{periodUsers.toLocaleString("en-IN")}</strong> <em>in {rangeName.toLowerCase()}</em></p>
              <ResponsiveContainer width="100%" height={210}>
                <LineChart data={signups} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f0" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} minTickGap={28} tick={{ fontSize: 11, fill: "#607168" }} />
                  <YAxis axisLine={false} tickLine={false} width={40} allowDecimals={false} domain={[0, (max: number) => Math.max(Math.ceil(max * 1.2), 4)]} tick={{ fontSize: 11, fill: "#607168" }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="users" name="New users" stroke="#1f9d55" strokeWidth={3} dot={{ r: 3, fill: "#1f9d55" }} />
                </LineChart>
              </ResponsiveContainer>
            </section>
            <section className="home-card">
              <div className="home-card-head"><h2>User Type Distribution</h2><span>{rangeName}</span></div>
              <div className="donut-layout">
                <div className="donut-wrap">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={slices.length ? slices : [{ name: "None", value: 1, color: "#e6eeea" }]} dataKey="value" nameKey="name" innerRadius={58} outerRadius={78} stroke="none">
                        {(slices.length ? slices : [{ name: "None", color: "#e6eeea" }]).map((item) => <Cell key={item.name} fill={item.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="donut-center"><strong>{roleTotal.toLocaleString("en-IN")}</strong><span>Users</span></div>
                </div>
                <ul className="role-legend">
                  {ROLE_COLORS.map((item) => (
                    <li key={item.key}>
                      <i style={{ background: item.color }} />
                      <span>{item.name}</span>
                      <b>{roles[item.key].toLocaleString("en-IN")}</b>
                      <small>{roleTotal ? Math.round((roles[item.key] / roleTotal) * 100) : 0}%</small>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </div>

          <div className="home-mid">
            <section className="home-card">
              <div className="home-card-head"><h2>Top Categories</h2><button type="button" onClick={onOpenAccounts}>View All</button></div>
              {!finance?.categories.length ? <p className="muted">No income or expense in this range.</p> : (
                <ul className="category-list">
                  {finance.categories.map((item, index) => (
                    <li key={`${item.kind}-${item.name}`}>
                      <span className="cat-icon" style={{ background: `${BAR_COLORS[index % BAR_COLORS.length]}22`, color: BAR_COLORS[index % BAR_COLORS.length] }}>{item.name.charAt(0)}</span>
                      <div>
                        <b>{item.name}</b>
                        <small>{item.count.toLocaleString("en-IN")} {item.kind}</small>
                        <div className="bar"><span style={{ width: `${item.share}%`, background: BAR_COLORS[index % BAR_COLORS.length] }} /></div>
                      </div>
                      <strong>{item.share}%</strong>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section className="home-card">
              <div className="home-card-head"><h2>Recent Users</h2><button type="button" onClick={onOpenUsers}>View All</button></div>
              {!recentUsers.length ? <p className="muted">No users joined in this range.</p> : (
              <table className="mini-table">
                <thead><tr><th>User</th><th>Type</th><th>Location</th><th>Joined</th></tr></thead>
                <tbody>
                  {recentUsers.slice(0, 5).map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className="user-cell">
                          <div className={`avatar tone-${user.role}`}>{nameOf(user).charAt(0).toUpperCase()}</div>
                          <b>{nameOf(user)}</b>
                        </div>
                      </td>
                      <td><span className={`badge ${user.role}`}>{user.role}</span></td>
                      <td>{user.profile?.district || "—"}</td>
                      <td>{formatDate(user.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              )}
            </section>
            <section className="home-card">
              <div className="home-card-head"><h2>Recent Bills</h2><button type="button" onClick={onOpenListings}>View Listings</button></div>
              {!recentBills.length ? <p className="muted">No dealer bills in this range.</p> : (
                <table className="mini-table">
                  <thead><tr><th>Bill</th><th>Customer</th><th>Amount</th><th>Status</th></tr></thead>
                  <tbody>
                    {recentBills.map((bill) => {
                      const status = billStatus(bill.paid, bill.amount)
                      return (
                        <tr key={bill.id}>
                          <td>#{bill.number}</td>
                          <td>{bill.customer}</td>
                          <td title={moneyExact(bill.amount)}>{money(bill.amount)}</td>
                          <td><span className={`status ${status === "Paid" ? "active" : "blocked"}`}>{status}</span></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </section>
          </div>

          <div className="home-bottom">
            <section className="home-card">
              <div className="home-card-head"><h2>Recent Income & Expense</h2><button type="button" onClick={onOpenAccounts}>View All</button></div>
              {!finance?.recent.length ? <p className="muted">No ledger entries yet.</p> : (
                <table className="mini-table">
                  <thead><tr><th>Date</th><th>Type</th><th>Category</th><th>Amount</th><th>Added By</th></tr></thead>
                  <tbody>
                    {finance.recent.map((entry) => (
                      <tr key={`${entry.kind}-${entry.id}`}>
                        <td>{formatDate(entry.date)}</td>
                        <td><span className={`badge ${entry.kind}`}>{entry.kind}</span></td>
                        <td>{entry.category}</td>
                        <td className={entry.kind} title={moneyExact(entry.amount)}>{entry.kind === "expense" ? "−" : "+"}{money(entry.amount)}</td>
                        <td>{entry.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
            <section className="home-card">
              <div className="home-card-head"><h2>Platform Activity</h2></div>
              {!activity.length ? <p className="muted">No recent activity.</p> : (
                <ul className="activity-list">
                  {activity.map((item) => (
                    <li key={`${item.title}-${item.detail}`}>
                      <span className={`activity-dot ${item.tone}`} />
                      <div><b>{item.title}</b><small>{item.detail}</small></div>
                      <time>{timeAgo(item.at)}</time>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <aside className="promo-card">
              <div>
                <h3>More Farmers.<br />More Opportunities.</h3>
                <p>Grow the network and help farmers across Gujarat keep their hisab in one place.</p>
                <button type="button" className="primary" onClick={onOpenUsers}>Manage Users</button>
              </div>
              <Sprout size={72} />
            </aside>
          </div>
        </>
      )}
    </div>
  )
}
