interface ProgressBarProps {
  done: number
  total: number
}

export default function ProgressBar({ done, total }: ProgressBarProps) {
  const percent = total === 0 ? 0 : Math.round((done / total) * 100)
  return (
    <div
      role="progressbar"
      aria-valuenow={done}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-label="Progression de la session"
      className="h-3 w-full overflow-hidden rounded-full bg-ink-200 dark:bg-ink-700"
    >
      <div
        className="h-full rounded-full bg-action-600 transition-all duration-300 dark:bg-action-500"
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}
