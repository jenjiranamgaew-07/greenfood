import { useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

import { useActiveBatch } from "@/lib/active-batch-context";
import { toast } from "sonner";
import { Play, Barcode } from "lucide-react";

export default function StartBatch() {
  const [, setLocation] = useLocation();
  const { setActiveBatchId } = useActiveBatch();

  const [batchNumber, setBatchNumber] = useState("");
  const [plannedQuantity, setPlannedQuantity] = useState("");
  const [operatorName, setOperatorName] = useState("");

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!batchNumber || !plannedQuantity || !operatorName) {
      toast.error("Please fill in all fields");
      return;
    }

    setActiveBatchId(Date.now());

    toast.success("Batch started");

    setLocation("/startup-checklist");
  };

  return (
    <Layout title="Start Batch">
      <form
        onSubmit={handleStart}
        className="flex flex-col gap-5 pb-28"
      >
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="pt-5 flex flex-col gap-4">

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Batch Number
              </Label>

              <div className="relative">
                <Input
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  placeholder="Enter batch code"
                  className="h-14 text-lg font-mono pl-12"
                />

                <Barcode className="absolute left-4 top-4 text-slate-400" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Planned Quantity
              </Label>

              <Input
                type="number"
                value={plannedQuantity}
                onChange={(e) => setPlannedQuantity(e.target.value)}
                placeholder="Number of units"
                className="h-14 text-lg font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Operator Name
              </Label>

              <Select
                value={operatorName}
                onValueChange={setOperatorName}
              >
                <SelectTrigger className="h-14 text-base font-semibold">
                  <SelectValue placeholder="Select Operator" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="Operator A">
                    Operator A
                  </SelectItem>

                  <SelectItem value="Operator B">
                    Operator B
                  </SelectItem>

                  <SelectItem value="Operator C">
                    Operator C
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

          </CardContent>
        </Card>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 flex justify-center max-w-md mx-auto">
          <Button
            type="submit"
            disabled={!batchNumber || !plannedQuantity || !operatorName}
            className="w-full h-16 text-lg font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-xl"
          >
            <Play className="w-6 h-6 mr-2 fill-current" />
            START BATCH
          </Button>
        </div>
      </form>
    </Layout>
  );
}
