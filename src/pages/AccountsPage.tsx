import { useCallback, useEffect, useState } from "react"
import { Eye, Filter, Receipt, Search, TrendingDown, TrendingUp, Wallet } from "lucide-react"
import { getAccounts } from "../api"
import type { AccountRow, AccountSeries } from "../api"
import EmptyState from "../components/EmptyState"
import FarmerPicker from "../components/FarmerPicker"
import Loading from "../components/Loading"
import PageHeading from "../components/PageHeading"
import Pager from "../components/Pager"
import StatCard from "../components/StatCard"
import { formatDate, money, moneyExact, percentChange, trendText } from "../utils/format"

const INCOME_CATEGORIES = ["Crop Sale", "Subsidy", "Rental Income", "Other"]
const EXPENSE_CATEGORIES = ["Seed", "Fertilizer", "Pesticide", "Labour", "Machinery", "Irrigation", "Other"]

type Filters = {
  search: string
  userId: string
  userLabel: string
  kind: string
  category: string
  from: string
  to: string
  sort: string
}

const emptyFilters: Filters = {
  search: "",
  userId: "",
  userLabel: "All farmers",
  kind: "all",
  category: "all",
  from: "",
  to: "",
  sort: "newest",
}

function lastTwo(series: AccountSeries[], key: "income" | "expense" | "count") {
  const tail = series.slice(-2)
  return {
    current: tail.at(-1)?.[key] || 0,
    previous: tail.length > 1 ? tail[0][key] : 0,
  }
}

export default function AccountsPage() {
  const [draft, setDraft] = useState<Filters>(emptyFilters)
  const [applied, setApplied] = useState<Filters>(emptyFilters)
  const [rows, setRows] = useState<AccountRow[]>([])
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0, count: 0, series: [] as AccountSeries[] })
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState("")
  const [openRow, setOpenRow] = useState<AccountRow | null>(null)
  const categories = draft.kind === "income"
    ? INCOME_CATEGORIES
    : draft.kind === "expense"
      ? EXPENSE_CATEGORIES
      : [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES.filter((item) => item !== "Other"), "Other"]

  const load = useCallback(async () => {
    setBusy(true)
    setError("")
    try {
      const result = await getAccounts({
        page,
        limit,
        search: applied.search,
        userId: applied.userId,
        kind: applied.kind,
        category: applied.category,
        from: applied.from,
        to: applied.to,
        sort: applied.sort,
      })
      setRows(result.data)
      setSummary({ ...result.summary, series: result.summary.series || [] })
      setPages(result.pagination.pages)
      setTotal(result.pagination.total)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load accounts")
    } finally {
      setBusy(false)
    }
  }, [applied, page, limit])

  useEffect(() => { load() }, [load])

  function updateDraft(patch: Partial<Filters>) {
    setDraft((current) => ({ ...current, ...patch }))
  }

  function applyFilters(next = draft) {
    setDraft(next)
    setApplied(next)
    setPage(1)
  }

  function clearFilters() {
    setDraft(emptyFilters)
    setApplied(emptyFilters)
    setPage(1)
  }

  function focusFarmer(row: AccountRow) {
    applyFilters({
      ...draft,
      userId: row.user.id,
      userLabel: `${row.user.name} · ${row.user.phone}`,
      search: "",
    })
  }

  const incomeTrend = lastTwo(summary.series, "income")
  const expenseTrend = lastTwo(summary.series, "expense")
  const countTrend = lastTwo(summary.series, "count")
  const balancePoints = summary.series.map((item) => item.income - item.expense)
  const incomePoints = summary.series.map((item) => item.income).slice(-6)
  const expensePoints = summary.series.map((item) => item.expense).slice(-6)

  return (
    <div className="directory">
      <PageHeading
        icon={Wallet}
        title="Income & Expense"
        subtitle={applied.userId ? `Showing entries for ${applied.userLabel}.` : "Review every farmer entry, then filter by person, date, or category."}
      />
      <div className="stat-grid">
        <button type="button" className={`stat-button ${applied.kind === "income" ? "active" : ""}`} onClick={() => applyFilters({ ...draft, kind: applied.kind === "income" ? "all" : "income", category: "all" })}>
          <StatCard label="Total Income" value={money(summary.income)} title={moneyExact(summary.income)} note={trendText(percentChange(incomeTrend.current, incomeTrend.previous))} direction={incomeTrend.current >= incomeTrend.previous ? "up" : "down"} icon={TrendingUp} tone="green" points={incomePoints} />
        </button>
        <button type="button" className={`stat-button ${applied.kind === "expense" ? "active" : ""}`} onClick={() => applyFilters({ ...draft, kind: applied.kind === "expense" ? "all" : "expense", category: "all" })}>
          <StatCard label="Total Expense" value={money(summary.expense)} title={moneyExact(summary.expense)} note={trendText(percentChange(expenseTrend.current, expenseTrend.previous))} direction={expenseTrend.current <= expenseTrend.previous ? "up" : "down"} icon={TrendingDown} tone="red" points={expensePoints} />
        </button>
        <button type="button" className={`stat-button ${applied.kind === "all" ? "active" : ""}`} onClick={() => applyFilters({ ...draft, kind: "all", category: "all" })}>
          <StatCard label="Balance" value={money(summary.balance)} title={moneyExact(summary.balance)} note="Income minus expense" icon={Wallet} tone="blue" points={balancePoints.slice(-6)} />
        </button>
        <article className="stat-card plain">
          <div className="stat-top">
            <span className="stat-icon green"><Receipt size={18} /></span>
          </div>
          <span>Entries</span>
          <strong>{summary.count.toLocaleString("en-IN")}</strong>
          <small className={countTrend.current >= countTrend.previous ? "up" : "down"}>{trendText(percentChange(countTrend.current, countTrend.previous))}</small>
        </article>
      </div>

      <section className="data-card">
        <div className="filter-grid">
          <label className="field grow">
            <span>Search</span>
            <div className="search-box">
              <Search size={16} />
              <input value={draft.search} onChange={(event) => updateDraft({ search: event.target.value })} placeholder="Search farmer, mobile, village or notes" />
            </div>
          </label>
          <label className="field">
            <span>Farmer</span>
            <FarmerPicker userId={draft.userId} label={draft.userLabel} onChange={(userId, userLabel) => updateDraft({ userId, userLabel })} />
          </label>
          <label className="field">
            <span>Type</span>
            <select value={draft.kind} onChange={(event) => updateDraft({ kind: event.target.value, category: "all" })}>
              <option value="all">Income and expense</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </label>
          <label className="field">
            <span>Category</span>
            <select value={draft.category} onChange={(event) => updateDraft({ category: event.target.value })}>
              <option value="all">All categories</option>
              {categories.map((item) => <option key={item} value={item}>{item}</option>)}
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
              <option value="amount_desc">Amount High–Low</option>
              <option value="amount_asc">Amount Low–High</option>
            </select>
          </label>
          <div className="filter-actions">
            <button type="button" className="clear-link" onClick={clearFilters}>Clear Filters</button>
            <button type="button" className="primary apply" onClick={() => applyFilters()}><Filter size={15} /> Apply Filters</button>
          </div>
        </div>

        {error && <div className="alert error">{error}</div>}
        {busy ? <Loading /> : !rows.length ? <EmptyState title="No entries found" detail="Choose another farmer or clear the filters." /> : (
          <div className="table-wrap">
            <table className="directory-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Farmer</th>
                  <th>Mobile</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Notes</th>
                  <th className="num">Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={`${row.kind}-${row.id}`} className={row.user.id === applied.userId ? "selected" : ""}>
                    <td>{formatDate(row.date)}</td>
                    <td>
                      <button type="button" className="farmer-link" onClick={() => focusFarmer(row)}>
                        <span className={`avatar tone-${row.kind}`}>{row.user.name.charAt(0).toUpperCase()}</span>
                        <span><b>{row.user.name}</b><small>{row.year || "—"}</small></span>
                      </button>
                    </td>
                    <td>+91 {row.user.phone}</td>
                    <td><span className={`badge ${row.kind}`}>{row.kind}</span></td>
                    <td>{row.category}</td>
                    <td>{[row.user.village, row.user.district].filter(Boolean).join(", ") || "—"}</td>
                    <td className="notes">{row.notes || "—"}</td>
                    <td className={`num ${row.kind}`} title={moneyExact(row.amount)}>{row.kind === "expense" ? "−" : "+"}{money(row.amount)}</td>
                    <td>
                      <button type="button" className="icon-button" title="View entry" onClick={() => setOpenRow(row)}><Eye size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pager page={page} pages={pages} total={total} limit={limit} noun="entries" onPage={setPage} onLimit={(next) => { setLimit(next); setPage(1) }} />
      </section>

      {openRow && (
        <div className="drawer-backdrop" onClick={() => setOpenRow(null)}>
          <aside className="drawer" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="drawer-close" onClick={() => setOpenRow(null)} aria-label="Close">×</button>
            <div className={`avatar tone-${openRow.kind}`}>{openRow.user.name.charAt(0).toUpperCase()}</div>
            <h2>{openRow.user.name}</h2>
            <p className={openRow.kind === "expense" ? "amount-down" : "amount-up"} title={moneyExact(openRow.amount)}>
              {openRow.kind === "expense" ? "−" : "+"}{money(openRow.amount)}
            </p>
            <dl>
              <div><dt>Type</dt><dd><span className={`badge ${openRow.kind}`}>{openRow.kind}</span></dd></div>
              <div><dt>Category</dt><dd>{openRow.category}</dd></div>
              <div><dt>Date</dt><dd>{formatDate(openRow.date)}</dd></div>
              <div><dt>Year</dt><dd>{openRow.year || "—"}</dd></div>
              <div><dt>Mobile</dt><dd>+91 {openRow.user.phone}</dd></div>
              <div><dt>Location</dt><dd>{[openRow.user.village, openRow.user.district].filter(Boolean).join(", ") || "—"}</dd></div>
              <div><dt>Notes</dt><dd>{openRow.notes || "—"}</dd></div>
            </dl>
            <button type="button" className="primary" onClick={() => { focusFarmer(openRow); setOpenRow(null) }}>Show this farmer only</button>
          </aside>
        </div>
      )}
    </div>
  )
}
