import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface OrgMembership {
  member: {
    id: string
    user_id: string
    email: string
    role: 'owner' | 'admin' | 'member'
    display_name: string | null
    organization_id: string
  }
  organization: {
    id: string
    name: string
    subscription_tier: string
  } | null
}

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
        set({ allMemberships: memberships })
        // If no currentOrgId is set, default to the org where user is owner, else first
        const currentOrgId = get().currentOrgId
        if (!currentOrgId && memberships.length > 0) {
          const owned = memberships.find((m) => m.member.role === 'owner')
          set({ currentOrgId: (owned ?? memberships[0]).organization.id })
        }
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
