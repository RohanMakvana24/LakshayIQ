import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import type { WeeklyAnalytics } from '@/types/planner';

interface WeeklyChartProps {
  analytics: WeeklyAnalytics;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl bg-zinc-900 px-4 py-3 shadow-xl border border-zinc-800 text-xs">
      <p className="font-bold text-white mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <span className="h-2 w-2 rounded-full" style={{ background: p.fill }} />
          <span className="text-zinc-400 capitalize">{p.name}:</span>
          <span className="font-semibold text-white">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export function WeeklyChart({ analytics }: WeeklyChartProps) {
  return (
    <div className="rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center">
          <BarChart3 className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-zinc-900">Weekly Overview</h3>
          <p className="text-xs text-zinc-400">Tasks created vs completed this week</p>
        </div>
      </div>

      {analytics.totalCreated === 0 ? (
        <div className="py-10 text-center text-sm text-zinc-400">
          No tasks this week yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={analytics.dailyCounts}
            barGap={4}
            barCategoryGap="30%"
            margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11, fill: '#a1a1aa', fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#a1a1aa' }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)', radius: 8 }} />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 11, color: '#71717a', marginTop: 8 }}
            />
            <Bar
              dataKey="created"
              name="Created"
              fill="#e4e4e7"
              radius={[6, 6, 0, 0]}
              maxBarSize={36}
            />
            <Bar
              dataKey="completed"
              name="Completed"
              fill="#10b981"
              radius={[6, 6, 0, 0]}
              maxBarSize={36}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
