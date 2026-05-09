import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { useActiveBatch } from "@/lib/active-batch-context";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";

const CHECKLIST_ITEMS = [
  { id: "area_clean", label: "Work area is clean and free of previous product" },
  { id: "machine_ready", label: "Machine is clean and assembled correctly" },
  { id: "materials_verified", label: "Correct materials at the station (Bottles, Caps, Labels)" },
  { id: "scale_calibrated", label: "Scale is calibrated and zeroed" },
  { id: "metal_detector", label: "Metal detector test passed" },
  { id: "lot_codes", label: "Lot codes match the batch record" },
  { id: "temp_humidity", label: "Room temperature and humidity within limits" },
  { id: "ppe_worn", label: "Operators wearing correct PPE" },
  { id: "safety_guards", label: "All machine safety guards are in place" },
];

export default function StartupChecklist() {
  const [, setLocation] = useLocation();
  const { activeBatchId } = useActiveBatch();

  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [hasFailures, setHasFailures] = useState(false);

  useEffect(() => {
    setHasFailures(Object.values(answers).some(a => a === false));
  }, [answers]);

  const handleAnswer = (id: string, value: boolean) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  const isComplete = CHECKLIST_ITEMS.every(
    item => answers[item.id] !== undefined
  );

  const handleSubmit = async () => {
    if (hasFailures) {
      toast.error("Startup checks failed");
      setLocation("/report-problem");
    } else {
      toast.success("Startup checklist passed ✓");
      setLocation("/");
    }
  };

  if (!activeBatchId) {
    return (
      <Layout title="Startup Checklist">
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <ShieldAlert className="w-16 h-16 text-slate-400 mb-4" />
          <h2 className="text-xl font-bold text-slate-700">
            No Active Batch
          </h2>
          <p className="text-slate-500 mt-2">
            Start a batch from the home screen first.
          </p>
          <Button
            className="mt-6"
            onClick={() => setLocation("/")}
          >
            Go Home
          </Button>
        </div>
      </Layout>
    );
  }

  const answered = Object.keys(answers).length;

  return (
    <Layout title="Startup Checklist">
      <div className="flex flex-col gap-4 pb-32">

        {hasFailures && (
          <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-r flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-900 text-sm">
                Checklist failed — resolve before starting production
              </p>
            </div>
          </div>
        )}

        <div className="bg-slate-900 text-white p-4 rounded-xl flex justify-between items-center shadow-md">
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Batch
            </p>
            <p className="font-mono text-lg font-bold">
              {activeBatchId}
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Progress
            </p>
            <p className="font-bold text-lg">
              {answered} / {CHECKLIST_ITEMS.length}
            </p>
          </div>
        </div>

        {CHECKLIST_ITEMS.map((item) => {
          const isYes = answers[item.id] === true;
          const isNo = answers[item.id] === false;

          return (
            <div
              key={item.id}
              className={`rounded-xl border-2 shadow-sm transition-all overflow-hidden ${
                isYes
                  ? "border-green-400 bg-green-50"
                  : isNo
                  ? "border-red-400 bg-red-50"
                  : "border-slate-200 bg-white"
              }`}
            >
              {(isYes || isNo) && (
                <div
                  className={`px-4 py-2 flex items-center gap-2 ${
                    isYes ? "bg-green-600" : "bg-red-600"
                  }`}
                >
                  {isYes ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      <span className="text-white text-xs font-bold uppercase tracking-wider">
                        Confirmed
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-white" />
                      <span className="text-white text-xs font-bold uppercase tracking-wider">
                        Failed — action required
                      </span>
                    </>
                  )}
                </div>
              )}

              <div className="p-4">
                <p className="font-bold text-slate-800 text-base mb-4 leading-snug">
                  {item.label}
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleAnswer(item.id, true)}
                    className={`h-16 text-lg font-bold rounded-xl transition-all border-2 ${
                      isYes
                        ? "bg-green-600 border-green-600 text-white shadow-md"
                        : "bg-white border-slate-200 text-slate-600 hover:border-green-400 hover:bg-green-50"
                    }`}
                  >
                    YES
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAnswer(item.id, false)}
                    className={`h-16 text-lg font-bold rounded-xl transition-all border-2 ${
                      isNo
                        ? "bg-red-600 border-red-600 text-white shadow-md"
                        : "bg-white border-slate-200 text-slate-600 hover:border-red-400 hover:bg-red-50"
                    }`}
                  >
                    NO
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 flex justify-center max-w-md mx-auto">
        <button
          onClick={handleSubmit}
          disabled={!isComplete}
          className={`w-full h-16 text-lg font-bold rounded-xl transition-all ${
            !isComplete
              ? "bg-slate-200 text-slate-400 cursor-not-allowed"
              : hasFailures
              ? "bg-red-600 hover:bg-red-700 text-white"
              : "bg-slate-900 hover:bg-slate-800 text-white"
          }`}
        >
          {!isComplete
            ? `${CHECKLIST_ITEMS.length - answered} items remaining`
            : hasFailures
            ? "SUBMIT WITH FAILURES"
            : "SUBMIT CHECKLIST ✓"}
        </button>
      </div>
    </Layout>
  );
}
