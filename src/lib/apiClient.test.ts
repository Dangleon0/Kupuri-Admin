import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AxiosError } from 'axios'
import { apiClient } from './apiClient'
import { __resetForTests, getToken, setSession } from './authStore'

describe('apiClient interceptors', () => {
  beforeEach(() => {
    __resetForTests()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('attaches Bearer header when a session token is present', async () => {
    setSession('token-abc-123', { email: 'admin@kupuri.test', role: 'ADMIN' })

    const config = await apiClient.interceptors.request.handlers![0]!.fulfilled!(
      { headers: {} as Record<string, string> } as never
    )
    expect(config.headers.Authorization).toBe('Bearer token-abc-123')
  })

  it('omits Authorization header when there is no token', async () => {
    const config = await apiClient.interceptors.request.handlers![0]!.fulfilled!(
      { headers: {} as Record<string, string> } as never
    )
    expect(config.headers.Authorization).toBeUndefined()
  })

  it('clears session and redirects to /login on 401', async () => {
    setSession('expired-token', { email: 'admin@kupuri.test', role: 'ADMIN' })
    const assign = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { pathname: '/orders', assign },
      writable: true,
    })

    const rejected = apiClient.interceptors.response.handlers![0]!.rejected!
    await expect(rejected({ response: { status: 401 } } as AxiosError)).rejects.toBeTruthy()

    expect(getToken()).toBeNull()
    expect(assign).toHaveBeenCalledWith('/login')
  })

  it('does not redirect when the user is already on /login', async () => {
    setSession('expired-token', { email: 'admin@kupuri.test', role: 'ADMIN' })
    const assign = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { pathname: '/login', assign },
      writable: true,
    })

    const rejected = apiClient.interceptors.response.handlers![0]!.rejected!
    await expect(rejected({ response: { status: 401 } } as AxiosError)).rejects.toBeTruthy()

    expect(assign).not.toHaveBeenCalled()
  })
})
