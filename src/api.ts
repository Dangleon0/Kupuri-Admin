import type { AxiosResponse } from 'axios'
import { apiClient } from './lib/apiClient'
import type {
  EventDto,
  EventStatus,
  LoginResponse,
  OrderDto,
  TicketTypeCode,
  TicketTypeDto,
  ValidateTicketResponse,
} from './types/api'

export const login = (email: string, password: string): Promise<AxiosResponse<LoginResponse>> =>
  apiClient.post('/api/auth/login', { email, password })

export const getEvents = (): Promise<AxiosResponse<EventDto[]>> =>
  apiClient.get('/api/admin/events')

export interface CreateEventRequest {
  slug: string
  name: string
  description?: string
  venueName?: string
  startsAt: string
  coverUrl?: string
}

export const createEvent = (data: CreateEventRequest): Promise<AxiosResponse<EventDto>> =>
  apiClient.post('/api/admin/events', data)

export const updateEventStatus = (id: string, status: EventStatus): Promise<AxiosResponse<EventDto>> =>
  apiClient.patch(`/api/admin/events/${encodeURIComponent(id)}/status`, null, {
    params: { status },
  })

export const getTicketTypes = (eventId: string): Promise<AxiosResponse<TicketTypeDto[]>> =>
  apiClient.get(`/api/events/${encodeURIComponent(eventId)}/ticket-types`)

export interface AddTicketTypeRequest {
  code: TicketTypeCode
  displayName: string
  priceCents: number
  capacity: number
}

export const addTicketType = (
  eventId: string,
  data: AddTicketTypeRequest
): Promise<AxiosResponse<TicketTypeDto>> =>
  apiClient.post(`/api/admin/events/${encodeURIComponent(eventId)}/ticket-types`, data)

export interface ReportDto {
  totalPaidOrders: number
  issuedTickets: number
  usedTickets: number
  entryRate: string
}

export const getReport = (eventId: string): Promise<AxiosResponse<ReportDto>> =>
  apiClient.get(`/api/admin/events/${encodeURIComponent(eventId)}/report`)

export interface ComplimentaryRequest {
  buyerName: string
  buyerEmail: string
  note?: string
  items: Array<{ ticketTypeId: string; quantity: number }>
}

export interface ComplimentaryResponse {
  tickets: Array<{ id: string }>
}

export const issueComplimentary = (
  data: ComplimentaryRequest
): Promise<AxiosResponse<ComplimentaryResponse>> =>
  apiClient.post('/api/admin/tickets/complimentary', data)

export interface ValidateTicketRequest {
  token: string
  eventId: string
}

export const validateTicket = (
  data: ValidateTicketRequest
): Promise<AxiosResponse<ValidateTicketResponse>> =>
  apiClient.post('/api/tickets/validate', data)

export const getOrders = (status?: string): Promise<AxiosResponse<OrderDto[]>> =>
  apiClient.get('/api/admin/orders', { params: status ? { status } : undefined })
