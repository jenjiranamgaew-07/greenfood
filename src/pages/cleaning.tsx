import { useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { useActiveBatch } from "@/lib/active-batch-context";
import { useGetBatch, useCreateCheck } from "@/lib/mock-api";
import { toast } from "sonner";
import { CheckCircle2, ShieldAlert } from "lucide-react";

const CLEANING_ITEMS = [
  "Line cleared from previous product",
  "Bottle feeder cleaned",
  "Capper cleaned",
  "Conveyor cleaned",
  "Label machine cleaned",
  "Area sanitized",
];

export default function Cleaning() {
  const [, setLocation] = useLocation();
  const { activeBatchId } = useActiveBatch();

  const [completed, setCompleted] = useState<Record<number, boolean>>({});

  const { data: batchDetail } = useGetBatch(activeBatchId || 0);
  const createCheck = useCreateCheck();

  if (!activeBatchId || !batchDetail) {
    return (
      <Layout title="Cleaning">
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <ShieldAlert className="w-16 h-16 text-slate-400 mb-4" />
          <h2 className="text-xl font-bold text-slate-700">
            No Active Batch
          </h2>

          <Button className="mt-6" onClick={() => setLocation("/")}>
            Go Home
          </Button>
        </div>
      </Layout>
    );
  }

  const allDone = CLEANING_ITEMS.every((_, i) => completed[i]);

  const handleSubmit = async () => {
    try {
      await createCheck.mutateAsync({
        data: {
          batchId: activeBatchId,
          checkType: "cleaning",
          checkData: completed,
          result: "pass",
          userName: batchDetail.batch.operatorName || "Operator",
        },
      });

      toast.success("Cleaning completed");
      setLocation("/");
    } catch {
      toast.error("Failed to save cleaning check");
    }
  };

  return (
    <Layout title="Cleaning">
      <div className="flex flex-col gap-4 pb-28">
        {CLEANING_ITEMS.map((item, index) => {
          const done = completed[index];

          return (
            <div
              key={index}
              className={`rounded-xl border-2 p-4 flex items-center justify-between ${
                done
                  ? "border-green-500 bg-green-50"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-center gap-3">
                {done && (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                )}

                <span className="font-medium text-slate-700">{item}</span>
              </div>

              <Button
                type="button"
                onClick={() =>
                  setCompleted((prev) => ({
                    ...prev,
                    [index]: !prev[index],
                  }))
                }
                variant={done ? "default" : "outline"}
              >
                {done ? "Done" : "Check"}
              </Button>
            </div>
          );
        })}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 max-w-md mx-auto">
        <Button
          onClick={handleSubmit}
          disabled={!allDone}
          className="w-full h-14 text-lg font-bold"
        >
          COMPLETE CLEANING
        </Button>
      </div>
    </Layout>
  );
}
