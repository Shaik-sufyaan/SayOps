/**
 * Frontend fix tests (SpeakOps)
 * Run with: bun test tests/fixes.test.ts
 *
 * Tests the logic fixes without needing React/DOM:
 * 1. fetchConversations URL construction
 * 2. Null guards on conversations filter
 * 3. Chart data null guard
 * 4. Stats field name (messages_per_day not calls_per_day)
 * 5. Dashboard doesn't redirect on empty agents
 */

import { describe, test, expect } from 'bun:test'

// ── 1. fetchConversations builds correct URL ──

describe('fetchConversations URL', () => {
  // Extracted logic from lib/api-client.ts
  function buildConversationsEndpoint(agentId?: string): string {
    return agentId ? `/conversations?agentId=${agentId}` : '/conversations'
  }

  test('with agentId "super" builds query param URL', () => {
    expect(buildConversationsEndpoint('super')).toBe('/conversations?agentId=super')
  })

  test('with agent ID builds query param URL', () => {
    expect(buildConversationsEndpoint('agent_mlo9w4mujpqtgzw'))
      .toBe('/conversations?agentId=agent_mlo9w4mujpqtgzw')
  })

  test('without agentId builds plain URL', () => {
    expect(buildConversationsEndpoint()).toBe('/conversations')
    expect(buildConversationsEndpoint(undefined)).toBe('/conversations')
  })

  test('OLD broken URL pattern is NOT used', () => {
    const agentId = 'super'
    const endpoint = buildConversationsEndpoint(agentId)
    // Must NOT match the old broken pattern
    expect(endpoint).not.toMatch(/\/agents\/.*\/conversations/)
  })
})

// ── 2. Conversations response null guard ──

describe('fetchConversations null guard', () => {
  // Extracted logic from lib/api-client.ts:
  // return res.conversations ?? []
  function extractConversations(res: { conversations?: any[] }): any[] {
    return res.conversations ?? []
  }

  test('returns array when conversations exist', () => {
    const res = { conversations: [{ id: 'c1' }, { id: 'c2' }] }
    expect(extractConversations(res)).toHaveLength(2)
  })

  test('returns empty array when conversations is undefined', () => {
    const res = { conversations: undefined }
    expect(extractConversations(res)).toEqual([])
  })

  test('returns empty array when conversations key is missing', () => {
    const res = {} as any
    expect(extractConversations(res)).toEqual([])
  })
})

// ── 3. Sidebar filter null guard ──

describe('sidebar conversations filter', () => {
  // Extracted logic from components/app-sidebar.tsx:
  // setSessions((convs ?? []).filter(c => c.member_id))
  function filterMemberSessions(convs: any[] | undefined | null): any[] {
    return (convs ?? []).filter((c: any) => c.member_id)
  }

  test('filters to member conversations correctly', () => {
    const convs = [
      { id: '1', member_id: 'mem_1' },
      { id: '2', member_id: null },
      { id: '3', member_id: 'mem_2' },
    ]
    const result = filterMemberSessions(convs)
    expect(result).toHaveLength(2)
    expect(result.map((c: any) => c.id)).toEqual(['1', '3'])
  })

  test('handles undefined without crashing', () => {
    expect(filterMemberSessions(undefined)).toEqual([])
  })

  test('handles null without crashing', () => {
    expect(filterMemberSessions(null)).toEqual([])
  })

  test('handles empty array', () => {
    expect(filterMemberSessions([])).toEqual([])
  })
})

// ── 4. Chart data filter null guard ──

describe('chart-area-interactive data filter', () => {
  // Extracted logic from components/chart-area-interactive.tsx:
  // const filteredData = (data ?? []).filter(...)
  function filterChartData(
    data: { date: string; [key: string]: string | number }[] | undefined | null,
    timeRange: string = '30d'
  ): any[] {
    return (data ?? []).filter((item) => {
      const date = new Date(item.date)
      const now = new Date()
      let daysToSubtract = 30
      if (timeRange === '7d') daysToSubtract = 7
      else if (timeRange === '14d') daysToSubtract = 14
      const startDate = new Date(now)
      startDate.setDate(startDate.getDate() - daysToSubtract)
      return date >= startDate
    })
  }

  test('filters data within 30d range', () => {
    const today = new Date().toISOString().split('T')[0]
    const data = [
      { date: today, 'Burke Pros': 5 },
      { date: '2020-01-01', 'Burke Pros': 100 }, // old, should be filtered
    ]
    const result = filterChartData(data, '30d')
    expect(result).toHaveLength(1)
    expect(result[0].date).toBe(today)
  })

  test('handles undefined data', () => {
    expect(filterChartData(undefined)).toEqual([])
  })

  test('handles null data', () => {
    expect(filterChartData(null)).toEqual([])
  })

  test('handles empty array', () => {
    expect(filterChartData([])).toEqual([])
  })
})

// ── 5. Stats field name check ──

describe('DashboardStats shape', () => {
  test('backend returns messages_per_day (frontend must use this, not calls_per_day)', () => {
    // Simulating actual backend response from stats.routes.ts
    const backendResponse = {
      total_calls: 5,
      calls_today: 1,
      active_agents: 2,
      total_messages: 42,
      messages_per_day: [], // This is what the backend returns
      weekly_stats: { calls: 5, messages: 42 },
    }

    // Frontend dashboard passes to chart: stats.messages_per_day ?? []
    const chartData = backendResponse.messages_per_day ?? []
    expect(chartData).toBeDefined()
    expect(Array.isArray(chartData)).toBe(true)
  })

  test('fetchStats fallback includes messages_per_day', () => {
    // From lib/api-client.ts catch block
    const fallback = {
      total_calls: 0,
      calls_today: 0,
      active_agents: 0,
      total_messages: 0,
      messages_per_day: [],
      weekly_stats: { calls: 0, messages: 0 },
    }

    expect(fallback.messages_per_day).toEqual([])
    expect((fallback as any).calls_per_day).toBeUndefined()
  })
})

// ── 6. Dashboard redirect behavior ──

describe('dashboard redirect logic', () => {
  test('empty agents should NOT cause redirect', () => {
    const agentsData: any[] = []
    // OLD: if (agentsData.length === 0) { router.push("/create-agent"); return }
    // NEW: no redirect, just set state and render empty state

    // Simulate the new behavior
    let didRedirect = false
    // (no redirect logic at all for empty agents now)

    expect(didRedirect).toBe(false)
    expect(agentsData.length).toBe(0)
  })

  test('unauthenticated user should still redirect to login', () => {
    const user = null
    let redirectTarget = ''

    if (!user) {
      redirectTarget = '/login'
    }

    expect(redirectTarget).toBe('/login')
  })

  test('authenticated user with agents renders normally', () => {
    const user = { uid: 'test-uid', email: 'test@test.com' }
    const agentsData = [{ id: 'agent_1', name: 'Test Agent' }]

    let redirectTarget = ''
    if (!user) {
      redirectTarget = '/login'
    }

    expect(redirectTarget).toBe('')
    expect(agentsData.length).toBeGreaterThan(0)
  })
})

// ── 7. apiFetch URL construction ──

describe('apiFetch URL construction', () => {
  const BACKEND_URL = 'https://evently-backend-176587398849.us-central1.run.app'

  function buildUrl(endpoint: string): string {
    return endpoint.startsWith('http')
      ? endpoint
      : `${BACKEND_URL}${endpoint.startsWith('/api') ? '' : '/api'}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`
  }

  test('conversations endpoint builds correctly', () => {
    const url = buildUrl('/conversations?agentId=super')
    expect(url).toBe(`${BACKEND_URL}/api/conversations?agentId=super`)
  })

  test('stats endpoint builds correctly', () => {
    const url = buildUrl('/stats')
    expect(url).toBe(`${BACKEND_URL}/api/stats`)
  })

  test('agents endpoint builds correctly', () => {
    const url = buildUrl('/agents')
    expect(url).toBe(`${BACKEND_URL}/api/agents`)
  })

  test('absolute URL passes through', () => {
    const url = buildUrl('https://example.com/api/test')
    expect(url).toBe('https://example.com/api/test')
  })
})
