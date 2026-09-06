import type { UpcomingExam } from "@/lib/analytics-api";

export function UpcomingExamsCard({ exams }: { exams: UpcomingExam[] }) {
  return (
    <div className="glass-panel rounded-2xl p-5">
      <p className="font-display text-sm font-semibold text-ink">Upcoming exams</p>
      {exams.length === 0 ? (
        <p className="mt-4 text-sm text-ink-soft">Nothing on the horizon.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {exams.map((exam) => (
            <li key={exam.id} className="flex items-center justify-between gap-3">
              <span className="text-sm text-ink">{exam.title}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${exam.days_until <= 3 ? "bg-brick-light text-brick" : exam.days_until <= 7 ? "bg-brass-light text-navy" : "bg-forest-light text-forest"}`}>
                {exam.days_until === 0 ? "Today" : `${exam.days_until}d`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
