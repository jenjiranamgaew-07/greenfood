import { Layout } from "@/components/layout";

export default function Dashboard() {
  return (
    <Layout title="Dashboard">
      <div className="p-6">
        <h1 className="text-2xl font-bold">
          Dashboard
        </h1>

        <p className="mt-4 text-slate-600">
          Dashboard temporarily disabled.
        </p>
      </div>
    </Layout>
  );
}
