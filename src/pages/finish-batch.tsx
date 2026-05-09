import { useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useActiveBatch } from "@/lib/active-batch-context";
import {
  useGetBatch,
  useCreateYieldReport,
  useUpdateBatch,
  getGetBatchQueryKey,
  getListBatchesQueryKey
} from "@/lib/mock-api";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ShieldAlert, AlertCircle, FileDown, Loader2 } from "lucide-react";

export default function FinishBatch() {
  const [, setLocation] = useLocation();
  const { activeBatchId, setActiveBatchId } = useActiveBatch();
  const queryClient = useQueryClient();

  const { data: batchDetail } = useGetBatch(activeBatchId!, {
    query: { enabled: !!activeBatchId }
  });

  const createYieldReport = useCreateYieldReport();
  const updateBatch = useUpdateBatch();

  const [bottlesProduced, setBottlesProduced] = useState("");
  const [tabletsReceived, setTabletsReceived] = useState("");
  const [tabletsReturned, setTabletsReturned] = useState("");
  const [rejectQuantity, setRejectQuantity] = useState("");

  const [powderReceivedKg, setPowderReceivedKg] = useState("");
  const [powderWasteKg, setPowderWasteKg] = useState("");
  const [powderReturnedKg, setPowderReturnedKg] = useState("");

  const [submitted, setSubmitted] = useState(false);
  const [completedBatchId, setCompletedBatchId] = useState<number | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  if (!activeBatchId || !batchDetail) {
    return (
      <Layout title="Finish Batch">
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <ShieldAlert className="w-16 h-16 text-slate-400 mb-4" />
          <h2 className="text-xl font-bold text-slate-700">No Active Batch</h2>
          <Button className="mt-6" onClick={() => setLocation("/")}>Go Home</Button>
        </div>
      </Layout>
    );
  }

  const isPowder = batchDetail.product?.fillingType === "manual";
  const product = batchDetail.product;

  let difference = 0;
  let percentDiff = 0;
  let withinTolerance = true;
  let packed = 0;
  let received = 0;

  const bProduced = parseFloat(bottlesProduced) || 0;
  const rejects = parseFloat(rejectQuantity) || 0;

  if (isPowder) {
    received = parseFloat(powderReceivedKg) || 0;
    const waste = parseFloat(powderWasteKg) || 0;
    const returned = parseFloat(powderReturnedKg) || 0;
    packed = bProduced * (Number(product?.powderWeightTarget) || 0) / 1000;
    difference = received - (packed + waste + returned);
  } else {
    received = parseFloat(tabletsReceived) || 0;
    const returned = parseFloat(tabletsReturned) || 0;
    packed = bProduced * (product?.tabletsPerBottle || 0);
    difference = received - packed - returned - rejects;
  }

  if (received > 0) {
    percentDiff = Math.abs(difference / received) * 100;
    withinTolerance = percentDiff <= 5;
  }

  const handleSubmit = async () => {
    try {
      await createYieldReport.mutateAsync({
        data: {
          batchId: activeBatchId,
          bottlesProduced: bProduced,
          rejectQuantity: rejects,
          tabletsReceived: isPowder ? undefined : parseFloat(tabletsReceived) || undefined,
          tabletsReturned: isPowder ? undefined : parseFloat(tabletsReturned) || undefined,
          powderReceivedKg: isPowder ? parseFloat(powderReceivedKg) || undefined : undefined,
          powderPackedKg: isPowder ? packed : undefined,
          powderWasteKg: isPowder ? parseFloat(powderWasteKg) || undefined : undefined,
          powderReturnedKg: isPowder ? parseFloat(powderReturnedKg) || undefined : undefined,
          submittedBy: batchDetail.batch.operatorName,
        }
      });

      await updateBatch.mutateAsync({
        id: activeBatchId,
        data: { status: "completed", endTime: new Date().toISOString() }
      });

      queryClient.invalidateQueries({ queryKey: getListBatchesQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetBatchQueryKey(activeBatchId) });

      setCompletedBatchId(activeBatchId);
      setSubmitted(true);
      setActiveBatchId(null);
      toast.success("Batch completed — download PDF for audit records");
    } catch {
      toast.error("Failed to finish batch");
    }
  };

  const handleDownloadPdf = async (batchId: number) => {
    setDownloadingPdf(true);
    try {
      const res = await fetch(`/api/batches/${batchId}/pdf`);
      if (!res.ok) throw new Error("PDF generation failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `batch-${batchDetail?.batch.batchNumber ?? batchId}-report.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF report downloaded");
    } catch {
      toast.error("Failed to download PDF report");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const isFormValid = bottlesProduced !== "" && rejectQuantity !== "" &&
    (isPowder
      ? (powderReceivedKg !== "" && powderWasteKg !== "" && powderReturnedKg !== "")
      : (tabletsReceived !== "" && tabletsReturned !== ""));

  // ── SUCCESS STATE ──────────────────────────────────────────
  if (submitted && completedBatchId) {
    return (
      <Layout title="Batch Complete">
        <div className="flex flex-col items-center justify-center min-h-[70dvh] text-center gap-6 px-4">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center ${withinTolerance ? "bg-green-100" : "bg-red-100"}`}>
            {withinTolerance
              ? <CheckCircle2 className="w-14 h-14 text-green-600" />
              : <AlertCircle className="w-14 h-14 text-red-600" />}
          </div>

          <div>
            <h2 className={`text-2xl font-bold ${withinTolerance ? "text-green-800" : "text-red-800"}`}>
              {withinTolerance ? "Batch Completed" : "Batch Completed"}
            </h2>
            <p className="text-slate-500 mt-1 font-medium">
              {withinTolerance ? "Yield within tolerance — approved" : "Yield variance detected — QA review required"}
            </p>
          </div>

          <div className="w-full bg-slate-50 rounded-xl p-4 text-left border border-slate-200">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Summary</p>
            <p className="font-mono font-bold text-slate-900">{batchDetail.batch.batchNumber}</p>
            <div className="mt-2 grid grid-cols-2 gap-y-1 text-sm">
              <span className="text-slate-500">Bottles produced:</span>
              <span className="font-bold text-slate-800">{bProduced}</span>
              <span className="text-slate-500">Variance:</span>
              <span className={`font-bold ${withinTolerance ? "text-green-700" : "text-red-700"}`}>{percentDiff.toFixed(2)}%</span>
            </div>
          </div>

          <Button
            onClick={() => handleDownloadPdf(completedBatchId)}
            disabled={downloadingPdf}
            className="w-full h-16 text-lg font-bold rounded-xl bg-green-900 hover:bg-green-800 text-white"
          >
            {downloadingPdf
              ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Generating PDF...</>
              : <><FileDown className="w-5 h-5 mr-2" /> Download Audit Report (PDF)</>}
          </Button>

          <Button variant="outline" className="w-full h-12 font-bold border-slate-300" onClick={() => setLocation("/")}>
            Back to Home
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Finish Batch">
      <div className="flex flex-col gap-6 pb-32">
        <Card className="border-none shadow-md bg-green-900 text-white overflow-hidden">
          <div className="bg-amber-500 h-1 w-full" />
          <CardContent className="p-4">
            <p className="text-xs text-green-300 font-bold uppercase tracking-wider mb-1">Completing Batch</p>
            <p className="font-mono text-xl font-bold">{batchDetail.batch.batchNumber}</p>
            <p className="text-sm font-semibold text-green-200 mt-1">{batchDetail.product?.productName}</p>
            <p className="text-xs text-green-400 mt-1">{isPowder ? "Manual / Powder Filling" : "Machine Filling"}</p>
          </CardContent>
        </Card>

        {isFormValid && (
          <div className={`p-4 rounded-xl border-2 flex items-start gap-3 shadow-sm ${withinTolerance ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
            {withinTolerance
              ? <CheckCircle2 className="w-8 h-8 text-green-600 shrink-0" />
              : <AlertCircle className="w-8 h-8 text-red-600 shrink-0" />}
            <div>
              <h3 className={`font-bold text-lg leading-tight ${withinTolerance ? "text-green-800" : "text-red-800"}`}>
                {withinTolerance ? "Yield Within Tolerance" : "Yield Variance Too High"}
              </h3>
              <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1 text-sm font-medium">
                <span className="text-slate-500">Difference:</span>
                <span className={withinTolerance ? "text-green-700" : "text-red-700 font-bold"}>
                  {difference > 0 ? "+" : ""}{difference.toFixed(2)} {isPowder ? "kg" : "tablets"}
                </span>
                <span className="text-slate-500">Variance:</span>
                <span className={withinTolerance ? "text-green-700" : "text-red-700 font-bold"}>{percentDiff.toFixed(2)}%</span>
              </div>
              {!withinTolerance && (
                <p className="text-xs text-red-600 mt-2 font-bold uppercase">QA Investigation Required</p>
              )}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Production Output</h3>
            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Good Bottles Produced</Label>
              <Input type="number" value={bottlesProduced} onChange={e => setBottlesProduced(e.target.value)} className="h-14 text-lg font-mono" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Rejected Bottles</Label>
              <Input type="number" value={rejectQuantity} onChange={e => setRejectQuantity(e.target.value)} className="h-14 text-lg font-mono" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Raw Material Reconciliation</h3>
            {isPowder ? (
              <>
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Powder Received (kg)</Label>
                  <Input type="number" step="0.01" value={powderReceivedKg} onChange={e => setPowderReceivedKg(e.target.value)} className="h-14 text-lg font-mono" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Powder Waste (kg)</Label>
                  <Input type="number" step="0.01" value={powderWasteKg} onChange={e => setPowderWasteKg(e.target.value)} className="h-14 text-lg font-mono" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Powder Returned (kg)</Label>
                  <Input type="number" step="0.01" value={powderReturnedKg} onChange={e => setPowderReturnedKg(e.target.value)} className="h-14 text-lg font-mono" />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Tablets Received</Label>
                  <Input type="number" value={tabletsReceived} onChange={e => setTabletsReceived(e.target.value)} className="h-14 text-lg font-mono" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Tablets Returned</Label>
                  <Input type="number" value={tabletsReturned} onChange={e => setTabletsReturned(e.target.value)} className="h-14 text-lg font-mono" />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 flex justify-center pb-safe max-w-md mx-auto shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <Button
          onClick={handleSubmit}
          disabled={!isFormValid || createYieldReport.isPending || updateBatch.isPending}
          className="w-full h-16 text-lg font-bold rounded-xl bg-green-600 hover:bg-green-700 text-white"
        >
          {createYieldReport.isPending || updateBatch.isPending
            ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...</>
            : "FINISH BATCH"}
        </Button>
      </div>
    </Layout>
  );
}
