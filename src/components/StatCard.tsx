import type { LucideIcon } from "lucide-react"
import Sparkline from "./Sparkline"

export default function StatCard({
  label,
  value,
  note,
  direction,
  icon: Icon,
  tone,
  points,
}: {
  label: string
  value: string
  note: string
  direction?: "up" | "down"
  icon: LucideIcon
  tone: "green" | "red" | "blue"
  points: number[]
}) {
  const color = tone === "red" ? "#e25b52" : tone === "blue" ? "#3b82c4" : "#18a36a"
  return (
    <article className="stat-card">
      <div className="stat-top">
        <span className={`stat-icon ${tone}`}><Icon size={18} /></span>
        <Sparkline points={points} color={color} />
      </div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small className={direction || ""}>{note}</small>
    </article>
  )
}
