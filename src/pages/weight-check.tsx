import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import {
  ShieldAlert,
  Scale,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";

export default function WeightCheck() {
  const [, setLocation] = useLocation();
  const [measuredWeight, setMeasuredWeight] = useState("");

  const batchDetail: any = {
    product: {
      productName: "Demo Product",
      sku: "SKU-001",
      nominalWeightG: 100,
      emptyPackagingWeightG: 10,
    },
    batch: {
      batchNumber: "TEST-BATCH",
      operatorName: "Demo User",
    },
  };

  const targetWeight =
    batchDetail.product.nominalWeightG +
    batchDetail.product.emptyPackagingWeightG;

  const measured = parseFloat(measuredWeight || "0");

  let status = "idle";

  if (measured > 0) {
    if (measured >= targetWeight) {
      status = "pass";
    } else if (measured >= targetWeight - 5) {
      status = "warn";
    } else {
      status = "fail";
    }
  }

  return (
    <Layout title="Weight Check">
      <div className="flex flex-col gap-5">

        <div className="bg-green-900 text-white p-4 rounded-xl shadow-md">
          <p className="text-xs text-green-300 font-bold uppercase tracking-wider mb-1">
            {batchDetail.batch.batchNumber}
          </p>

          <p className="font-bold text-lg">
            {batchDetail.product.productName}
          </p>

          <div className="flex gap-3 mt-1 text-xs text-green-300">
            <span>{batchDetail.product.sku}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-green-800 px-4 py-2">
            <p className="text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1">
              <Scale className="w-4 h-4" />
              Weight Limits
            </p>
          </div>

          <div className="grid grid-cols-3 divide-x divide-slate-100">
            <div className="p-3 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Target
              </p>

              <p className="text-xl font-mono font-bold text-slate-900">
                {targetWeight}g
              </p>
            </div>

            <div className="p-3 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Product
              </p>

              <p className="text-lg font-bold text-green-700">
                {batchDetail.product.nominalWeightG}g
              </p>
            </div>

            <div className="p-3 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Packaging
              </p>

              <p className="text-lg font-bold text-blue-700">
                {batchDetail.product.emptyPackagingWeightG}g
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">
            Measured Weight
          </p>

          <div className="flex gap-3 items-center">
            <Input
              type="number"
              step="0.1"
              min="0"
              value={measuredWeight}
              onChange={(e) => setMeasuredWeight(e.target.value)}
              placeholder="e.g. 109.4"
              className="h-16 text-2xl font-mono text-center"
            />

            <div className="text-2xl font-bold text-slate-400">
              g
            </div>
          </div>
        </div>

        <div className="rounded-xl border-2 p-4 flex items-center gap-4 bg-slate-50 border-slate-200">
          {status === "pass" && (
            <>
              <CheckCircle2 className="w-8 h-8 text-green-600" />
              <p className="font-bold text-green-700">
                PASS — Within tolerance
              </p>
            </>
          )}

          {status === "warn" && (
            <>
              <AlertTriangle className="w-8 h-8 text-amber-500" />
              <p className="font-bold text-amber-700">
                WARNING — Check weight
              </p>
            </>
          )}

          {status === "fail" && (
            <>
              <XCircle className="w-8 h-8 text-red-600" />
              <p className="font-bold text-red-700">
                FAIL — Below minimum
              </p>
            </>
          )}

          {status === "idle" && (
            <>
              <ShieldAlert className="w-8 h-8 text-slate-400" />
              <p className="font-bold text-slate-500">
                Enter weight below
              </p>
            </>
          )}
        </div>

        <div className="space-y-3 pb-6">
          <Button
            className="w-full h-14 text-lg font-bold rounded-xl bg-green-600 hover:bg-green-700 text-white"
          >
            RECORD RESULT
          </Button>

          <Button
            variant="outline"
            className="w-full h-14 text-lg font-bold rounded-xl"
            onClick={() => setLocation("/")}
          >
            BACK HOME
          </Button>
        </div>
      </div>
    </Layout>
  );
}
