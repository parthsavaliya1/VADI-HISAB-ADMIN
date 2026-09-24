import type { LucideIcon } from "lucide-react"

export default function HealthRow({
  label,
  value,
  icon: Icon,
  urgent,
}: {
  label: string
  value: number
  icon: LucideIcon
  urgent?: boolean
}) {
  return (
    <div className="health-row">
      <span className={urgent ? "urgent" : ""}><Icon size={18} /></span>
      <b>{label}</b>
      <strong>{value.toLocaleString("en-IN")}</strong>
    </div>
  )
}
