import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { useActiveBatch } from "@/lib/active-batch-context";
import { useGetBatch, getGetBatchQueryKey } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { 
  Play, ClipboardCheck, Clock, Scale, 
  Sparkles, AlertTriangle, CheckCircle2, 
  Search, LayoutDashboard, Settings
} from "lucide-react";

export default function Home() {
  const [, setLocation] = useLocation();
  const { activeBatchId } = useActiveBatch();
  
  const { data: batchDetail, isLoading } = useGetBatch(activeBatchId!, {
    query: {
      enabled: !!activeBatchId,
      queryKey: getGetBatchQueryKey(activeBatchId!),
    }
  });

  const activeBatch = batchDetail?.batch;

  const navButtons = [
    { label: "Start Batch", path: "/start-batch", icon: Play, color: "bg-amber-500 text-white" },
    { label: "Startup Checklist", path: "/startup-checklist", icon: ClipboardCheck, color: "bg-green-800 text-white" },
    { label: "Hourly Checks", path: "/hourly-checks", icon: Clock, color: "bg-green-800 text-white" },
    { label: "Weight Check", path: "/weight-check", icon: Scale, color: "bg-green-800 text-white" },
    { label: "Cleaning", path: "/cleaning", icon: Sparkles, color: "bg-green-800 text-white" },
    { label: "Report Problem", path: "/report-problem", icon: AlertTriangle, color: "bg-red-600 text-white" },
    { label: "Finish Batch", path: "/finish-batch", icon: CheckCircle2, color: "bg-green-600 text-white" },
    { label: "Batch Search", path: "/batch-search", icon: Search, color: "bg-green-700 text-white" },
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard, color: "bg-green-700 text-white" },
    { label: "Settings", path: "/settings", icon: Settings, color: "bg-green-700 text-white" },
  ];

  return (
    <Layout title="HACCP Control Panel" showBack={false} showHome={false}>
      {/* Branded hero */}
      <div className="flex items-center gap-3 mb-5 -mx-4 -mt-4 px-4 py-3 bg-green-900 border-b border-green-700">
        <img
          src={`${import.meta.env.BASE_URL}greenfood-logo.jpg`}
          alt="Greenfood"
          className="h-12 w-auto rounded object-contain bg-white px-1"
        />
        <div>
          <p className="text-white font-bold text-sm leading-tight">Greenfood BV</p>
          <p className="text-green-300 text-xs">HACCP / GMP Production Manager</p>
        </div>
      </div>

      {activeBatchId && (
        <Card className="mb-6 bg-green-900 text-white border-none shadow-md overflow-hidden">
          <div className="bg-amber-500 h-1 w-full" />
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-xs text-green-300 font-bold uppercase tracking-wider mb-1">Active Batch</p>
              {isLoading ? (
                <div className="h-6 w-32 bg-green-800 animate-pulse rounded" />
              ) : (
                <p className="font-mono text-xl font-bold text-white">{activeBatch?.batchNumber || "Unknown"}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-green-300 font-bold uppercase tracking-wider mb-1">Product</p>
              {isLoading ? (
                <div className="h-4 w-24 bg-green-800 animate-pulse rounded ml-auto" />
              ) : (
                <p className="text-sm font-semibold truncate max-w-[120px]">{activeBatch?.productName || "Unknown"}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4">
        {navButtons.map((btn) => (
          <motion.button
            key={btn.path}
            whileTap={{ scale: 0.95 }}
            onClick={() => setLocation(btn.path)}
            className={`flex flex-col items-center justify-center p-6 rounded-xl shadow-sm border border-slate-100 min-h-32 transition-all ${btn.color} active:opacity-80`}
          >
            <btn.icon className="w-10 h-10 mb-3 opacity-90" />
            <span className="font-bold text-sm text-center leading-tight">
              {btn.label}
            </span>
          </motion.button>
        ))}
      </div>
    </Layout>
  );
}
