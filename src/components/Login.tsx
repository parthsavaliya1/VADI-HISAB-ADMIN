import HubFooter from "./HubFooter"
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
      <div className="login-brand"><a href="/" aria-label="VADI Hisab home"><img src="/vadi-hisab-logo-original.png" alt="VADI Hisab" /></a></div>
      <section className="login-visual">
        <div className="login-message">
          <span className="eyebrow">Fresh beginnings, every day</span>
          <h1>Good things grow<br />with you.</h1>
          <p>Your space to support farmers, manage accounts, and bring your community a little closer.</p>
        </div>
      </section>
      <section className="login-card-wrap">
        <form className="login-card" onSubmit={submit}>
          <div className="login-icon"><Leaf size={28} /></div>
          <span className="login-eyebrow">Hisab workspace</span>
          <h2>Welcome back</h2>
          <p>Use your registered VADI admin mobile number.</p>
          <label htmlFor="login-phone">Mobile number</label>
          <div className="phone-input">
            <span>+91</span>
            <input id="login-phone" type="tel" autoComplete="tel-national" autoFocus={!sessionId} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98765 43210" disabled={!!sessionId} required />
          </div>
          {sessionId && (
            <>
              <label htmlFor="login-otp">One-time password</label>
              <input id="login-otp" inputMode="numeric" autoComplete="one-time-code" className="text-input" autoFocus value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="Enter 6-digit OTP" required />
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
      <div className="hub-page login-hub-footer"><HubFooter /></div>
    </main>
  )
}
