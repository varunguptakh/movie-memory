import { Clapperboard } from "lucide-react";
import Link from "next/link";

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2.5 font-semibold tracking-tight ${
        light ? "text-white" : "text-[#17233c]"
      }`}
      aria-label="Movie Memory home"
    >
      <span className="grid size-9 place-items-center rounded-xl bg-[#596eff] text-white shadow-[0_8px_24px_rgba(89,110,255,0.28)]">
        <Clapperboard size={19} strokeWidth={2.2} />
      </span>
      <span className="text-[17px]">movie memory</span>
    </Link>
  );
}
