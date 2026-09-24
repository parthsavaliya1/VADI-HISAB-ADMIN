import { ArrowLeft, ShoppingBasket } from "lucide-react"
import type { MarketListing } from "../api"
import { formatDate, money } from "../utils/format"

function labelOf(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export default function ListingViewPage({ listing, onBack }: { listing: MarketListing; onBack: () => void }) {
  const images = listing.images?.length ? listing.images : listing.image ? [listing.image] : []
  const place = [listing.user?.village, listing.user?.district].filter(Boolean).join(", ")

  return (
    <div className="directory farmer-page">
      <button type="button" className="back-link" onClick={onBack}><ArrowLeft size={16} /> Back</button>
      <section className="profile-hero">
        <div className="profile-fallback"><ShoppingBasket size={28} /></div>
        <div>
          <h1>{listing.title}</h1>
          <p>{labelOf(listing.category)} · {listing.price == null ? "Price on request" : money(listing.price)}</p>
          <div className="profile-pills">
            <span className={`status ${listing.status}`}>{listing.status}</span>
            <span className="badge">{listing.user?.name || "Unknown farmer"}</span>
            {place && <span className="badge">{place}</span>}
            <span className="badge">{formatDate(listing.createdAt)}</span>
          </div>
        </div>
      </section>
      <section className="data-card listing-view">
        <h2>Images</h2>
        {images.length ? (
          <div className="listing-view-photos">
            {images.map((src) => <img key={src} src={src} alt={listing.title} />)}
          </div>
        ) : <p className="muted">No image on this listing.</p>}
      </section>
    </div>
  )
}
