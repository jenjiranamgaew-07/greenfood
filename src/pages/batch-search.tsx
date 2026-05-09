import { useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, ShieldAlert } from "lucide-react";

type Batch = {
  id: number;
  batchNumber: string;
  product: string;
  status: string;
};

const MOCK_BATCHES: Batch[] = [
  {
    id: 1,
    batchNumber: "GF-2026-001",
    product: "Vitamin C",
    status: "Running",
  },
  {
    id: 2,
    batchNumber: "GF-2026-002",
    product: "Omega 3",
    status: "Completed",
  },
];

export default function BatchSearch() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");

  const filtered = MOCK_BATCHES.filter((b) =>
    b.batchNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout title="Batch Search">
      <div className="flex flex-col gap-4">

        <div className="relative">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search batch number..."
            className="h-14 pl-12 text-lg"
          />

          <Search className="absolute left-4 top-4 text-slate-400" />
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ShieldAlert className="w-16 h-16 text-slate-300 mb-4" />

            <p className="text-slate-500 font-medium">
              No batches found
            </p>
          </div>
        ) : (
          filtered.map((batch) => (
            <Card
              key={batch.id}
              className="border-slate-200 shadow-sm"
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-bold text-lg">
                    {batch.batchNumber}
                  </p>

                  <p className="text-slate-500 text-sm">
                    {batch.product}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-slate-400 uppercase">
                    Status
                  </p>

                  <p className="font-semibold">
                    {batch.status}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))
        )}

        <Button
          variant="outline"
          className="mt-4"
          onClick={() => setLocation("/")}
        >
          Back Home
        </Button>
      </div>
    </Layout>
  );
}
