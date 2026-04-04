import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { OrgMembership } from '@/lib/types'

interface OrgStore {
  currentOrgId: string | null
  allMemberships: OrgMembership[]
  setCurrentOrg: (orgId: string) => void
  setAllMemberships: (memberships: OrgMembership[]) => void
  currentRole: () => 'owner' | 'admin' | 'member' | null
  clear: () => void
}

export const useOrgStore = create<OrgStore>()(
  persist(
    (set, get) => ({
      currentOrgId: null,
      allMemberships: [],

      setCurrentOrg: (orgId: string) => {
        set({ currentOrgId: orgId })
      },

      setAllMemberships: (memberships: OrgMembership[]) => {
        const currentOrgId = get().currentOrgId
        const hasCurrentOrg = currentOrgId
          ? memberships.some((membership) => membership.organization?.id === currentOrgId)
          : false
        const fallbackMembership = memberships.find((membership) => membership.member.role === 'owner')
          ?? memberships.find((membership) => membership.organization?.id)
          ?? null

        set({
          allMemberships: memberships,
          currentOrgId: hasCurrentOrg ? currentOrgId : fallbackMembership?.organization?.id ?? null,
        })
      },

      currentRole: () => {
        const currentOrgId = get().currentOrgId
        const membership = get().allMemberships.find(
          (m) => m.organization?.id === currentOrgId
        )
        return membership?.member.role ?? null
      },

      clear: () => {
        set({ currentOrgId: null, allMemberships: [] })
      },
    }),
    {
      name: 'org-state', // localStorage key
    }
  )
)
