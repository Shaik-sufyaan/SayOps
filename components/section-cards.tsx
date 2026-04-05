import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { DashboardStats } from "@/lib/types"

export function SectionCards({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="gap-2 p-5">
          <CardDescription>Total Calls</CardDescription>
          <CardTitle className="text-3xl font-semibold tabular-nums">
            {stats.total_calls.toLocaleString()}
          </CardTitle>
          <CardDescription>All-time calls across your workspace.</CardDescription>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="gap-2 p-5">
          <CardDescription>Calls Today</CardDescription>
          <CardTitle className="text-3xl font-semibold tabular-nums">
            {stats.calls_today.toLocaleString()}
          </CardTitle>
          <CardDescription>Calls started in the last 24 hours.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
