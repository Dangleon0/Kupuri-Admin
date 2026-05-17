import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080'

const auth = (token) => ({ headers: { Authorization: `Bearer ${token}` } })

export const login = (email, password) =>
  axios.post(`${BASE}/api/auth/login`, { email, password })

export const getEvents = (token) =>
  axios.get(`${BASE}/api/admin/events`, auth(token))

export const createEvent = (token, data) =>
  axios.post(`${BASE}/api/admin/events`, data, auth(token))

export const updateEventStatus = (token, id, status) =>
  axios.patch(`${BASE}/api/admin/events/${id}/status?status=${status}`, {}, auth(token))

export const getTicketTypes = (eventId) =>
  axios.get(`${BASE}/api/events/${eventId}/ticket-types`)

export const addTicketType = (token, eventId, data) =>
  axios.post(`${BASE}/api/admin/events/${eventId}/ticket-types`, data, auth(token))

export const getReport = (token, eventId) =>
  axios.get(`${BASE}/api/admin/events/${eventId}/report`, auth(token))

export const issueComplimentary = (token, data) =>
  axios.post(`${BASE}/api/admin/tickets/complimentary`, data, auth(token))

export const validateTicket = (token, data) =>
  axios.post(`${BASE}/api/tickets/validate`, data, auth(token))

export const getOrders = (token, status) => {
  const params = status ? `?status=${status}` : ''
  return axios.get(`${BASE}/api/admin/orders${params}`, auth(token))
}
