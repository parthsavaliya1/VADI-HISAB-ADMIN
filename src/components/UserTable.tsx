import type { AdminUser } from "../api"
import { formatDate, nameOf } from "../utils/format"
import EmptyState from "./EmptyState"

export default function UserTable({
  users,
  compact,
  onRole,
  onBlock,
}: {
  users: AdminUser[]
  compact?: boolean
  onRole?: (user: AdminUser, role: string) => void
  onBlock?: (user: AdminUser) => void
}) {
  if (!users.length) return <EmptyState title="No users found" detail="Try changing your search or filters." />

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>User</th>
            <th>Role</th>
            <th>Location</th>
            <th>Status</th>
            <th>Joined</th>
            {!compact && <th>Action</th>}
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>
                <div className="user-cell">
                  <div className="avatar">{nameOf(user).charAt(0).toUpperCase()}</div>
                  <div>
                    <b>{nameOf(user)}</b>
                    <small>+91 {user.phone}</small>
                  </div>
                </div>
              </td>
              <td>
                {compact ? <span className={`badge ${user.role}`}>{user.role}</span> : (
                  <select className="role-select" value={user.role} onChange={(e) => onRole?.(user, e.target.value)}>
                    <option value="farmer">Farmer</option>
                    <option value="dealer">Dealer</option>
                    <option value="admin">Admin</option>
                  </select>
                )}
              </td>
              <td>{user.profile ? `${user.profile.village}, ${user.profile.district}` : "Profile incomplete"}</td>
              <td><span className={`status ${user.isBlocked ? "blocked" : "active"}`}>{user.isBlocked ? "Blocked" : "Active"}</span></td>
              <td>{formatDate(user.createdAt)}</td>
              {!compact && (
                <td>
                  <button className={user.isBlocked ? "success-button" : "danger-button"} onClick={() => onBlock?.(user)}>
                    {user.isBlocked ? "Unblock" : "Block"}
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
