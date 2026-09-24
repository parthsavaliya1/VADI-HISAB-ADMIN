export default function Sparkline({ points, color }: { points: number[]; color: string }) {
  if (points.length < 2) return <span className="spark-empty" />
  const width = 92
  const height = 36
  const max = Math.max(...points)
  const min = Math.min(...points)
  const span = max - min || 1
  const coords = points.map((point, index) => {
    const x = (index / (points.length - 1)) * width
    const y = height - 4 - ((point - min) / span) * (height - 8)
    return [x, y] as const
  })
  const line = coords.map(([x, y], index) => `${index ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ")
  const area = `${line} L${width},${height} L0,${height} Z`
  return (
    <svg className="sparkline" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <path d={area} fill={color} opacity="0.16" />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
