import { useCallback, useEffect, useMemo, useState } from "react"
import { Eye, Filter, Search, UserCheck, UserPlus, UserX, Users } from "lucide-react"
import { getUsers } from "../api"
import type { AdminUser, UserPlace, UserSummary } from "../api"
import EmptyState from "../components/EmptyState"
import Loading from "../components/Loading"
import PageHeading from "../components/PageHeading"
import Pager from "../components/Pager"
import StatCard from "../components/StatCard"
import { formatDate, nameOf, percentChange, trendText } from "../utils/format"

type Filters = {
  search: string
  role: string
  status: string
  district: string
  taluka: string
  village: string
  from: string
  to: string
  sort: string
}

const emptyFilters: Filters = {
  search: "",
  role: "all",
  status: "all",
  district: "",
  taluka: "",
  village: "",
  from: "",
  to: "",
  sort: "newest",
}

const emptySummary: UserSummary = {
  total: 0,
  active: 0,
  blocked: 0,
  newThisMonth: 0,
  newLastMonth: 0,
  spark: [],
  cumulative: [],
}

export default function UsersPage({ onOpenUser }: { onOpenUser: (userId: string) => void }) {
  const [draft, setDraft] = useState<Filters>(emptyFilters)
  const [applied, setApplied] = useState<Filters>(emptyFilters)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [summary, setSummary] = useState<UserSummary>(emptySummary)
  const [places, setPlaces] = useState<UserPlace[]>([])
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState("")
  const load = useCallback(async () => {
    setBusy(true)
    setError("")
    try {
      const result = await getUsers({ page, limit, ...applied })
      setUsers(result.data)
      setSummary(result.summary || emptySummary)
      if (result.places?.length) setPlaces(result.places)
      setPages(result.pagination.pages)
      setTotal(result.pagination.total)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load users")
    } finally {
      setBusy(false)
    }
  }, [applied, page, limit])

  useEffect(() => { load() }, [load])

  const districts = useMemo(
    () => [...new Set(places.map((place) => place.district).filter(Boolean))].sort(),
    [places],
  )
  const talukas = useMemo(
    () => [...new Set(places.filter((place) => !draft.district || place.district === draft.district).map((place) => place.taluka).filter(Boolean))].sort(),
    [places, draft.district],
  )
  const villages = useMemo(
    () => [...new Set(places.filter((place) => (
      (!draft.district || place.district === draft.district) && (!draft.taluka || place.taluka === draft.taluka)
    )).map((place) => place.village).filter(Boolean))].sort(),
    [places, draft.district, draft.taluka],
  )

  function updateDraft(patch: Partial<Filters>) {
    setDraft((current) => ({ ...current, ...patch }))
  }

  function applyFilters() {
    setPage(1)
    setApplied(draft)
  }

  function clearFilters() {
    setDraft(emptyFilters)
    setApplied(emptyFilters)
    setPage(1)
  }

  const totalBase = Math.max(summary.total - summary.newThisMonth, 0)
  const activeShare = summary.total ? Math.round((summary.active / summary.total) * 100) : 0
  const blockedShare = summary.total ? Math.round((summary.blocked / summary.total) * 100) : 0

  return (
    <div className="directory">
      <PageHeading icon={Users} title="Users" subtitle="Manage farmers, view details, and track their activity." />
      <div className="stat-grid">
        <StatCard label="Total Users" value={summary.total.toLocaleString("en-IN")} note={trendText(percentChange(summary.total, totalBase))} direction="up" icon={Users} tone="green" points={summary.cumulative} />
        <StatCard label="Active Users" value={summary.active.toLocaleString("en-IN")} note={`${activeShare}% of all users`} direction="up" icon={UserCheck} tone="green" points={summary.cumulative} />
        <StatCard label="New Users (This Month)" value={summary.newThisMonth.toLocaleString("en-IN")} note={trendText(percentChange(summary.newThisMonth, summary.newLastMonth))} direction={summary.newThisMonth >= summary.newLastMonth ? "up" : "down"} icon={UserPlus} tone="green" points={summary.spark} />
        <StatCard label="Blocked Users" value={summary.blocked.toLocaleString("en-IN")} note={`${blockedShare}% of all users`} direction={summary.blocked ? "down" : "up"} icon={UserX} tone="red" points={summary.spark} />
      </div>

      <section className="data-card">
        <div className="filter-grid">
          <label className="field grow">
            <span>Search</span>
            <div className="search-box">
              <Search size={16} />
              <input value={draft.search} onChange={(event) => updateDraft({ search: event.target.value })} placeholder="Search by name, mobile, village..." />
            </div>
          </label>
          <label className="field">
            <span>User Type</span>
            <select value={draft.role} onChange={(event) => updateDraft({ role: event.target.value })}>
              <option value="all">All Users</option>
              <option value="farmer">Farmer</option>
              <option value="dealer">Dealer</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <label className="field">
            <span>Status</span>
            <select value={draft.status} onChange={(event) => updateDraft({ status: event.target.value })}>
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="blocked">Blocked</option>
            </select>
          </label>
          <label className="field">
            <span>District</span>
            <select value={draft.district} onChange={(event) => updateDraft({ district: event.target.value, taluka: "", village: "" })}>
              <option value="">All Districts</option>
              {districts.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Taluka</span>
            <select value={draft.taluka} onChange={(event) => updateDraft({ taluka: event.target.value, village: "" })}>
              <option value="">All Talukas</option>
              {talukas.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Village</span>
            <select value={draft.village} onChange={(event) => updateDraft({ village: event.target.value })}>
              <option value="">All Villages</option>
              {villages.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
        </div>
        <div className="filter-row">
          <label className="field">
            <span>From Date</span>
            <input type="date" value={draft.from} max={draft.to || undefined} onChange={(event) => updateDraft({ from: event.target.value })} />
          </label>
          <label className="field">
            <span>To Date</span>
            <input type="date" value={draft.to} min={draft.from || undefined} onChange={(event) => updateDraft({ to: event.target.value })} />
          </label>
          <label className="field">
            <span>Sort By</span>
            <select value={draft.sort} onChange={(event) => updateDraft({ sort: event.target.value })}>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name A–Z</option>
            </select>
          </label>
          <div className="filter-actions">
            <button type="button" className="clear-link" onClick={clearFilters}>Clear Filters</button>
            <button type="button" className="primary apply" onClick={applyFilters}><Filter size={15} /> Apply Filters</button>
          </div>
        </div>

        {error && <div className="alert error">{error}</div>}
        {busy ? <Loading /> : !users.length ? <EmptyState title="No users found" detail="Try another search or clear the filters." /> : (
          <div className="table-wrap">
            <table className="directory-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User</th>
                  <th>Mobile</th>
                  <th>Type</th>
                  <th>Location</th>
                  <th>Joined On</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const location = user.profile ? [user.profile.village, user.profile.district].filter(Boolean).join(", ") : "—"
                  return (
                    <tr key={user.id}>
                      <td className="mono">{user.id.slice(0, 8)}</td>
                      <td>
                        <div className="user-cell">
                          <div className={`avatar tone-${user.role}`}>{nameOf(user).charAt(0).toUpperCase()}</div>
                          <div>
                            <b>{nameOf(user)}</b>
                            <small>{user.profile?.village || user.role}</small>
                          </div>
                        </div>
                      </td>
                      <td>+91 {user.phone}</td>
                      <td><span className={`badge ${user.role}`}>{user.role}</span></td>
                      <td>{location}</td>
                      <td>{formatDate(user.createdAt)}</td>
                      <td><span className={`status ${user.isBlocked ? "blocked" : "active"}`}>{user.isBlocked ? "Blocked" : "Active"}</span></td>
                      <td>
                        <button type="button" className="icon-button" title="View farmer profile" onClick={() => onOpenUser(user.id)}><Eye size={16} /></button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pager page={page} pages={pages} total={total} limit={limit} noun="users" onPage={setPage} onLimit={(next) => { setLimit(next); setPage(1) }} />
      </section>

    </div>
  )
}
