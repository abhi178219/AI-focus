export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const initials = name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-[#efeeeb] font-semibold text-[#1a1917]"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials}
    </div>
  )
}
