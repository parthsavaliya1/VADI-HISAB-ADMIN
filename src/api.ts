const API_BASE = (import.meta.env.VITE_API_URL || "https://api.vadindia.com/api").replace(/\/$/, "")
const TOKEN_KEY = "vadi_admin_token"

export type AdminUser = {
  id: string
  phone: string
  role: "farmer" | "dealer" | "admin"
  isProfileCompleted: boolean
  isBlocked: boolean
  isGrowthPartner: boolean
  lastActiveAt: string | null
  createdAt: string
  profile: {
    name: string
    district: string
    taluka: string
    village: string
    profileImage?: string | null
  } | null
}

export type DashboardData = {
  metrics: {
    totalUsers: number
    farmers: number
    dealers: number
    listings: number
    feedPosts: number
    dealerBills: number
    blockedUsers: number
    pendingReports: number
    reports: number
  }
  range: { from: string | null; to: string | null; bucket: "day" | "month" }
  growth: Array<{
    date: string
    users: number
    farmers: number
    dealers: number
    listings: number
    feedPosts: number
    dealerBills: number
    reports: number
  }>
  recentUsers: AdminUser[]
  previousUsers?: number
  roles?: { farmer: number; dealer: number; admin: number; other: number }
  userGrowth?: Array<{ month: string; total: number }>
  finance?: {
    income: number
    expense: number
    previousIncome: number
    previousExpense: number
    months: Array<{ month: string; income: number; expense: number }>
    categories: Array<{ name: string; kind: string; count: number; amount: number; share: number }>
    recent: Array<{ id: string; kind: "income" | "expense"; category: string; amount: number; date: string | null; name: string }>
  }
  recentBills?: Array<{ id: string; number: number; customer: string; amount: number; paid: number; date: string | null }>
  recentListings?: Array<{ id: string; title: string; status: string; amount: number | null; date: string | null }>
}

export type UserPlace = { district: string; taluka: string; village: string }

export type UserSummary = {
  total: number
  active: number
  blocked: number
  newThisMonth: number
  newLastMonth: number
  spark: number[]
  cumulative: number[]
}

export type PaginatedUsers = {
  data: AdminUser[]
  summary?: UserSummary
  places?: UserPlace[]
  pagination: { page: number; limit: number; total: number; pages: number }
}

export const session = {
  get: () => localStorage.getItem(TOKEN_KEY),
  save: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

async function request<T>(path: string, options: RequestInit & { auth?: boolean } = {}): Promise<T> {
  const { auth = true, headers, ...rest } = options
  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...rest,
      headers: {
        ...(rest.body ? { "Content-Type": "application/json" } : {}),
        ...(auth && session.get() ? { Authorization: `Bearer ${session.get()}` } : {}),
        ...(headers || {}),
      },
    })
  } catch {
    throw new Error("Cannot reach the VADI server. Start the HISAB backend, then try again.")
  }
  const body = await response.json().catch(() => null)
  if (!response.ok) {
    if (response.status === 401 && auth) session.clear()
    throw new Error(body?.message || body?.error || "Something went wrong")
  }
  return body as T
}

export async function sendOtp(phone: string) {
  return request<{ sessionId: string }>("/auth/send-otp", {
    method: "POST",
    auth: false,
    body: JSON.stringify({ phone }),
  })
}

export async function verifyOtp(phone: string, otp: string, sessionId: string) {
  const result = await request<{ token: string }>("/auth/verify-otp", {
    method: "POST",
    auth: false,
    body: JSON.stringify({ phone, otp, sessionId }),
  })
  session.save(result.token)
  return getMe()
}

export type SessionUser = {
  _id: string
  phone: string
  role: string
  isAdmin?: boolean
}

export async function getMe() {
  const result = await request<{ user: SessionUser }>("/auth/me")
  return result.user
}

export async function getDashboard(params: { from?: string; to?: string; search?: string } = {}) {
  const query = new URLSearchParams()
  if (params.from) query.set("from", params.from)
  if (params.to) query.set("to", params.to)
  if (params.search) query.set("search", params.search)
  const suffix = query.toString() ? `?${query}` : ""
  const result = await request<{ data: DashboardData }>(`/admin/dashboard${suffix}`)
  return result.data
}

export async function getUsers(params: {
  page?: number
  limit?: number
  search?: string
  role?: string
  status?: string
  district?: string
  taluka?: string
  village?: string
  from?: string
  to?: string
  sort?: string
}) {
  const query = new URLSearchParams()
  query.set("page", String(params.page || 1))
  query.set("limit", String(params.limit || 20))
  if (params.search) query.set("search", params.search)
  if (params.role && params.role !== "all") query.set("role", params.role)
  if (params.status && params.status !== "all") query.set("status", params.status)
  if (params.district) query.set("district", params.district)
  if (params.taluka) query.set("taluka", params.taluka)
  if (params.village) query.set("village", params.village)
  if (params.from) query.set("from", params.from)
  if (params.to) query.set("to", params.to)
  if (params.sort) query.set("sort", params.sort)
  return request<PaginatedUsers>(`/admin/users?${query}`)
}

export type AccountRow = {
  id: string
  kind: "income" | "expense"
  category: string
  amount: number
  date: string | null
  year: string | null
  notes: string
  user: { id: string; name: string; phone: string; village: string; district: string }
}

export type AccountSeries = { month: string; income: number; expense: number; count: number }

export async function getAccounts(params: {
  page?: number
  limit?: number
  search?: string
  userId?: string
  kind?: string
  category?: string
  from?: string
  to?: string
  sort?: string
}) {
  const query = new URLSearchParams()
  query.set("page", String(params.page || 1))
  query.set("limit", String(params.limit || 10))
  if (params.search) query.set("search", params.search)
  if (params.userId) query.set("userId", params.userId)
  if (params.kind && params.kind !== "all") query.set("kind", params.kind)
  if (params.category && params.category !== "all") query.set("category", params.category)
  if (params.from) query.set("from", params.from)
  if (params.to) query.set("to", params.to)
  if (params.sort) query.set("sort", params.sort)
  return request<{
    data: AccountRow[]
    summary: { income: number; expense: number; balance: number; count: number; series?: AccountSeries[] }
    pagination: { page: number; limit: number; total: number; pages: number }
  }>(`/admin/accounts?${query}`)
}

export async function updateUser(id: string, payload: { isBlocked?: boolean; role?: string; reason?: string }) {
  const result = await request<{ data: AdminUser }>(`/admin/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
  return result.data
}

export async function getReports(status = "pending") {
  return request<{ data: Array<Record<string, unknown>>; pagination: { total: number } }>(
    `/admin/reports?status=${status}&page=1&limit=50`,
  )
}

export async function updateReport(id: string, status: "resolved" | "dismissed") {
  return request(`/admin/reports/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  })
}

export type FarmerProfileDetail = {
  name: string
  district: string
  taluka: string
  village: string
  profileImage?: string | null
  totalLand: number | null
  landUnit: string
  waterSources: unknown[]
  tractorAvailable: boolean
  implementsAvailable: unknown[]
  labourTypes: unknown[]
  farms: Array<{ name?: string; area?: number | string }>
  bhagiyas: Array<{ name?: string; phone?: string }>
  dataSharing: boolean | null
}

export type FarmerRecord = AdminUser & {
  blockedReason?: string | null
  referralCode?: string | null
  referredByMobile?: string | null
  profile: FarmerProfileDetail | null
  crops: Array<{
    id: string
    name: string
    emoji?: string
    season?: string
    year?: string
    subType?: string
    farmName?: string | null
    area: number | null
    areaUnit?: string
    landType?: string | null
    sowingDate?: string | null
    harvestDate?: string | null
    status?: string
  }>
  listings: Array<{
    id: string
    title: string
    category: string
    status: string
    price: number | null
    image: string | null
    createdAt: string
  }>
  finance: { income: number; incomeCount: number; expense: number; expenseCount: number }
}

export async function getFarmer(id: string) {
  const result = await request<{ data: FarmerRecord }>(`/admin/users/${id}`)
  return result.data
}

export type MarketListing = {
  id: string
  title: string
  description: string
  category: string
  status: string
  price: number | null
  contactPhone?: string | null
  image: string | null
  commentsCount: number
  rejectionReason?: string | null
  createdAt: string
  user: {
    id: string
    name: string
    phone: string
    village: string
    taluka: string
    district: string
    profileImage?: string | null
    role: string
  } | null
}

export async function getListings(params: {
  page?: number
  limit?: number
  search?: string
  status?: string
  category?: string
}) {
  const query = new URLSearchParams()
  query.set("page", String(params.page || 1))
  query.set("limit", String(params.limit || 12))
  if (params.search) query.set("search", params.search)
  if (params.status && params.status !== "all") query.set("status", params.status)
  if (params.category && params.category !== "all") query.set("category", params.category)
  return request<{
    data: MarketListing[]
    summary: { total: number; pending: number; approved: number; rejected: number }
    categories: string[]
    pagination: { page: number; limit: number; total: number; pages: number }
  }>(`/admin/listings?${query}`)
}

export async function getPendingListings() {
  return request<{ data: Array<Record<string, unknown>>; pagination: { total: number } }>(
    "/admin/listings/pending?page=1&limit=50",
  )
}

export async function moderateListing(id: string, status: "approved" | "rejected", rejectionReason?: string) {
  return request(`/admin/listings/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status, rejectionReason }),
  })
}

export async function sendBroadcast(payload: { title: string; body: string }) {
  return request<{ message?: string; sent?: number }>("/admin/broadcast", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

