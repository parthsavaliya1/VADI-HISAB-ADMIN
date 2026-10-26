import type { LucideIcon } from "lucide-react"

export default function StatCard({
  label,
  value,
  note,
  title,
  direction,
  icon: Icon,
  tone,
}: {
  label: string
  value: string
  note: string
  title?: string
  direction?: "up" | "down"
  icon: LucideIcon
  tone: "green" | "red" | "blue"
  points: number[]
}) {
  return (
    <article className="stat-card">
      <div className="stat-top">
        <span>{label}</span>
        <span className={`stat-icon ${tone}`}><Icon size={16} /></span>
      </div>
      <strong title={title}>{value}</strong>
      <small className={direction || ""}>{note}</small>
    </article>
  )
}
