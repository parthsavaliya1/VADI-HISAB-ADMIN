import { useCallback, useEffect, useState } from "react"
import { FileWarning, ShoppingBasket } from "lucide-react"
import { getPendingListings, getReports, moderateListing, updateReport } from "../api"
import EmptyState from "../components/EmptyState"
import Loading from "../components/Loading"
import PageTitle from "../components/PageTitle"

export default function ReviewQueuePage({ kind }: { kind: "listings" | "reports" }) {
  const [items, setItems] = useState<Array<Record<string, unknown>>>([])
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    setBusy(true)
    setError("")
    try {
      const result = kind === "listings" ? await getPendingListings() : await getReports()
      setItems(result.data || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load queue")
    } finally {
      setBusy(false)
    }
  }, [kind])

  useEffect(() => { load() }, [load])

  async function act(id: string, action: string) {
    try {
      if (kind === "listings") {
        await moderateListing(id, action as "approved" | "rejected", action === "rejected" ? "Rejected by admin" : undefined)
      } else {
        await updateReport(id, action as "resolved" | "dismissed")
      }
      setItems((all) => all.filter((item) => String(item._id || item.id) !== id))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed")
    }
  }

  return (
    <>
      <PageTitle
        title={kind === "listings" ? "Market Listings" : "Reports & Safety"}
        subtitle={kind === "listings" ? "Review and approve farmer marketplace posts." : "Resolve community reports and keep VADI safe."}
      />
      <section className="panel">
        {error && <div className="alert error">{error}</div>}
        {busy ? <Loading /> : !items.length ? <EmptyState title="All caught up!" detail="There are no pending items in this queue." /> : (
          <div className="queue">
            {items.map((item) => {
              const id = String(item._id || item.id)
              const reporter = item.reporter as Record<string, unknown> | undefined
              const preview = item.targetPreview as Record<string, unknown> | undefined
              return (
                <article className="queue-item" key={id}>
                  <div className="queue-icon">{kind === "listings" ? <ShoppingBasket /> : <FileWarning />}</div>
                  <div className="queue-copy">
                    <b>{String(item.title || preview?.title || `${item.targetType || item.target_type || "Content"} report`)}</b>
                    <p>{String(item.description || preview?.text || preview?.caption || item.reason || "Review this submitted item.")}</p>
                    <small>{kind === "reports" ? `Reported by ${String(reporter?.name || reporter?.phone || "a user")}` : `Category: ${String(item.category || "General")}`}</small>
                  </div>
                  <div className="queue-actions">
                    <button className="secondary" onClick={() => act(id, kind === "listings" ? "rejected" : "dismissed")}>
                      {kind === "listings" ? "Reject" : "Dismiss"}
                    </button>
                    <button className="primary" onClick={() => act(id, kind === "listings" ? "approved" : "resolved")}>
                      {kind === "listings" ? "Approve" : "Resolve"}
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </>
  )
}
