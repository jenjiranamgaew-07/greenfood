import { useState, useRef } from "react";
import { Layout } from "@/components/layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useListUsers, useListProducts, useCreateUser,
  useCreateProduct, getListUsersQueryKey, getListProductsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { User as UserIcon, Package, Settings as SettingsIcon, Plus, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, Download } from "lucide-react";

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-purple-100 text-purple-800",
  supervisor: "bg-blue-100 text-blue-800",
  qa: "bg-amber-100 text-amber-800",
  operator: "bg-slate-100 text-slate-700",
};

const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  supervisor: "Supervisor",
  qa: "QA",
  operator: "Operator",
};

interface ImportResult {
  imported: number;
  updated: number;
  skipped: number;
  errors: string[];
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState("users");
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: users, isLoading: usersLoading } = useListUsers();
  const { data: products, isLoading: productsLoading } = useListProducts();

  const createUser = useCreateUser();
  const createProduct = useCreateProduct();

  // ── User form ──────────────────────────────────────────────
  const [isUserOpen, setIsUserOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState<"operator" | "supervisor" | "qa" | "admin">("operator");
  const [userTitle, setUserTitle] = useState("");

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName || !userRole) return;
    try {
      await createUser.mutateAsync({
        data: { name: userName, role: userRole, title: userTitle || null, active: true }
      });
      queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
      toast.success("User added successfully");
      setIsUserOpen(false);
      setUserName("");
      setUserTitle("");
    } catch {
      toast.error("Failed to add user");
    }
  };

  // ── Product form ───────────────────────────────────────────
  const [isProductOpen, setIsProductOpen] = useState(false);
  const [productName, setProductName] = useState("");
  const [sku, setSku] = useState("");
  const [productType, setProductType] = useState<"K" | "T" | "P" | "S">("K");
  const [fillingType, setFillingType] = useState<"machine" | "manual">("machine");
  const [bottleSize, setBottleSize] = useState<any>("150ml");
  const [capType, setCapType] = useState<any>("small");
  const [tabletsPerBottle, setTabletsPerBottle] = useState("");
  const [nominalWeightG, setNominalWeightG] = useState("");
  const [emptyPackagingWeightG, setEmptyPackagingWeightG] = useState("");

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName || !sku) return;
    const isPowder = productType === "P";
    try {
      await createProduct.mutateAsync({
        data: {
          productName, sku, productType, fillingType, bottleSize, capType,
          tabletsPerBottle: !isPowder && tabletsPerBottle ? parseInt(tabletsPerBottle) : null,
          powderWeightTarget: isPowder && nominalWeightG ? parseFloat(nominalWeightG) : null,
          nominalWeightG: nominalWeightG ? parseFloat(nominalWeightG) : null,
          emptyPackagingWeightG: emptyPackagingWeightG ? parseFloat(emptyPackagingWeightG) : null,
          status: "active",
        }
      });
      queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
      toast.success("Product added");
      setIsProductOpen(false);
      setProductName(""); setSku(""); setTabletsPerBottle("");
      setNominalWeightG(""); setEmptyPackagingWeightG("");
    } catch {
      toast.error("Failed to add product");
    }
  };

  // ── Excel import ───────────────────────────────────────────
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    setImporting(true);
    setImportResult(null);

    try {
      const res = await fetch("/api/products/import-excel", { method: "POST", body: formData });
      if (!res.ok) throw new Error(await res.text());
      const result: ImportResult = await res.json();
      setImportResult(result);
      queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
      if (result.imported > 0 || result.updated > 0) {
        toast.success(`Import done: ${result.imported} added, ${result.updated} updated`);
      } else {
        toast.warning("No products were imported");
      }
    } catch {
      toast.error("Excel import failed — check file format");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const downloadTemplate = () => {
    const header = "Product Name\tSKU\tTablets Per Bottle\tNominal Weight (g)\tEmpty Packaging (g)\tFilling Type\tBottle Size\tCap Type\tLabel Code";
    const example1 = "Ginkgo 400mg\t1104-K120\t120\t62\t23\tmachine\t150ml\tsmall\t";
    const example2 = "Spirulina Finest 300mg\t1127-T240\t240\t72\t60\tmachine\t250ml\tlarge\t";
    const example3 = "Protein Powder Vanilla\tPPV-500-360\t\t350\t\tmanual\t360ml\tcap360\tLBL-PPV-360";
    const notes = [
      "--- NOTES ---",
      "Only 'Product Name' and 'SKU' are required — all other columns are optional",
      "Filling Type: machine (default) or manual",
      "Bottle Size: 50ml / 100ml / 150ml (default) / 200ml / 250ml / 360ml / 500ml / 570ml",
      "Cap Type: small (default) / medium / large / cap360 / cap570",
      "Nominal Weight (g): the e-mark weight of the contents (Qn) — used for EU 76/211/EEC tolerance",
      "Empty Packaging (g): weight of empty bottle + cap + desiccant",
    ].join("\n");
    const content = `${header}\n${example1}\n${example2}\n${example3}\n\n${notes}`;
    const blob = new Blob([content], { type: "text/tab-separated-values" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "haccp-products-template.tsv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Template downloaded — open in Excel and save as .xlsx");
  };

  return (
    <Layout title="Settings">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full h-14 bg-slate-100 p-1 rounded-xl mb-6">
          <TabsTrigger value="users" className="flex-1 h-full text-base font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg">Users</TabsTrigger>
          <TabsTrigger value="products" className="flex-1 h-full text-base font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg">Products</TabsTrigger>
          <TabsTrigger value="system" className="flex-1 h-full text-base font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg">System</TabsTrigger>
        </TabsList>

        {/* ── USERS TAB ── */}
        <TabsContent value="users" className="space-y-4 mt-0">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800">Team Members</h2>
            <Dialog open={isUserOpen} onOpenChange={setIsUserOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
                  <Plus className="w-4 h-4 mr-1" /> ADD
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm rounded-xl">
                <DialogHeader><DialogTitle>Add Team Member</DialogTitle></DialogHeader>
                <form onSubmit={handleAddUser} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input value={userName} onChange={e => setUserName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Position / Title</Label>
                    <Input
                      value={userTitle}
                      onChange={e => setUserTitle(e.target.value)}
                      placeholder="e.g. Co-Owner, Production Lead..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>System Role</Label>
                    <Select value={userRole} onValueChange={(v: any) => setUserRole(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="operator">Operator</SelectItem>
                        <SelectItem value="supervisor">Supervisor</SelectItem>
                        <SelectItem value="qa">QA</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full h-12 font-bold" disabled={createUser.isPending}>
                    {createUser.isPending ? "Saving..." : "SAVE USER"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {usersLoading ? (
            <div className="space-y-3">{[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-slate-200 animate-pulse rounded-xl" />)}</div>
          ) : (
            <div className="space-y-3">
              {users?.map(user => (
                <Card key={user.id} className="border-slate-200 shadow-sm overflow-hidden">
                  <div className="h-1 w-full bg-slate-200" />
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-900 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-base">{user.name}</p>
                        {user.title ? (
                          <p className="text-sm text-blue-700 font-semibold">{user.title}</p>
                        ) : (
                          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">{ROLE_LABEL[user.role]}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge className={`text-[10px] font-bold uppercase tracking-wider border-0 ${ROLE_COLORS[user.role]}`}>
                        {ROLE_LABEL[user.role]}
                      </Badge>
                      <Badge variant={user.active ? "default" : "secondary"} className={`text-[10px] border-0 ${user.active ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}`}>
                        {user.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── PRODUCTS TAB ── */}
        <TabsContent value="products" className="space-y-4 mt-0">
          {/* Import Excel card */}
          <Card className="border-2 border-dashed border-blue-200 bg-blue-50 shadow-none">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-blue-600 text-white p-2 rounded-lg">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Import from Excel</p>
                  <p className="text-xs text-slate-500">Upload .xlsx or .xls to bulk-import products</p>
                </div>
              </div>

              {importResult && (
                <div className={`rounded-lg p-3 mb-3 text-sm ${importResult.errors.length > 0 ? "bg-amber-50 border border-amber-200" : "bg-green-50 border border-green-200"}`}>
                  <div className="flex items-center gap-2 font-bold mb-1">
                    {importResult.errors.length === 0
                      ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                      : <AlertCircle className="w-4 h-4 text-amber-600" />}
                    <span>Import complete</span>
                  </div>
                  <p className="text-slate-700">
                    {importResult.imported} added &bull; {importResult.updated} updated &bull; {importResult.skipped} skipped
                  </p>
                  {importResult.errors.slice(0, 3).map((e, i) => (
                    <p key={i} className="text-xs text-red-600 mt-1">{e}</p>
                  ))}
                  {importResult.errors.length > 3 && (
                    <p className="text-xs text-red-600 mt-1">...and {importResult.errors.length - 3} more errors</p>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv,.tsv"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Button
                  className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={importing}
                >
                  {importing
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Importing...</>
                    : <><Upload className="w-4 h-4 mr-2" /> Upload Excel</>}
                </Button>
                <Button
                  variant="outline"
                  className="h-12 px-3 border-blue-300 text-blue-700 font-bold"
                  onClick={downloadTemplate}
                  title="Download Excel template"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-slate-500 mt-2 text-center">
                Required columns: Product Name, SKU, Filling Type, Bottle Size, Cap Type
              </p>
            </CardContent>
          </Card>

          {/* Add manually */}
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-slate-700">Product Database ({products?.length ?? 0})</h2>
            <Dialog open={isProductOpen} onOpenChange={setIsProductOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-slate-800 hover:bg-slate-900 text-white font-bold">
                  <Plus className="w-4 h-4 mr-1" /> MANUAL
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm rounded-xl max-h-[90dvh] overflow-y-auto">
                <DialogHeader><DialogTitle>Add Product Manually</DialogTitle></DialogHeader>
                <form onSubmit={handleAddProduct} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Product Name</Label>
                    <Input value={productName} onChange={e => setProductName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>SKU</Label>
                    <Input value={sku} onChange={e => setSku(e.target.value)} required className="font-mono" />
                  </div>
                  <div className="space-y-2">
                    <Label>Product Type</Label>
                    <Select value={productType} onValueChange={(v: any) => {
                      setProductType(v);
                      setFillingType(v === "P" ? "manual" : "machine");
                    }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="K">K — Capsule</SelectItem>
                        <SelectItem value="T">T — Tablet</SelectItem>
                        <SelectItem value="P">P — Powder</SelectItem>
                        <SelectItem value="S">S — Softcap</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Filling Type</Label>
                    <Select value={fillingType} onValueChange={(v: any) => setFillingType(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="machine">Machine</SelectItem>
                        <SelectItem value="manual">Manual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Bottle Size</Label>
                    <Select value={bottleSize} onValueChange={(v: any) => setBottleSize(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["50ml", "75ml", "100ml", "150ml", "200ml", "250ml", "360ml", "500ml", "570ml"].map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Cap Type</Label>
                    <Select value={capType} onValueChange={(v: any) => setCapType(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Small (50/100/150ml)</SelectItem>
                        <SelectItem value="medium">Medium (200ml)</SelectItem>
                        <SelectItem value="large">Large (500ml)</SelectItem>
                        <SelectItem value="cap360">Cap 360ml</SelectItem>
                        <SelectItem value="cap570">Cap 570ml</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {fillingType === "machine" && (
                    <div className="space-y-2">
                      <Label>Tablets / Capsules Per Bottle</Label>
                      <Input type="number" value={tabletsPerBottle} onChange={e => setTabletsPerBottle(e.target.value)} className="font-mono" />
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Nominal Weight — Qn (g)</Label>
                      <Input type="number" value={nominalWeightG} onChange={e => setNominalWeightG(e.target.value)} className="font-mono" placeholder="e.g. 72" />
                    </div>
                    <div className="space-y-2">
                      <Label>Empty Packaging (g)</Label>
                      <Input type="number" value={emptyPackagingWeightG} onChange={e => setEmptyPackagingWeightG(e.target.value)} className="font-mono" placeholder="e.g. 23" />
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 -mt-1">Used for EU 76/211/EEC weight tolerance calculations</p>
                  <Button type="submit" className="w-full h-12 font-bold" disabled={createProduct.isPending}>
                    {createProduct.isPending ? "Saving..." : "SAVE PRODUCT"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {productsLoading ? (
            <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-200 animate-pulse rounded-xl" />)}</div>
          ) : (
            <div className="space-y-3">
              {products?.map(product => {
                const ptColors: Record<string, string> = { K: "bg-purple-100 text-purple-800", T: "bg-blue-100 text-blue-800", P: "bg-orange-100 text-orange-800", S: "bg-teal-100 text-teal-800" };
                const ptLabels: Record<string, string> = { K: "Capsule", T: "Tablet", P: "Powder", S: "Softcap" };
                const ptBars: Record<string, string> = { K: "bg-purple-500", T: "bg-blue-500", P: "bg-orange-400", S: "bg-teal-500" };
                const pt = product.productType ?? "K";
                return (
                  <Card key={product.id} className="border-slate-200 shadow-sm overflow-hidden">
                    <div className={`h-1 w-full ${ptBars[pt] ?? "bg-slate-400"}`} />
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 min-w-0 mr-2">
                          <p className="font-mono text-xs font-bold text-blue-600 mb-1">{product.sku}</p>
                          <p className="font-bold text-slate-900 text-sm leading-snug">{product.productName}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <Badge className={`border-0 text-[10px] font-bold uppercase tracking-wider ${ptColors[pt]}`}>
                            {pt} · {ptLabels[pt]}
                          </Badge>
                          <Badge variant={product.status === "active" ? "default" : "secondary"} className={`border-0 text-[10px] uppercase tracking-wider ${product.status === "active" ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}`}>
                            {product.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-slate-500 uppercase tracking-wider mt-3 pt-3 border-t border-slate-100">
                        <span className="flex items-center gap-1"><Package className="w-3 h-3" /> {product.bottleSize}</span>
                        <span>&bull;</span>
                        <span>{product.fillingType === "machine" ? "Machine" : "Manual"}</span>
                        {product.amountUnits && <span>&bull; {product.amountUnits} units</span>}
                        {product.nominalWeightG != null && <span>&bull; Qn {product.nominalWeightG}g</span>}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── SYSTEM TAB ── */}
        <TabsContent value="system" className="space-y-4 mt-0">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50 border-b border-slate-100 py-4">
              <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center">
                <SettingsIcon className="w-4 h-4 mr-2" /> Application Info
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4 text-sm">
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-semibold">Version</span>
                <span className="font-mono font-bold text-slate-900">v1.1.0</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-semibold">Compliance</span>
                <span className="font-bold text-slate-900">HACCP / GMP</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-semibold">API Status</span>
                <span className="font-bold text-green-600">Online</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-semibold">Excel Import</span>
                <span className="font-bold text-green-600">Enabled</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">PDF Reports</span>
                <span className="font-bold text-green-600">Enabled</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50 border-b border-slate-100 py-4">
              <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-wider">Excel Import Format</CardTitle>
            </CardHeader>
            <CardContent className="p-4 text-xs space-y-2">
              <p className="font-bold text-slate-700">Required columns (any order):</p>
              <div className="grid grid-cols-2 gap-1">
                {["Product Name", "SKU", "Filling Type", "Bottle Size", "Cap Type"].map(col => (
                  <div key={col} className="bg-green-50 text-green-800 rounded px-2 py-1 font-mono font-bold">{col}</div>
                ))}
              </div>
              <p className="font-bold text-slate-700 mt-3">Optional columns:</p>
              <div className="grid grid-cols-2 gap-1">
                {["Tablets Per Bottle", "Powder Weight (kg)", "Label Code"].map(col => (
                  <div key={col} className="bg-slate-50 text-slate-600 rounded px-2 py-1 font-mono">{col}</div>
                ))}
              </div>
              <div className="mt-3 bg-slate-50 rounded-lg p-3">
                <p className="font-bold mb-1">Valid values:</p>
                <p><span className="font-semibold">Filling Type:</span> machine, manual</p>
                <p><span className="font-semibold">Bottle Size:</span> 50ml, 100ml, 150ml, 200ml, 360ml, 500ml, 570ml</p>
                <p><span className="font-semibold">Cap Type:</span> small, medium, large, cap360, cap570</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </Layout>
  );
}
