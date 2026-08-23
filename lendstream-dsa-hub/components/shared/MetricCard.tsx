export function MetricCard({ label, value, sublabel }: { label: string; value: string; sublabel?: string }) {
  return (
    <div className="rounded-2xl bg-[#f7f6f4] p-4">
      <div className="text-[11px] uppercase tracking-wide text-[#7c7a75]">{label}</div>
      <div className="mt-1 text-lg font-semibold text-[#1a1917]">{value}</div>
      {sublabel && <div className="mt-0.5 text-xs text-[#7c7a75]">{sublabel}</div>}
    </div>
  )
}
