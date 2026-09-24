import { Leaf } from "lucide-react"

export default function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="empty">
      <Leaf />
      <h3>{title}</h3>
      <p>{detail}</p>
    </div>
  )
}
