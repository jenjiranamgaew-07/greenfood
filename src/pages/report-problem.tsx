import { useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useActiveBatch } from "@/lib/active-batch-context";
import { useGetBatch, useCreateDeviation, getListDeviationsQueryKey } from "@/lib/mock-api";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { 
  AlertTriangle, FlaskConical, PackageX, Tag, 
  Scale, Wrench, Droplet, Bug, BoxSelect, HelpCircle 
} from "lucide-react";

type IssueType = "wrong_bottle" | "wrong_cap" | "wrong_label" | "weight_failure" | "machine_breakdown" | "spill" | "contamination" | "missing_material" | "other";
type Priority = "low" | "medium" | "high" | "critical";

const ISSUE_TYPES: { id: IssueType; label: string; icon: React.ElementType }[] = [
  { id: "wrong_bottle", label: "Wrong Bottle", icon: FlaskConical },
  { id: "wrong_cap", label: "Wrong Cap", icon: PackageX },
  { id: "wrong_label", label: "Wrong Label", icon: Tag },
  { id: "weight_failure", label: "Weight Failure", icon: Scale },
  { id: "machine_breakdown", label: "Machine Break", icon: Wrench },
  { id: "spill", label: "Spill / Leak", icon: Droplet },
  { id: "contamination", label: "Contamination", icon: Bug },
  { id: "missing_material", label: "Missing Mat.", icon: BoxSelect },
  { id: "other", label: "Other Issue", icon: HelpCircle },
];

export default function ReportProblem() {
  const [, setLocation] = useLocation();
  const { activeBatchId } = useActiveBatch();
  const queryClient = useQueryClient();
  
  const [issueType, setIssueType] = useState<IssueType | "">("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");

  const { data: batchDetail } = useGetBatch(activeBatchId!, {
    query: { enabled: !!activeBatchId }
  });

  const createDeviation = useCreateDeviation();

  const handleSubmit = async () => {
    if (!issueType || !description) {
      toast.error("Please select an issue type and provide a description");
      return;
    }

    try {
      await createDeviation.mutateAsync({
        data: {
          batchId: activeBatchId || undefined,
          issueType: issueType as IssueType,
          description,
          priority,
          reportedBy: batchDetail?.batch.operatorName || "Operator",
        }
      });

      queryClient.invalidateQueries({ queryKey: getListDeviationsQueryKey() });
      toast.success("Problem reported. QA has been notified.", {
        className: "bg-red-600 text-white border-none"
      });
      setLocation("/");
    } catch (error) {
      toast.error("Failed to report problem");
    }
  };

  return (
    <Layout title="Report Problem">
      <div className="flex flex-col gap-6 pb-32">
        <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-r shadow-sm">
          <div className="flex items-start">
            <AlertTriangle className="w-6 h-6 text-red-600 mr-3 shrink-0" />
            <div>
              <h3 className="font-bold text-red-900">Stop Production</h3>
              <p className="text-red-700 text-sm">If this issue affects product quality or safety, stop the line immediately before reporting.</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Issue Type</Label>
          <div className="grid grid-cols-3 gap-2">
            {ISSUE_TYPES.map((type) => (
              <Button
                key={type.id}
                type="button"
                variant={issueType === type.id ? "default" : "outline"}
                className={`h-24 flex flex-col items-center justify-center p-2 transition-all border-2 ${
                  issueType === type.id 
                    ? 'bg-red-600 hover:bg-red-700 text-white border-red-600 ring-2 ring-red-600/20 ring-offset-1' 
                    : 'bg-white border-slate-200 text-slate-600 hover:border-red-300 hover:text-red-600 hover:bg-red-50'
                }`}
                onClick={() => setIssueType(type.id)}
              >
                <type.icon className="w-8 h-8 mb-2" />
                <span className="text-[10px] font-bold text-center leading-tight whitespace-normal">{type.label}</span>
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Priority Level</Label>
          <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
            <SelectTrigger className={`h-14 text-base font-bold border-2 ${
              priority === 'critical' ? 'border-red-600 text-red-600 bg-red-50' :
              priority === 'high' ? 'border-orange-500 text-orange-600 bg-orange-50' :
              'border-slate-200'
            }`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low" className="font-semibold">Low - Routine issue</SelectItem>
              <SelectItem value="medium" className="font-semibold">Medium - Needs attention</SelectItem>
              <SelectItem value="high" className="font-semibold text-orange-600">High - Quality at risk</SelectItem>
              <SelectItem value="critical" className="font-semibold text-red-600">Critical - Stop line</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Description</Label>
          <Textarea 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe exactly what happened..."
            className="min-h-32 bg-white border-2 border-slate-200 text-base resize-none focus-visible:ring-red-600"
          />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 flex justify-center pb-safe max-w-md mx-auto shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <Button 
          onClick={handleSubmit}
          disabled={!issueType || !description || createDeviation.isPending}
          className="w-full h-16 text-lg font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white"
        >
          {createDeviation.isPending ? "Submitting..." : "SUBMIT REPORT"}
        </Button>
      </div>
    </Layout>
  );
}
