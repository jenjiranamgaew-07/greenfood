import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useActiveBatch } from "@/lib/active-batch-context";
import { useGetBatch, useCreateCheck, getGetBatchQueryKey, getListChecksQueryKey } from "@workspace/api-client-react";
import { toast } from "sonner";
import { ShieldAlert, Scale, CheckCircle2, AlertTriangle, XCircle, Info } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

/**
 * EU Regulation 76/211/EEC — Tolerable Negative Error (TNE)
 * Returns the TNE in grams for a given nominal content weight (Qn) in grams.
 */
function calcTNE(qn: number): number {
  if (qn <= 0) return 0;
  if (qn <= 50)   return qn * 0.09;
  if (qn <= 100)  return 4.5;
  if (qn <= 200)  return qn * 0.045;
  if (qn <= 300)  return 9;
  if (qn <= 500)  return qn * 0.03;
  if (qn <= 1000) return 15;
  return qn * 0.015;
}

/**
 * Get the pre-calculated T1 minimum net weight from the product's Excel-sourced data.
 * Falls back to computing via TNE if not available.
 */
function getT1MinFromProduct(product: {
  nominalWeightG?: number | null;
  minWeightQn5to50?: number | null;
  minWeightQn50to100?: number | null;
  minWeightQn100to200?: number | null;
  minWeightQn200to300?: number | null;
  minWeightQn300to500?: number | null;
  minWeightQn500to1000?: number | null;
  minWeightQn1000to10000?: number | null;
}): number | null {
  const qn = product.nominalWeightG;
  if (!qn) return null;

  // Use pre-calculated values from the Excel file
  if (qn <= 50 && product.minWeightQn5to50 != null) return product.minWeightQn5to50;
  if (qn <= 100 && product.minWeightQn50to100 != null) return product.minWeightQn50to100;
  if (qn <= 200 && product.minWeightQn100to200 != null) return product.minWeightQn100to200;
  if (qn <= 300 && product.minWeightQn200to300 != null) return product.minWeightQn200to300;
  if (qn <= 500 && product.minWeightQn300to500 != null) return product.minWeightQn300to500;
  if (qn <= 1000 && product.minWeightQn500to1000 != null) return product.minWeightQn500to1000;
  if (product.minWeightQn1000to10000 != null) return product.minWeightQn1000to10000;

  // Fallback: compute from TNE
  return qn - calcTNE(qn);
}

type CheckStatus = "idle" | "pass" | "t1_warn" | "fail";

function getStatus(measured: number, targetTotal: number, tne: number): CheckStatus {
  const deviation = targetTotal - measured;
  if (deviation <= 0) return "pass";
  if (deviation <= tne) return "pass";
  if (deviation <= 2 * tne) return "t1_warn";
  return "fail";
}

export default function WeightCheck() {
  const [, setLocation] = useLocation();
  const { activeBatchId } = useActiveBatch();
  const queryClient = useQueryClient();
  const [measuredWeight, setMeasuredWeight] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: batchDetail } = useGetBatch(activeBatchId!, {
    query: { enabled: !!activeBatchId }
  });

  const createCheck = useCreateCheck();

  if (!activeBatchId || !batchDetail) {
    return (
      <Layout title="Weight Check">
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <ShieldAlert className="w-16 h-16 text-slate-400 mb-4" />
          <h2 className="text-xl font-bold text-slate-700">No Active Batch</h2>
          <Button className="mt-6" onClick={() => setLocation("/")}>Go Home</Button>
        </div>
      </Layout>
    );
  }

  const product = batchDetail.product;
  const nominalWeightG = product?.nominalWeightG ?? null;
  const emptyPackagingWeightG = product?.emptyPackagingWeightG ?? null;

  const hasWeightData = nominalWeightG != null && emptyPackagingWeightG != null;
  const targetTotal = hasWeightData ? (nominalWeightG! + emptyPackagingWeightG!) : null;
  const tne = hasWeightData ? calcTNE(nominalWeightG!) : null;

  // Use pre-calculated T1 min from Excel data (most accurate)
  const t1MinNet = product ? getT1MinFromProduct(product) : null;
  const t1MinTotal = (t1MinNet != null && emptyPackagingWeightG != null)
    ? t1MinNet + emptyPackagingWeightG
    : (targetTotal != null && tne != null ? targetTotal - tne : null);
  const t2MinTotal = (targetTotal != null && tne != null) ? targetTotal - 2 * tne : null;

  const measured = parseFloat(measuredWeight);
  const isValidInput = !isNaN(measured) && measured > 0;

  const status: CheckStatus = (hasWeightData && isValidInput && targetTotal != null && tne != null)
    ? getStatus(measured, targetTotal, tne)
    : "idle";

  const deviation = (hasWeightData && isValidInput && targetTotal != null)
    ? (measured - targetTotal).toFixed(1)
    : null;

  const handleSubmit = async (overrideResult?: "pass" | "fail") => {
    if (!activeBatchId || !batchDetail) return;
    setIsSubmitting(true);

    const finalResult = overrideResult ?? (status === "pass" ? "pass" : status === "t1_warn" ? "warning" : "fail");
    const isFail = finalResult === "fail";
    const isWarn = finalResult === "warning";

    try {
      await createCheck.mutateAsync({
        data: {
          batchId: activeBatchId,
          checkType: "weight",
          checkData: {
            measuredWeightG: isValidInput ? measured : null,
            targetWeightG: targetTotal,
            nominalWeightG,
            emptyPackagingWeightG,
            t1MinNetG: t1MinNet,
            t1MinTotalG: t1MinTotal,
            t2MinTotalG: t2MinTotal,
            tneG: tne ? Math.round(tne * 10) / 10 : null,
            deviationG: deviation,
            euRegResult: status,
            source: "EU 76/211/EEC",
          },
          result: isFail ? "fail" : isWarn ? "warning" : "pass",
          userName: batchDetail.batch.operatorName,
          notes: isFail
            ? `REJECT: measured ${measured}g, target ${targetTotal}g, T2 exceeded (deviation ${deviation}g)`
            : isWarn
            ? `WARNING: measured ${measured}g — within T2 but exceeds T1. Destructive sample check required.`
            : undefined,
        }
      });

      queryClient.invalidateQueries({ queryKey: getGetBatchQueryKey(activeBatchId) });
      queryClient.invalidateQueries({ queryKey: getListChecksQueryKey() });

      if (isFail) {
        toast.error("REJECT — T2 exceeded. Pull this bottle + 5 before + 5 after for quarantine.", { duration: 7000 });
      } else if (isWarn) {
        toast.warning("WARNING — Exceeds T1. Destructive check required on this sample.", { duration: 6000 });
      } else {
        toast.success("Weight check passed ✓");
      }

      setLocation("/");
    } catch {
      toast.error("Failed to record weight check");
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusConfig = {
    idle:    { bg: "bg-slate-100",  border: "border-slate-200",  text: "text-slate-500",  icon: null,                                                 label: "Enter measured weight below" },
    pass:    { bg: "bg-green-50",   border: "border-green-300",  text: "text-green-800",  icon: <CheckCircle2 className="w-8 h-8 text-green-600" />,   label: "PASS — Within tolerance" },
    t1_warn: { bg: "bg-amber-50",   border: "border-amber-300",  text: "text-amber-800",  icon: <AlertTriangle className="w-8 h-8 text-amber-500" />,  label: "WARNING — Exceeds T1, destructive sample required" },
    fail:    { bg: "bg-red-50",     border: "border-red-300",    text: "text-red-800",    icon: <XCircle className="w-8 h-8 text-red-600" />,          label: "REJECT — Exceeds T2 tolerance" },
  };

  const cfg = statusConfig[status];

  return (
    <Layout title="Weight Check">
      <div className="flex flex-col gap-5">

        {/* Batch header */}
        <div className="bg-green-900 text-white p-4 rounded-xl shadow-md">
          <p className="text-xs text-green-300 font-bold uppercase tracking-wider mb-1">{batchDetail.batch.batchNumber}</p>
          <p className="font-bold text-lg">{product?.productName ?? "—"}</p>
          <div className="flex gap-3 mt-1 text-xs text-green-300">
            <span>{product?.sku}</span>
            {product?.productType && <span>· {product.productType === "K" ? "Capsule" : product.productType === "T" ? "Tablet" : product.productType === "P" ? "Powder" : "Softcap"}</span>}
          </div>
        </div>

        {/* Weight limits from Excel data */}
        {hasWeightData && targetTotal != null && tne != null ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-green-800 px-4 py-2">
              <p className="text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                <Scale className="w-4 h-4" /> EU Reg. 76/211/EEC — Weight Limits
              </p>
            </div>
            <div className="grid grid-cols-3 divide-x divide-slate-100">
              <div className="p-3 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">T1 Min</p>
                <p className="text-lg font-mono font-bold text-amber-600">{t1MinTotal?.toFixed(1) ?? "—"}g</p>
                <p className="text-[10px] text-slate-400">net ≥ {t1MinNet?.toFixed(1)}g</p>
              </div>
              <div className="p-3 text-center bg-slate-50">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Target</p>
                <p className="text-xl font-mono font-bold text-slate-900">{targetTotal}g</p>
                <p className="text-[10px] text-slate-400">Qn {nominalWeightG}g + pkg {emptyPackagingWeightG}g</p>
              </div>
              <div className="p-3 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">T2 Reject</p>
                <p className="text-lg font-mono font-bold text-red-700">{t2MinTotal?.toFixed(1) ?? "—"}g</p>
                <p className="text-[10px] text-slate-400">TNE = {tne.toFixed(1)}g</p>
              </div>
            </div>
            {/* Component weights */}
            {(product?.bottleWeightG || product?.capWeightG) && (
              <div className="border-t border-slate-100 px-4 py-2 flex gap-4 text-[11px] text-slate-500">
                {product.bottleWeightG != null && <span>Bottle: {product.bottleWeightG}g</span>}
                {product.capWeightG != null && <span>Cap: {product.capWeightG}g</span>}
                {product.silicaGelWeightG != null && <span>Silicagel: {product.silicaGelWeightG}g</span>}
                {product.labelWeightG != null && <span>Label: {product.labelWeightG}g</span>}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 items-start">
            <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-800 text-sm">No weight data for this product</p>
              <p className="text-xs text-amber-700 mt-0.5">Add nominal weight and empty packaging weight in Settings → Products.</p>
            </div>
          </div>
        )}

        {/* Measured weight input */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Measured Total Weight (g)</p>
          <div className="flex gap-3 items-center">
            <Input
              type="number"
              step="0.1"
              min="0"
              value={measuredWeight}
              onChange={e => setMeasuredWeight(e.target.value)}
              placeholder="e.g. 89.4"
              className="h-16 text-2xl font-mono text-center"
              autoFocus
            />
            <div className="text-2xl font-bold text-slate-400">g</div>
          </div>
          {isValidInput && deviation !== null && (
            <p className="text-center text-sm font-semibold mt-2" style={{ color: parseFloat(deviation) >= 0 ? "#16a34a" : "#dc2626" }}>
              {parseFloat(deviation) >= 0 ? "+" : ""}{deviation}g from target
            </p>
          )}
        </div>

        {/* Status result */}
        <div className={`rounded-xl border-2 p-4 flex items-center gap-4 transition-all ${cfg.bg} ${cfg.border}`}>
          {cfg.icon}
          <div>
            <p className={`font-bold text-base ${cfg.text}`}>{cfg.label}</p>
            {status === "t1_warn" && (
              <p className="text-xs text-amber-700 mt-1">Between T1 and T2. Per EU Reg. 76/211/EEC, destructive check on this unit required before continuing.</p>
            )}
            {status === "fail" && (
              <p className="text-xs text-red-700 mt-1">Pull this bottle + 5 before + 5 after for quarantine. Notify supervisor immediately.</p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        {hasWeightData ? (
          <div className="space-y-3 pb-6">
            {(status === "pass" || status === "t1_warn") && (
              <Button
                onClick={() => handleSubmit(status === "t1_warn" ? "warning" : "pass")}
                disabled={!isValidInput || isSubmitting}
                className={`w-full h-14 text-lg font-bold rounded-xl ${
                  status === "t1_warn"
                    ? "bg-amber-500 hover:bg-amber-600 text-white"
                    : "bg-green-600 hover:bg-green-700 text-white"
                }`}
              >
                {isSubmitting ? "Recording..." : status === "t1_warn" ? "RECORD WARNING" : "RECORD PASS"}
              </Button>
            )}
            {status === "fail" && (
              <Button
                onClick={() => handleSubmit("fail")}
                disabled={!isValidInput || isSubmitting}
                className="w-full h-14 text-lg font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white"
              >
                {isSubmitting ? "Recording..." : "RECORD REJECT"}
              </Button>
            )}
            {status === "idle" && (
              <Button disabled className="w-full h-14 text-lg font-bold rounded-xl bg-slate-200 text-slate-400 cursor-not-allowed">
                Enter weight to continue
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3 pb-6">
            <p className="text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Manual result recording</p>
            <Button
              onClick={() => handleSubmit("pass")}
              disabled={isSubmitting}
              className="w-full h-14 text-lg font-bold rounded-xl bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle2 className="w-5 h-5 mr-2" /> PASS
            </Button>
            <Button
              onClick={() => handleSubmit("fail")}
              disabled={isSubmitting}
              className="w-full h-14 text-lg font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white"
            >
              <XCircle className="w-5 h-5 mr-2" /> FAIL / REJECT
            </Button>
          </div>
        )}

        {/* EU Reference */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 mb-6">
          <p className="text-xs font-bold text-slate-500 mb-1">EU 76/211/EEC — T1 Tolerance Reference</p>
          <div className="grid grid-cols-2 gap-x-4 text-[11px] text-slate-600">
            <span>5–50g: 9%</span><span>50–100g: 4.5g fixed</span>
            <span>100–200g: 4.5%</span><span>200–300g: 9g fixed</span>
            <span>300–500g: 3%</span><span>500–1000g: 15g fixed</span>
            <span>1000g+: 1.5%</span><span>T2 = 2 × TNE</span>
          </div>
        </div>

      </div>
    </Layout>
  );
}
