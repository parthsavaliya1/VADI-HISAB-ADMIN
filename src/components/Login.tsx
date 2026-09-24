import { useState } from "react"
import type { FormEvent } from "react"
import { Leaf, LoaderCircle } from "lucide-react"
import { sendOtp, session, verifyOtp } from "../api"
import type { SessionUser } from "../api"

export default function Login({ onLogin }: { onLogin: (user: SessionUser) => void }) {
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState("")
  const [sessionId, setSessionId] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError("")
    try {
      if (!sessionId) {
        const result = await sendOtp(phone.replace(/\D/g, "").slice(-10))
        setSessionId(result.sessionId)
      } else {
        const user = await verifyOtp(phone.replace(/\D/g, "").slice(-10), otp, sessionId)
        if (String(user.role).toLowerCase() !== "admin" && !user.isAdmin) {
          session.clear()
          throw new Error("This account does not have admin access.")
        }
        onLogin(user)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in")
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-visual">
        <div className="brand brand-light">
          <img className="brand-logo" src="/vadi-logo-light.png" alt="VADI" />
        </div>
        <div className="login-message">
          <span className="eyebrow">Built for farmers, managed with care</span>
          <h1>Grow impact.<br />Manage smarter.</h1>
          <p>A single place to support VADI users, moderate the community, and run daily operations.</p>
        </div>
      </section>
      <section className="login-card-wrap">
        <form className="login-card" onSubmit={submit}>
          <div className="login-icon"><Leaf size={28} /></div>
          <h2>Admin sign in</h2>
          <p>Use your registered VADI admin mobile number.</p>
          <label>Mobile number</label>
          <div className="phone-input">
            <span>+91</span>
            <input autoFocus={!sessionId} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98765 43210" disabled={!!sessionId} required />
          </div>
          {sessionId && (
            <>
              <label>One-time password</label>
              <input className="text-input" autoFocus value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="Enter 6-digit OTP" required />
            </>
          )}
          {error && <div className="alert error">{error}</div>}
          <button className="primary wide" disabled={busy || phone.replace(/\D/g, "").length < 10}>
            {busy && <LoaderCircle className="spin" size={18} />}
            {sessionId ? "Verify & sign in" : "Send OTP"}
          </button>
          {sessionId && (
            <button className="link-button" type="button" onClick={() => { setSessionId(""); setOtp(""); setError("") }}>
              Change mobile number
            </button>
          )}
        </form>
      </section>
    </main>
  )
}
