import { LoaderCircle } from "lucide-react";

export default function DashboardLoading() {
  return (
    <main
      className="grid min-h-screen place-items-center bg-[#f7f8fb] text-sm text-[#68758d]"
      role="status"
      aria-live="polite"
    >
      <span className="flex items-center gap-3">
        <LoaderCircle size={18} className="animate-spin text-[#596eff]" />
        Loading your movie shelf…
      </span>
    </main>
  );
}
