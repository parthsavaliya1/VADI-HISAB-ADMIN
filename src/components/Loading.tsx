import { LoaderCircle } from "lucide-react"

export default function Loading() {
  return (
    <div className="loading">
      <LoaderCircle className="spin" />
      <span>Loading VADI data…</span>
    </div>
  )
}
