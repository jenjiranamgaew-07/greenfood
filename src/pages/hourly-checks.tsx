import { useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useActiveBatch } from "@/lib/active-batch-context";
import { useGetBatch, useCreateCheck, getGetBatchQueryKey, getListChecksQueryKey } from "@workspace/api-client-react";
import { toast } from "sonner";
import { ShieldAlert } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const MACHINE_CHECKS = [
  { id: "tablet_count", label: "Tablet / capsule count correct" },
  { id: "cap_tight", label: "Cap is tight and properly torqued" },
  { id: "label_aligned", label: "Label aligned and readable" },
  { id: "batch_code", label: "Batch code clearly printed" },
  { id: "exp_date", label: "EXP date clearly printed" },
  { id: "reject_bin", label: "Reject bin checked and emptied" },
  { id: "visual_defects", label: "No visual defects on bottles" },
];

const POWDER_CHECKS = [
  { id: "fill_weight", label: "Fill weight correct (within limits)" },
  { id: "rim_clean", label: "Bottle rim is clean (no powder)" },
  { id: "cap_sealed", label: "Cap properly sealed" },
  { id: "label_correct", label: "Label correct and aligned" },
  { id: "no_spill", label: "No powder spill on workstation" },
  { id: "dust_extraction", label: "Dust extraction system working" },
  { id: "visual_defects", label: "No visual defects on bottles" },
];

const SOFTCAP_CHECKS = [
  { id: "softcap_count", label: "Softcap count correct" },
  { id: "cap_tight", label: "Cap is tight and properly torqued" },
  { id: "label_aligned", label: "Label aligned and readable" },
  { id: "batch_code", label: "Batch code clearly printed" },
  { id: "exp_date", label: "EXP date clearly printed" },
  { id: "reject_bin", label: "Reject bin checked and emptied" },
  { id: "visual_defects", label: "No visible leaks or defects on softcaps" },
];

export default function HourlyChecks() {
  const [, setLocation] = useLocation();
  const { activeBatchId } = useActiveBatch();
  const queryClient = useQueryClient();

  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState("");

  const { data: batchDetail } = useGetBatch(activeBatchId!, {
    query: { enabled: !!activeBatchId }
  });

  const createCheck = useCreateCheck();

  const handleAnswer = (id: string, value: boolean) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  if (!activeBatchId || !batchDetail) {
    return (
      <Layout title="Hourly Checks">
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <ShieldAlert className="w-16 h-16 text-slate-400 mb-4" />
          <h2 className="text-xl font-bold text-slate-700">No Active Batch</h2>
          <Button className="mt-6" onClick={() => setLocation("/")}>Go Home</Button>
        </div>
      </Layout>
    );
  }

  const pt = batchDetail.product?.productType ?? "K";
  const isPowder = pt === "P";
  const isSoftcap = pt === "S";

  const checksToUse = isPowder ? POWDER_CHECKS : isSoftcap ? SOFTCAP_CHECKS : MACHINE_CHECKS;

  const checkTypeLabel = isPowder
    ? "Powder Filling — Hourly Checks"
    : isSoftcap
    ? "Softcap — Hourly Checks"
    : "Machine Filling — Hourly Checks";

  const isComplete = checksToUse.every(item => answers[item.id] !== undefined);
  const hasFailures = Object.values(answers).some(a => a === false);

  const handleSubmit = async () => {
    try {
      await createCheck.mutateAsync({
        data: {
          batchId: activeBatchId,
          checkType: "hourly",
          checkData: { ...answers, productType: pt },
          result: hasFailures ? "fail" : "pass",
          userName: batchDetail.batch.operatorName || "Operator",
          notes: notes || undefined,
        }
      });

      queryClient.invalidateQueries({ queryKey: getGetBatchQueryKey(activeBatchId) });
      queryClient.invalidateQueries({ queryKey: getListChecksQueryKey() });

      if (hasFailures) {
        toast.error("Check recorded with failures — review required");
      } else {
        toast.success("Hourly check passed ✓");
      }
      setLocation("/");
    } catch {
      toast.error("Failed to submit check");
    }
  };

  return (
    <Layout title="Hourly Checks">
      <div className="flex flex-col gap-4 pb-32">

        <div className="bg-slate-900 text-white p-4 rounded-xl shadow-md">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">
            {batchDetail.batch.batchNumber}
          </p>
          <p className="font-bold text-lg">{batchDetail.product?.productName ?? "—"}</p>
          <p className="text-xs text-slate-400 mt-1">{checkTypeLabel}</p>
        </div>

        {checksToUse.map((item) => (
          <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <p className="font-bold text-slate-800 text-base mb-4 leading-snug">{item.label}</p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                className={`h-16 text-lg font-bold transition-all ${
                  answers[item.id] === true
                    ? "bg-green-600 hover:bg-green-700 text-white ring-2 ring-green-600 ring-offset-2"
                    : "bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
                onClick={() => handleAnswer(item.id, true)}
              >
                PASS
              </Button>
              <Button
                type="button"
                className={`h-16 text-lg font-bold transition-all ${
                  answers[item.id] === false
                    ? "bg-red-600 hover:bg-red-700 text-white ring-2 ring-red-600 ring-offset-2"
                    : "bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
                onClick={() => handleAnswer(item.id, false)}
              >
                FAIL
              </Button>
            </div>
          </div>
        ))}

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mt-2">
          <Label className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-2 block">Notes / Comments</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any observations..."
            className="min-h-24 bg-slate-50"
          />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 flex justify-center pb-safe max-w-md mx-auto shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <Button
          onClick={handleSubmit}
          disabled={!isComplete || createCheck.isPending}
          className={`w-full h-16 text-lg font-bold rounded-xl ${
            hasFailures
              ? "bg-red-600 hover:bg-red-700 text-white"
              : "bg-slate-900 hover:bg-slate-800 text-white"
          }`}
        >
          {createCheck.isPending ? "Submitting..." : hasFailures ? "SUBMIT WITH FAILURES" : "SUBMIT CHECK"}
        </Button>
      </div>
    </Layout>
  );
}
