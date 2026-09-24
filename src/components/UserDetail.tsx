import { X } from "lucide-react"
import type { AdminUser } from "../api"
import { formatDate, nameOf } from "../utils/format"

export default function UserDetail({
  user,
  onClose,
  onRole,
  onBlock,
}: {
  user: AdminUser
  onClose: () => void
  onRole: (role: string) => void
  onBlock: () => void
}) {
  const location = [user.profile?.village, user.profile?.taluka, user.profile?.district].filter(Boolean).join(", ")
  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="drawer" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="drawer-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
        <div className={`avatar tone-${user.role}`}>{nameOf(user).charAt(0).toUpperCase()}</div>
        <h2>{nameOf(user)}</h2>
        <p>+91 {user.phone}</p>
        <dl>
          <div><dt>Type</dt><dd>
            <select value={user.role} onChange={(event) => onRole(event.target.value)}>
              <option value="farmer">Farmer</option>
              <option value="dealer">Dealer</option>
              <option value="admin">Admin</option>
            </select>
          </dd></div>
          <div><dt>Status</dt><dd><span className={`status ${user.isBlocked ? "blocked" : "active"}`}>{user.isBlocked ? "Blocked" : "Active"}</span></dd></div>
          <div><dt>Location</dt><dd>{location || "Profile incomplete"}</dd></div>
          <div><dt>Joined</dt><dd>{formatDate(user.createdAt)}</dd></div>
          <div><dt>Last active</dt><dd>{formatDate(user.lastActiveAt)}</dd></div>
        </dl>
        <button type="button" className={user.isBlocked ? "primary" : "danger-solid"} onClick={onBlock}>
          {user.isBlocked ? "Unblock user" : "Block user"}
        </button>
      </aside>
    </div>
  )
}
