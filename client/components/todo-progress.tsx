import { ChartNoAxesColumnIncreasing } from 'lucide-react'

interface TodoProgressProps {
  total: number | null
  completed: number
}

export function TodoProgress({ total, completed }: TodoProgressProps) {
  const remaining = total === null ? null : total - completed
  const percent = total ? Math.round((completed / total) * 100) : 0

  return (
    <section
      aria-labelledby="progress-heading"
      className="min-w-0 rounded-2xl bg-linear-to-br from-violet-950 to-[#211638] p-5 text-white shadow-sm sm:p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <h2
          id="progress-heading"
          className="text-sm font-medium text-violet-100"
        >
          完成进度
        </h2>
        <span className="grid size-9 place-items-center rounded-lg bg-white/10 text-violet-200">
          <ChartNoAxesColumnIncreasing aria-hidden="true" className="size-4" />
        </span>
      </div>
      <div className="mt-4 text-4xl leading-none font-semibold tracking-tight tabular-nums">
        {total === null ? '—' : `${percent}%`}
      </div>
      <progress
        aria-labelledby="progress-heading"
        aria-hidden={total === null || undefined}
        value={percent}
        max={100}
        className="mt-4 block h-2 w-full appearance-none overflow-hidden rounded-full bg-white/15 [&::-moz-progress-bar]:rounded-full [&::-moz-progress-bar]:bg-violet-300 [&::-webkit-progress-bar]:bg-transparent [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-violet-300"
      />
      <dl className="mt-6 grid grid-cols-2 gap-x-4 border-t border-white/15 pt-4">
        <div>
          <dt className="text-xs text-violet-200">待完成</dt>
          <dd className="mt-1 text-xl font-semibold tabular-nums">
            {remaining ?? '—'}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-violet-200">已完成</dt>
          <dd className="mt-1 text-xl font-semibold tabular-nums">
            {total === null ? '—' : completed}
          </dd>
        </div>
      </dl>
    </section>
  )
}
