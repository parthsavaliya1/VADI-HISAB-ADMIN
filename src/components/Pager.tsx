import { ChevronLeft, ChevronRight } from "lucide-react"

function pageWindow(page: number, pages: number) {
  if (pages <= 6) return Array.from({ length: pages }, (_, index) => index + 1)
  const items: Array<number | "gap"> = [1]
  const start = Math.max(2, page - 1)
  const end = Math.min(pages - 1, page + 1)
  if (start > 2) items.push("gap")
  for (let value = start; value <= end; value += 1) items.push(value)
  if (end < pages - 1) items.push("gap")
  items.push(pages)
  return items
}

export default function Pager({
  page,
  pages,
  total,
  limit,
  noun,
  onPage,
  onLimit,
}: {
  page: number
  pages: number
  total: number
  limit: number
  noun: string
  onPage: (page: number) => void
  onLimit: (limit: number) => void
}) {
  const start = total ? (page - 1) * limit + 1 : 0
  const end = Math.min(page * limit, total)
  return (
    <div className="pager">
      <span>Showing {start.toLocaleString("en-IN")} to {end.toLocaleString("en-IN")} of {total.toLocaleString("en-IN")} {noun}</span>
      <div className="pager-controls">
        <select value={limit} onChange={(event) => onLimit(Number(event.target.value))} aria-label="Rows per page">
          <option value={10}>10 per page</option>
          <option value={20}>20 per page</option>
          <option value={50}>50 per page</option>
        </select>
        <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page"><ChevronLeft size={16} /></button>
        {pageWindow(page, Math.max(1, pages)).map((item, index) => item === "gap" ? (
          <span key={`gap-${index}`} className="pager-gap">…</span>
        ) : (
          <button type="button" key={item} className={item === page ? "active" : ""} onClick={() => onPage(item)}>{item}</button>
        ))}
        <button type="button" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Next page"><ChevronRight size={16} /></button>
      </div>
    </div>
  )
}
