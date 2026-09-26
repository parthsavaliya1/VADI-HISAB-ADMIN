import { useCallback, useEffect, useState } from "react"
import { Check, Eye, Filter, Search, ShoppingBasket, X } from "lucide-react"
import { getListings, moderateListing } from "../api"
import type { MarketListing } from "../api"
import EmptyState from "../components/EmptyState"
import Loading from "../components/Loading"
import PageHeading from "../components/PageHeading"
import Pager from "../components/Pager"
import StatCard from "../components/StatCard"
import { formatDate, money, moneyExact } from "../utils/format"

function labelOf(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export default function ListingsPage({ onView }: { onView: (listing: MarketListing) => void }) {
  const [search, setSearch] = useState("")
  const [appliedSearch, setAppliedSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [category, setCategory] = useState("all")
  const [items, setItems] = useState<MarketListing[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [summary, setSummary] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 })
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
      const result = await getListings({ page, limit, search: appliedSearch, status, category })
      setItems(result.data)
      setCategories(result.categories || [])
      setSummary(result.summary)
      setPages(result.pagination.pages)
      setTotal(result.pagination.total)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load listings")
    } finally {
      setBusy(false)
    }
  }, [appliedSearch, category, limit, page, status])

  useEffect(() => { load() }, [load])

  async function review(id: string, action: "approved" | "rejected") {
    try {
      await moderateListing(id, action, action === "rejected" ? "Rejected by admin" : undefined)
      await load()
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : "Unable to update listing")
    }
  }

  return (
    <div className="directory">
      <PageHeading icon={ShoppingBasket} title="Market Listings" subtitle="Review farmer marketplace posts, prices, and the people behind them." />
      <div className="stat-grid">
        <button type="button" className={`stat-button ${status === "all" ? "active" : ""}`} onClick={() => { setStatus("all"); setPage(1) }}>
          <StatCard label="All Listings" value={summary.total.toLocaleString("en-IN")} note="Every marketplace post" icon={ShoppingBasket} tone="green" points={[summary.pending, summary.approved, summary.rejected]} />
        </button>
        <button type="button" className={`stat-button ${status === "pending" ? "active" : ""}`} onClick={() => { setStatus("pending"); setPage(1) }}>
          <StatCard label="Pending" value={summary.pending.toLocaleString("en-IN")} note="Waiting for review" icon={ShoppingBasket} tone="blue" points={[summary.pending]} />
        </button>
        <button type="button" className={`stat-button ${status === "approved" ? "active" : ""}`} onClick={() => { setStatus("approved"); setPage(1) }}>
          <StatCard label="Approved" value={summary.approved.toLocaleString("en-IN")} note="Live for farmers" icon={ShoppingBasket} tone="green" points={[summary.approved]} />
        </button>
        <button type="button" className={`stat-button ${status === "rejected" ? "active" : ""}`} onClick={() => { setStatus("rejected"); setPage(1) }}>
          <StatCard label="Rejected" value={summary.rejected.toLocaleString("en-IN")} note="Not published" icon={ShoppingBasket} tone="red" points={[summary.rejected]} />
        </button>
      </div>

      <section className="data-card">
        <div className="filter-row listings-filters">
          <label className="field">
            <span>Search</span>
            <div className="search-box">
              <Search size={16} />
              <input
                value={search}
                placeholder="Title, crop, or category"
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    setAppliedSearch(search.trim())
                    setPage(1)
                  }
                }}
              />
            </div>
          </label>
          <label className="field">
            <span>Category</span>
            <select value={category} onChange={(event) => { setCategory(event.target.value); setPage(1) }}>
              <option value="all">All categories</option>
              {categories.map((item) => <option key={item} value={item}>{labelOf(item)}</option>)}
            </select>
          </label>
          <div className="filter-actions">
            <button type="button" className="clear-link" onClick={() => { setSearch(""); setAppliedSearch(""); setCategory("all"); setStatus("all"); setPage(1) }}>Clear Filters</button>
            <button type="button" className="primary apply" onClick={() => { setAppliedSearch(search.trim()); setPage(1) }}><Filter size={15} /> Apply Filters</button>
          </div>
        </div>

        {error && <div className="alert error">{error}</div>}
        {busy ? <Loading /> : !items.length ? <EmptyState title="No listings found" detail="Try another search or clear the filters." /> : (
          <div className="table-wrap">
            <table className="directory-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Listing</th>
                  <th>Farmer</th>
                  <th>Mobile</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Location</th>
                  <th>Posted</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const place = [item.user?.village, item.user?.district].filter(Boolean).join(", ")
                  return (
                    <tr key={item.id}>
                      <td className="mono">{item.id.slice(0, 8)}</td>
                      <td>
                        <div className="user-cell">
                          <div>
                            <b>{item.title}</b>
                            <small>{item.description || labelOf(item.category)}</small>
                          </div>
                        </div>
                      </td>
                      <td>{item.user?.name || "—"}</td>
                      <td>{item.user?.phone ? `+91 ${item.user.phone}` : "—"}</td>
                      <td><span className="badge">{labelOf(item.category)}</span></td>
                      <td title={item.price == null ? undefined : moneyExact(item.price)}>{item.price == null ? "—" : money(item.price)}</td>
                      <td>{place || "—"}</td>
                      <td>{formatDate(item.createdAt)}</td>
                      <td><span className={`status ${item.status}`}>{item.status}</span></td>
                      <td>
                        <div className="row-actions">
                          <button type="button" className="icon-button" title="View listing" onClick={() => onView(item)}><Eye size={16} /></button>
                          {item.status === "pending" && (
                            <>
                              <button type="button" className="icon-button" title="Approve" onClick={() => review(item.id, "approved")}><Check size={16} /></button>
                              <button type="button" className="icon-button" title="Reject" onClick={() => review(item.id, "rejected")}><X size={16} /></button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pager page={page} pages={pages} total={total} limit={limit} noun="listings" onPage={setPage} onLimit={(next) => { setLimit(next); setPage(1) }} />
      </section>
    </div>
  )
}
