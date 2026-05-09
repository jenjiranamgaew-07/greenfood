import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetDashboardKpis, useGetRecentActivity } from "@workspace/api-client-react";
import { formatDistanceToNow } from "date-fns";
import { 
  Activity, AlertCircle, CheckCircle2, Factory, 
  Droplet, Scale, Wrench 
} from "lucide-react";

export default function Dashboard() {
  const { data: kpis, isLoading: kpisLoading } = useGetDashboardKpis();
  const { data: activity, isLoading: activityLoading } = useGetRecentActivity();

  return (
    <Layout title="Dashboard">
      <div className="flex flex-col gap-6">
        
        {/* KPI Grid */}
        <div className="grid grid-cols-2 gap-3">
          <KpiCard 
            title="Active Batches" 
            value={kpis?.activeBatches} 
            loading={kpisLoading}
            icon={Factory}
            color="text-amber-600"
            bg="bg-amber-50"
          />
          <KpiCard 
            title="Completed Today" 
            value={kpis?.batchesCompletedToday} 
            loading={kpisLoading}
            icon={CheckCircle2}
            color="text-green-600"
            bg="bg-green-50"
          />
          <KpiCard 
            title="Failed Checks" 
            value={kpis?.failedChecksToday} 
            loading={kpisLoading}
            icon={AlertCircle}
            color="text-red-600"
            bg="bg-red-50"
            alert={kpis?.failedChecksToday ? kpis.failedChecksToday > 0 : false}
          />
          <KpiCard 
            title="Weight Failures" 
            value={kpis?.weightFailuresToday} 
            loading={kpisLoading}
            icon={Scale}
            color="text-orange-600"
            bg="bg-orange-50"
            alert={kpis?.weightFailuresToday ? kpis.weightFailuresToday > 0 : false}
          />
          <KpiCard 
            title="Open Problems" 
            value={kpis?.openProblems} 
            loading={kpisLoading}
            icon={Wrench}
            color="text-purple-600"
            bg="bg-purple-50"
          />
          <KpiCard 
            title="Cleaning %" 
            value={kpis?.cleaningCompletionPercent != null ? `${kpis.cleaningCompletionPercent}%` : undefined} 
            loading={kpisLoading}
            icon={Droplet}
            color="text-cyan-600"
            bg="bg-cyan-50"
          />
        </div>

        {/* Recent Activity */}
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50 border-b border-slate-100 py-3">
            <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center">
              <Activity className="w-4 h-4 mr-2" /> Live Activity Feed
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {activityLoading ? (
              <div className="p-6 text-center text-slate-500">Loading...</div>
            ) : activity?.length === 0 ? (
              <div className="p-6 text-center text-slate-500">No recent activity</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {activity?.map((item) => (
                  <div key={item.id} className="p-4 flex gap-4 items-start">
                    <div className="mt-1">{getActivityIcon(item.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">{item.message}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                        <span className="font-semibold">{item.userName}</span>
                        {item.batchNumber && (
                          <>
                            <span>•</span>
                            <span className="font-mono bg-slate-100 px-1 rounded">{item.batchNumber}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

function KpiCard({ title, value, loading, icon: Icon, color, bg, alert }: any) {
  return (
    <Card className={`border-slate-200 shadow-sm ${alert ? 'border-red-300 ring-1 ring-red-500' : ''}`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className={`p-2 rounded-lg ${bg} ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
        <div>
          {loading ? (
            <div className="h-8 w-16 bg-slate-200 animate-pulse rounded mb-1" />
          ) : (
            <p className={`text-2xl font-bold font-mono ${alert ? 'text-red-600' : 'text-slate-900'}`}>
              {value !== undefined ? value : '-'}
            </p>
          )}
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">{title}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function getActivityIcon(type: string) {
  switch(type) {
    case 'batch_started': return <Factory className="w-5 h-5 text-blue-500" />;
    case 'batch_completed': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    case 'check_failed': return <AlertCircle className="w-5 h-5 text-red-500" />;
    case 'deviation_reported': return <Wrench className="w-5 h-5 text-purple-500" />;
    case 'cleaning_done': return <Droplet className="w-5 h-5 text-cyan-500" />;
    case 'weight_failure': return <Scale className="w-5 h-5 text-orange-500" />;
    default: return <Activity className="w-5 h-5 text-slate-400" />;
  }
}
