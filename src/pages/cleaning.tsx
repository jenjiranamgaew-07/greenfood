import { useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useActiveBatch } from "@/lib/active-batch-context";
import { useGetBatch, useCreateCleaningLog, getListCleaningQueryKey } from "@workspace/api-client-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Sparkles, XCircle } from "lucide-react";

type AreaType = "filling_machine" | "hopper" | "conveyor" | "table" | "floor" | "powder_station" | "tools";

const AREAS: { id: AreaType; label: string; icon: string }[] = [
  { id: "filling_machine", label: "Filling Machine",    icon: "⚙️" },
  { id: "hopper",          label: "Product Hopper",     icon: "🪣" },
  { id: "conveyor",        label: "Conveyor Belt",      icon: "📦" },
  { id: "table",           label: "Packing Table",      icon: "🗃️" },
  { id: "floor",           label: "Surrounding Floor",  icon: "🧹" },
  { id: "powder_station",  label: "Powder Station",     icon: "🧪" },
  { id: "tools",           label: "Tools & Equipment",  icon: "🔧" },
];

export default function Cleaning() {
  const [, setLocation] = useLocation();
  const { activeBatchId } = useActiveBatch();
  const queryClient = useQueryClient();

  const [area, setArea] = useState<AreaType | "">("");
  const [result, setResult] = useState<"cleaned" | "not_cleaned" | "">("");
  const [notes, setNotes] = useState("");

  const { data: batchDetail } = useGetBatch(activeBatchId!, {
    query: { enabled: !!activeBatchId }
  });

  const createCleaning = useCreateCleaningLog();

  const handleSubmit = async () => {
    if (!area || !result) {
      toast.error("Select an area and mark it cleaned or not");
      return;
    }
    try {
      await createCleaning.mutateAsync({
        data: {
          area: area as AreaType,
          result: result as "cleaned" | "not_cleaned",
          cleanedBy: batchDetail?.batch.operatorName || "Operator",
          batchId: activeBatchId || undefined,
          notes: notes || undefined,
        }
      });
      queryClient.invalidateQueries({ queryKey: getListCleaningQueryKey() });
      toast.success("Cleaning log saved ✓");
      setLocation("/");
    } catch {
      toast.error("Failed to record cleaning log");
    }
  };

  const canSubmit = area !== "" && result !== "";

  return (
    <Layout title="Cleaning Log">
      <div className="flex flex-col gap-5 pb-32">

        {/* Header */}
        <div className="bg-slate-900 text-white p-4 rounded-xl shadow-md flex items-center gap-4">
          <div className="bg-blue-500/20 p-3 rounded-full">
            <Sparkles className="w-7 h-7 text-blue-400" />
          </div>
          <div>
            <p className="font-bold text-lg leading-tight">Line Clearance</p>
            <p className="text-slate-400 text-sm">Record cleaning between batches</p>
          </div>
        </div>

        {/* Area selection — tap-to-select grid */}
        <div>
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Area Cleaned</p>
          <div className="grid grid-cols-2 gap-3">
            {AREAS.map((a) => {
              const selected = area === a.id;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setArea(a.id)}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                    selected
                      ? "border-blue-500 bg-blue-50 shadow-md"
                      : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/50"
                  }`}
                >
                  <span className="text-2xl leading-none">{a.icon}</span>
                  <span className={`font-bold text-sm leading-tight ${selected ? "text-blue-800" : "text-slate-700"}`}>
                    {a.label}
                  </span>
                  {selected && (
                    <CheckCircle2 className="w-4 h-4 text-blue-600 ml-auto shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Result — only show after area is picked */}
        {area && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-200">
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Status</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setResult("cleaned")}
                className={`h-16 rounded-xl border-2 text-lg font-bold transition-all flex items-center justify-center gap-2 ${
                  result === "cleaned"
                    ? "bg-green-600 border-green-600 text-white shadow-md"
                    : "bg-white border-slate-200 text-slate-600 hover:border-green-400 hover:bg-green-50"
                }`}
              >
                {result === "cleaned" && <CheckCircle2 className="w-5 h-5" />}
                CLEANED
              </button>
              <button
                type="button"
                onClick={() => setResult("not_cleaned")}
                className={`h-16 rounded-xl border-2 text-lg font-bold transition-all flex items-center justify-center gap-2 ${
                  result === "not_cleaned"
                    ? "bg-red-600 border-red-600 text-white shadow-md"
                    : "bg-white border-slate-200 text-slate-600 hover:border-red-400 hover:bg-red-50"
                }`}
              >
                {result === "not_cleaned" && <XCircle className="w-5 h-5" />}
                NOT DONE
              </button>
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 block">
            Notes (optional)
          </Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Cleaning agent used, issues found..."
            className="min-h-20 bg-white border-slate-200 text-base"
          />
        </div>

      </div>

      {/* Submit */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 flex justify-center pb-safe max-w-md mx-auto shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || createCleaning.isPending}
          className={`w-full h-16 text-lg font-bold rounded-xl transition-all ${
            !canSubmit
              ? "bg-slate-200 text-slate-400 cursor-not-allowed"
              : result === "not_cleaned"
              ? "bg-red-600 hover:bg-red-700 text-white"
              : "bg-green-600 hover:bg-green-700 text-white"
          }`}
        >
          {createCleaning.isPending
            ? "Saving..."
            : !canSubmit
            ? "Select area and status"
            : result === "not_cleaned"
            ? "SAVE — NOT CLEANED"
            : "SAVE CLEANING LOG ✓"}
        </button>
      </div>
    </Layout>
  );
}
