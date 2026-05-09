import { useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useListProducts, useCreateBatch, useListUsers, getListBatchesQueryKey } from "@workspace/api-client-react";
import { useActiveBatch } from "@/lib/active-batch-context";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Play, Loader2, Barcode } from "lucide-react";

const PRODUCT_TYPE_LABELS: Record<string, string> = {
  K: "Capsule",
  T: "Tablet",
  P: "Powder",
  S: "Softcap",
};

const PRODUCT_TYPE_COLORS: Record<string, string> = {
  K: "bg-purple-100 text-purple-800",
  T: "bg-blue-100 text-blue-800",
  P: "bg-orange-100 text-orange-800",
  S: "bg-teal-100 text-teal-800",
};

export default function StartBatch() {
  const [, setLocation] = useLocation();
  const { setActiveBatchId } = useActiveBatch();
  const queryClient = useQueryClient();

  const [batchNumber, setBatchNumber] = useState("");
  const [productId, setProductId] = useState<string>("");
  const [plannedQuantity, setPlannedQuantity] = useState("");
  const [operatorName, setOperatorName] = useState("");

  const { data: products, isLoading: isLoadingProducts } = useListProducts({ status: "active" });
  const { data: users, isLoading: isLoadingUsers } = useListUsers({ active: true });
  const createBatch = useCreateBatch();

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchNumber || !productId || !plannedQuantity || !operatorName) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const result = await createBatch.mutateAsync({
        data: {
          batchNumber,
          productId: parseInt(productId, 10),
          plannedQuantity: parseInt(plannedQuantity, 10),
          operatorName,
        }
      });

      setActiveBatchId(result.id);
      queryClient.invalidateQueries({ queryKey: getListBatchesQueryKey() });
      toast.success("Batch started");
      setLocation("/startup-checklist");
    } catch {
      toast.error("Failed to start batch");
    }
  };

  const selectedProduct = products?.find(p => p.id.toString() === productId);
  const pt = selectedProduct?.productType ?? "K";
  const isPowder = pt === "P";

  return (
    <Layout title="Start Batch">
      <form onSubmit={handleStart} className="flex flex-col gap-5 pb-28">

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="pt-5 flex flex-col gap-4">

            {/* Batch Number */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Batch Number / Work Order</Label>
              <div className="relative">
                <Input
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  placeholder="Scan or enter batch code"
                  className="h-14 text-lg font-mono pl-12"
                />
                <Barcode className="absolute left-4 top-4 text-slate-400" />
              </div>
            </div>

            {/* Product */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Product</Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger className="h-14 text-base font-semibold">
                  <SelectValue placeholder={isLoadingProducts ? "Loading..." : "Select Product"} />
                </SelectTrigger>
                <SelectContent>
                  {products?.map((p) => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      <span className="font-mono text-sm">{p.sku}</span>
                      <span className="text-slate-500 mx-2">·</span>
                      {p.productName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Auto-loaded product info */}
            {selectedProduct && (
              <div className="bg-blue-50 rounded-xl border border-blue-100 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Auto-loaded from master data</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${PRODUCT_TYPE_COLORS[pt]}`}>
                    {pt} — {PRODUCT_TYPE_LABELS[pt]}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-slate-400 text-[10px] font-bold uppercase block">Filling</span>
                    <span className="font-semibold capitalize">{selectedProduct.fillingType}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] font-bold uppercase block">Bottle</span>
                    <span className="font-semibold">{selectedProduct.bottleSize}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] font-bold uppercase block">Cap</span>
                    <span className="font-semibold capitalize">{selectedProduct.capType}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] font-bold uppercase block">
                      {isPowder ? "Powder Target" : "Units / Bottle"}
                    </span>
                    <span className="font-semibold">
                      {isPowder
                        ? `${selectedProduct.nominalWeightG ?? selectedProduct.powderWeightTarget ?? "—"}g`
                        : selectedProduct.tabletsPerBottle ?? "—"}
                    </span>
                  </div>
                  {selectedProduct.nominalWeightG != null && (
                    <div>
                      <span className="text-slate-400 text-[10px] font-bold uppercase block">E-mark (Qn)</span>
                      <span className="font-semibold">{selectedProduct.nominalWeightG}g</span>
                    </div>
                  )}
                  {selectedProduct.emptyPackagingWeightG != null && (
                    <div>
                      <span className="text-slate-400 text-[10px] font-bold uppercase block">Empty Pkg</span>
                      <span className="font-semibold">{selectedProduct.emptyPackagingWeightG}g</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Planned Quantity */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Planned Quantity</Label>
              <Input
                type="number"
                value={plannedQuantity}
                onChange={(e) => setPlannedQuantity(e.target.value)}
                placeholder="Number of bottles / units"
                className="h-14 text-lg font-mono"
              />
            </div>

            {/* Operator */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Operator Name</Label>
              <Select value={operatorName} onValueChange={setOperatorName}>
                <SelectTrigger className="h-14 text-base font-semibold">
                  <SelectValue placeholder={isLoadingUsers ? "Loading..." : "Select Operator"} />
                </SelectTrigger>
                <SelectContent>
                  {users?.map((u) => (
                    <SelectItem key={u.id} value={u.name}>
                      <span className="font-semibold">{u.name}</span>
                      {u.title && <span className="text-slate-400 text-xs ml-2">— {u.title}</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

          </CardContent>
        </Card>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 flex justify-center pb-safe max-w-md mx-auto shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
          <Button
            type="submit"
            disabled={createBatch.isPending || !batchNumber || !productId || !plannedQuantity || !operatorName}
            className="w-full h-16 text-lg font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-xl"
          >
            {createBatch.isPending ? (
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
            ) : (
              <Play className="w-6 h-6 mr-2 fill-current" />
            )}
            START BATCH
          </Button>
        </div>
      </form>
    </Layout>
  );
}
