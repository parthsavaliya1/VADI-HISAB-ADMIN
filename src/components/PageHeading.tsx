import type { LucideIcon } from "lucide-react"

export default function PageHeading({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: LucideIcon
  title: string
  subtitle: string
}) {
  return (
    <div className="page-heading">
      <span className="page-mark"><Icon size={22} /></span>
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
    </div>
  )
}
