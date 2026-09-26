import { useCallback, useEffect, useState } from "react"
import { ArrowLeft, MapPin, Sprout, Tractor, Wallet } from "lucide-react"
import { getFarmer, updateUser } from "../api"
import type { FarmerRecord } from "../api"
import Loading from "../components/Loading"
import { formatDate, money, moneyExact, nameOf } from "../utils/format"

function textList(value: unknown[]) {
  return value.map((item) => {
    if (typeof item === "string") return item
    if (item && typeof item === "object") {
      const row = item as { name?: string; label?: string }
      return row.name || row.label || ""
    }
    return ""
  }).filter(Boolean)
}

export default function FarmerPage({ userId, onBack }: { userId: string; onBack: () => void }) {
  const [farmer, setFarmer] = useState<FarmerRecord | null>(null)
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    setBusy(true)
    setError("")
    try {
      setFarmer(await getFarmer(userId))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load this farmer")
    } finally {
      setBusy(false)
    }
  }, [userId])

  useEffect(() => { load() }, [load])

  async function patch(payload: { isBlocked?: boolean; role?: string }) {
    if (!farmer) return
    try {
      await updateUser(farmer.id, payload)
      await load()
    } catch (patchError) {
      setError(patchError instanceof Error ? patchError.message : "Update failed")
    }
  }

  if (busy && !farmer) return <Loading />

  const profile = farmer?.profile
  const location = [profile?.village, profile?.taluka, profile?.district].filter(Boolean).join(", ")
  const water = textList(profile?.waterSources || [])
  const tools = textList(profile?.implementsAvailable || [])
  const labour = textList(profile?.labourTypes || [])

  return (
    <div className="directory farmer-page">
      <button type="button" className="back-link" onClick={onBack}><ArrowLeft size={16} /> Back</button>
      {error && <div className="alert error">{error}</div>}
      {!farmer ? null : (
        <>
          <section className="profile-hero">
            {profile?.profileImage
              ? <img className="profile-photo" src={profile.profileImage} alt="" />
              : <div className={`avatar tone-${farmer.role} profile-fallback`}>{nameOf(farmer).charAt(0)}</div>}
            <div>
              <h1>{nameOf(farmer)}</h1>
              <p><MapPin size={14} /> {location || "Location not added"} · +91 {farmer.phone}</p>
              <div className="profile-pills">
                <span className={`badge ${farmer.role}`}>{farmer.role}</span>
                <span className={`status ${farmer.isBlocked ? "blocked" : "active"}`}>{farmer.isBlocked ? "Blocked" : "Active"}</span>
                <span className={`status ${farmer.isProfileCompleted ? "active" : "pending"}`}>{farmer.isProfileCompleted ? "Profile complete" : "Profile incomplete"}</span>
              </div>
            </div>
            <div className="profile-controls">
              <label>
                Role
                <select value={farmer.role} onChange={(event) => patch({ role: event.target.value })}>
                  <option value="farmer">Farmer</option>
                  <option value="dealer">Dealer</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
              <button type="button" className={farmer.isBlocked ? "primary" : "danger-solid"} onClick={() => patch({ isBlocked: !farmer.isBlocked })}>
                {farmer.isBlocked ? "Unblock user" : "Block user"}
              </button>
            </div>
          </section>

          <div className="profile-facts">
            <article>
              <Sprout size={16} />
              <span>Land</span>
              <strong>{profile?.totalLand == null ? "—" : `${profile.totalLand} ${profile.landUnit}`}</strong>
            </article>
            <article>
              <Tractor size={16} />
              <span>Tractor</span>
              <strong>{profile ? (profile.tractorAvailable ? "Available" : "Not available") : "—"}</strong>
            </article>
            <article>
              <Wallet size={16} />
              <span>Income</span>
              <strong title={moneyExact(farmer.finance.income)}>{money(farmer.finance.income)}</strong>
            </article>
            <article>
              <Wallet size={16} />
              <span>Expense</span>
              <strong title={moneyExact(farmer.finance.expense)}>{money(farmer.finance.expense)}</strong>
            </article>
          </div>

          <div className="profile-grid">
            <section className="data-card">
              <h2>Farm details</h2>
              <dl className="detail-list">
                <div><dt>District</dt><dd>{profile?.district || "—"}</dd></div>
                <div><dt>Taluka</dt><dd>{profile?.taluka || "—"}</dd></div>
                <div><dt>Village</dt><dd>{profile?.village || "—"}</dd></div>
                <div><dt>Joined</dt><dd>{formatDate(farmer.createdAt)}</dd></div>
                <div><dt>Last active</dt><dd>{formatDate(farmer.lastActiveAt)}</dd></div>
                <div><dt>Data sharing</dt><dd>{profile?.dataSharing == null ? "Not set" : profile.dataSharing ? "Allowed" : "Declined"}</dd></div>
                <div><dt>Referral code</dt><dd>{farmer.referralCode || "—"}</dd></div>
                <div><dt>Referred by</dt><dd>{farmer.referredByMobile ? `+91 ${farmer.referredByMobile}` : "—"}</dd></div>
              </dl>
            </section>
            <section className="data-card">
              <h2>Resources</h2>
              <h3>Water sources</h3>
              <div className="chip-row">{water.length ? water.map((item) => <span key={item}>{item}</span>) : <em>None added</em>}</div>
              <h3>Implements</h3>
              <div className="chip-row">{tools.length ? tools.map((item) => <span key={item}>{item}</span>) : <em>None added</em>}</div>
              <h3>Labour</h3>
              <div className="chip-row">{labour.length ? labour.map((item) => <span key={item}>{item}</span>) : <em>None added</em>}</div>
            </section>
          </div>

          <section className="data-card">
            <h2>Farms</h2>
            {!profile?.farms.length ? <p className="muted">No farms added.</p> : (
              <div className="table-wrap">
                <table className="directory-table">
                  <thead><tr><th>Farm</th><th>Area</th></tr></thead>
                  <tbody>
                    {profile.farms.map((farm, index) => (
                      <tr key={`${farm.name}-${index}`}>
                        <td>{farm.name || "Farm"}</td>
                        <td>{farm.area == null ? "—" : `${farm.area} bigha`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="data-card">
            <h2>Bhagiya contacts</h2>
            {!profile?.bhagiyas.length ? <p className="muted">No sharecropper contacts.</p> : (
              <div className="table-wrap">
                <table className="directory-table">
                  <thead><tr><th>Name</th><th>Mobile</th></tr></thead>
                  <tbody>
                    {profile.bhagiyas.map((person, index) => (
                      <tr key={`${person.phone}-${index}`}>
                        <td>{person.name || "—"}</td>
                        <td>{person.phone ? `+91 ${person.phone}` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="data-card">
            <h2>Crops</h2>
            {!farmer.crops.length ? <p className="muted">No crops recorded.</p> : (
              <div className="table-wrap">
                <table className="directory-table">
                  <thead><tr><th>Crop</th><th>Season</th><th>Farm</th><th>Area</th><th>Land</th><th>Status</th></tr></thead>
                  <tbody>
                    {farmer.crops.map((crop) => (
                      <tr key={crop.id}>
                        <td>{crop.emoji} {crop.name}{crop.subType ? ` · ${crop.subType}` : ""}</td>
                        <td>{[crop.season, crop.year].filter(Boolean).join(" ")}</td>
                        <td>{crop.farmName || "—"}</td>
                        <td>{crop.area == null ? "—" : `${crop.area} ${crop.areaUnit || ""}`}</td>
                        <td>{crop.landType || "—"}</td>
                        <td><span className={`status ${String(crop.status || "").toLowerCase() === "active" ? "active" : "pending"}`}>{crop.status || "—"}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="data-card">
            <h2>Market listings</h2>
            {!farmer.listings.length ? <p className="muted">No marketplace posts.</p> : (
              <div className="table-wrap">
                <table className="directory-table">
                  <thead><tr><th>Listing</th><th>Category</th><th>Price</th><th>Status</th><th>Posted</th></tr></thead>
                  <tbody>
                    {farmer.listings.map((listing) => (
                      <tr key={listing.id}>
                        <td>{listing.title}</td>
                        <td>{listing.category.replaceAll("_", " ")}</td>
                        <td title={listing.price == null ? undefined : moneyExact(listing.price)}>{listing.price == null ? "—" : money(listing.price)}</td>
                        <td><span className={`status ${listing.status}`}>{listing.status}</span></td>
                        <td>{formatDate(listing.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
