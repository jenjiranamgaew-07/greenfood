import { useState } from "react";
import { Layout } from "@/components/layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useListBatches } from "@workspace/api-client-react";
import { Search, Calendar, User, Package, FileDown, Loader2, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useActiveBatch } from "@/lib/active-batch-context";

export default function BatchSearch() {
  const [search, setSearch] = useState("");
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const { activeBatchId, setActiveBatchId } = useActiveBatch();

  const { data: batches, isLoading } = useListBatches({ search });

  const handleDownloadPdf = async (batch: { id: number; batchNumber: string }) => {
    setDownloadingId(batch.id);
    try {
      const res = await fetch(`/api/batches/${batch.id}/pdf`);
      if (!res.ok) throw new Error("PDF failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `batch-${batch.batchNumber}-report.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`PDF downloaded for ${batch.batchNumber}`);
    } catch {
      toast.error("Failed to download PDF");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <Layout title="Batch Search">
      <div className="flex flex-col gap-4">
        <div className="relative">
          <Input
            type="search"
            placeholder="Search batch number, product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-14 pl-12 text-base font-medium shadow-sm border-slate-200 bg-white"
          />
          <Search className="absolute left-4 top-4 text-slate-400 w-6 h-6" />
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-36 bg-slate-200 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {batches?.map((batch) => (
              <Card key={batch.id} className="overflow-hidden border-slate-200 shadow-sm">
                <div className={`h-1 w-full ${
                  batch.status === "active" ? "bg-amber-500" :
                  batch.status === "completed" ? "bg-green-500" : "bg-slate-400"
                }`} />
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-mono font-bold text-lg text-slate-900">{batch.batchNumber}</h3>
                      <div className="flex items-center text-sm text-slate-500 mt-1">
                        <Package className="w-4 h-4 mr-1 shrink-0" />
                        <span className="truncate max-w-[180px]">{batch.productName}</span>
                      </div>
                    </div>
                    <Badge variant={
                      batch.status === "active" ? "default" :
                      batch.status === "completed" ? "secondary" : "outline"
                    } className={`uppercase text-[10px] font-bold tracking-wider border-0 ${
                      batch.status === "completed" ? "bg-green-100 text-green-800 hover:bg-green-100" :
                      batch.status === "active" ? "bg-blue-100 text-blue-800 hover:bg-blue-100" : ""
                    }`}>
                      {batch.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center text-sm text-slate-600">
                      <User className="w-4 h-4 mr-2 text-slate-400 shrink-0" />
                      <span className="truncate">{batch.operatorName}</span>
                    </div>
                    <div className="flex items-center text-sm text-slate-600">
                      <Calendar className="w-4 h-4 mr-2 text-slate-400 shrink-0" />
                      <span>{format(new Date(batch.startTime), "MMM d, HH:mm")}</span>
                    </div>
                  </div>

                  {batch.status === "active" && (
                    activeBatchId === batch.id ? (
                      <div className="w-full mt-3 h-10 flex items-center justify-center gap-2 rounded-md bg-green-50 border border-green-200 text-green-700 text-sm font-bold">
                        <CheckCircle2 className="w-4 h-4" /> Active on this device
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        className="w-full mt-3 h-10 bg-amber-500 hover:bg-amber-600 text-white font-bold"
                        onClick={() => {
                          setActiveBatchId(batch.id);
                          toast.success(`Batch ${batch.batchNumber} set as active on this device`);
                        }}
                      >
                        Set as Active Batch on This Device
                      </Button>
                    )
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2 h-10 border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
                    onClick={() => handleDownloadPdf(batch)}
                    disabled={downloadingId === batch.id}
                  >
                    {downloadingId === batch.id
                      ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                      : <><FileDown className="w-4 h-4 mr-2" /> Download Audit Report (PDF)</>}
                  </Button>
                </CardContent>
              </Card>
            ))}

            {batches?.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <Search className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p className="font-medium">No batches found</p>
                <p className="text-sm">Try adjusting your search</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
