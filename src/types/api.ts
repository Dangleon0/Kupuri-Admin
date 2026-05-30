// Wire types shared between apiClient, AuthContext and pages. Keep these in
// sync with the backend DTOs (com.rittersignal.boletera.*); when the backend
// changes a field, this file is the single place to update.

export type AuthRole = 'ADMIN' | 'STAFF_SCANNER'

export interface SessionUser {
  email: string
  role: AuthRole
  displayName?: string
  /** Wall-clock epoch ms after which the token is no longer accepted. */
  expiresAt?: number
}

export interface LoginResponse {
  token?: string
  accessToken?: string
  expiresInSeconds?: number
  role: AuthRole
  displayName?: string
}

export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'COMPLETED' | 'CANCELLED'

export interface EventDto {
  id: string
  slug: string
  name: string
  description?: string
  venueName?: string
  coverUrl?: string
  startsAt: string
  status: EventStatus
}

export type TicketTypeCode = 'GENERAL' | 'EARLY' | 'BACKSTAGE' | 'CORTESIA'

export interface TicketTypeDto {
  id: string
  code: TicketTypeCode
  displayName: string
  priceCents: number
  currency?: string
  capacity: number
  soldQuantity: number
  availableQuantity: number
}

export interface OrderItemDto {
  ticketTypeId: string
  quantity: number
}

export interface OrderDto {
  id: string
  buyerName: string
  buyerEmail: string
  totalCents: number
  currency?: string
  items: OrderItemDto[]
  source: 'PUBLIC' | 'COMPLIMENTARY'
  status: 'PENDING' | 'PAID' | 'CANCELLED'
  createdAt: string
}

export interface ValidateTicketResponse {
  accepted: boolean
  result: 'OK' | 'ERROR' | 'ALREADY_USED' | 'NOT_FOUND' | string
  message?: string
  ticket?: {
    attendeeName?: string
    ticketTypeCode?: string
  }
}
