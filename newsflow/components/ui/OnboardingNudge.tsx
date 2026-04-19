interface Props {
  signalCount: number
}

export default function OnboardingNudge({ signalCount }: Props) {
  const needed = Math.max(0, 10 - signalCount)
  if (needed === 0) return null

  return (
    <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-center gap-3">
      <span className="text-lg">✨</span>
      <div>
        <p className="text-sm font-medium text-blue-800">Personalise your feed</p>
        <p className="text-xs text-blue-600 mt-0.5">
          Rate {needed} more article{needed !== 1 ? 's' : ''} with 👍 or 👎 to unlock personalised ranking.
          {signalCount > 0 && ` You've rated ${signalCount} so far.`}
        </p>
      </div>
    </div>
  )
}
