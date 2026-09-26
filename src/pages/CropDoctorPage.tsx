import { useCallback, useEffect, useState } from "react"
import { Eye, MessageCircle, Search, Stethoscope, UserRound, Users } from "lucide-react"
import { getCropDoctor } from "../api"
import type { CropDoctorStats, CropDoctorUser } from "../api"
import EmptyState from "../components/EmptyState"
import Loading from "../components/Loading"
import PageHeading from "../components/PageHeading"
import Pager from "../components/Pager"
import StatCard from "../components/StatCard"
import { formatDate } from "../utils/format"

const empty: CropDoctorStats = {
  summary: { users: 0, questions: 0, usersToday: 0, questionsToday: 0, usersMonth: 0, questionsMonth: 0, expertWaiting: 0 },
  spark: [],
  users: [],
  pagination: { page: 1, limit: 10, total: 0, pages: 1 },
}

export default function CropDoctorPage({ onOpenUser }: { onOpenUser: (userId: string) => void }) {
  const [search, setSearch] = useState("")
  const [applied, setApplied] = useState("")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [stats, setStats] = useState<CropDoctorStats>(empty)
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    setBusy(true)
    setError("")
    try {
      setStats(await getCropDoctor({ page, limit, search: applied }))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load Crop Doctor")
    } finally {
      setBusy(false)
    }
  }, [applied, limit, page])

  useEffect(() => { load() }, [load])

  const summary = stats.summary
  const userSpark = stats.spark.map((item) => item.users)
  const questionSpark = stats.spark.map((item) => item.questions)

  return (
    <div className="directory">
      <PageHeading icon={Stethoscope} title="Crop Doctor" subtitle="See how many farmers ask Crop Doctor, and who used it most recently." />
      {error && <div className="alert error">{error}</div>}
      <div className="stat-grid">
        <StatCard label="Users" value={summary.users.toLocaleString("en-IN")} note={`${summary.usersMonth.toLocaleString("en-IN")} this month`} icon={Users} tone="green" points={userSpark} />
        <StatCard label="Questions" value={summary.questions.toLocaleString("en-IN")} note={`${summary.questionsMonth.toLocaleString("en-IN")} this month`} icon={MessageCircle} tone="blue" points={questionSpark} />
        <StatCard label="Users Today" value={summary.usersToday.toLocaleString("en-IN")} note={`${summary.questionsToday.toLocaleString("en-IN")} questions today`} icon={UserRound} tone="green" points={userSpark} />
        <StatCard label="Needs Expert" value={summary.expertWaiting.toLocaleString("en-IN")} note="Waiting for a person to reply" icon={Stethoscope} tone="red" points={questionSpark} />
      </div>

      <section className="data-card">
        <div className="filter-row crop-filters">
          <label className="field">
            <span>Search</span>
            <div className="search-box">
              <Search size={16} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => { if (event.key === "Enter") { setApplied(search.trim()); setPage(1) } }}
                placeholder="Name, mobile, village or district"
              />
            </div>
          </label>
          <div className="filter-actions">
            <button type="button" className="clear-link" onClick={() => { setSearch(""); setApplied(""); setPage(1) }}>Clear</button>
            <button type="button" className="primary apply" onClick={() => { setApplied(search.trim()); setPage(1) }}><Search size={15} /> Search</button>
          </div>
        </div>

        {busy ? <Loading /> : !stats.users.length ? (
          <EmptyState title={applied ? "No matching farmers" : "No one has used Crop Doctor yet"} detail={applied ? "Try another name, mobile, or village." : "Questions will show up here after a farmer asks Crop Doctor."} />
        ) : (
          <div className="table-wrap">
            <table className="directory-table">
              <thead>
                <tr>
                  <th>Farmer</th>
                  <th>Mobile</th>
                  <th>Location</th>
                  <th>Questions</th>
                  <th>Last used</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {stats.users.map((user) => (
                  <UserRow key={user.id} user={user} onOpen={() => onOpenUser(user.id)} />
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pager page={page} pages={stats.pagination.pages} total={stats.pagination.total} limit={limit} noun="users" onPage={setPage} onLimit={(next) => { setLimit(next); setPage(1) }} />
      </section>
    </div>
  )
}

function UserRow({ user, onOpen }: { user: CropDoctorUser; onOpen: () => void }) {
  const place = [user.village, user.district].filter(Boolean).join(", ")
  return (
    <tr>
      <td>
        <button type="button" className="farmer-link" onClick={onOpen}>
          <span className={`avatar tone-${user.role}`}>{user.name.charAt(0).toUpperCase()}</span>
          <span><b>{user.name}</b><small>{user.role}</small></span>
        </button>
      </td>
      <td>{user.phone ? `+91 ${user.phone}` : "—"}</td>
      <td>{place || "—"}</td>
      <td>{user.questions.toLocaleString("en-IN")}</td>
      <td>{formatDate(user.lastUsed)}</td>
      <td>
        <button type="button" className="icon-button" title="View farmer" onClick={onOpen}><Eye size={16} /></button>
      </td>
    </tr>
  )
}
