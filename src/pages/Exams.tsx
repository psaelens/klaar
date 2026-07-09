import { Link } from 'react-router'
import { Trophy } from 'lucide-react'
import { examById, EXAM_PASS_RATIO, examMaxScore, exams } from '../lib/exams'
import { loadMockExams } from '../lib/storage'

/**
 * Onglet Examens : les épreuves blanches (boss battles, PRD §8) et
 * l'historique des tentatives de l'élève.
 */

export default function Exams() {
  const attempts = [...loadMockExams()].sort(
    (a, b) => new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime(),
  )

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Examens blancs</h1>
        <p className="text-sm text-ink-500 dark:text-ink-400">
          Comme le vrai CE1D, chronométré. Gros bonus d'XP à partir de 50 % !
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {exams.map((exam) => {
          const best = attempts
            .filter((r) => r.examId === exam.id)
            .reduce<number | null>((acc, r) => (acc === null || r.score > acc ? r.score : acc), null)
          const max = examMaxScore(exam)
          return (
            <div
              key={exam.id}
              className="flex flex-col gap-3 rounded-3xl border-2 border-reward-400 bg-white p-5 dark:border-reward-600 dark:bg-ink-800"
            >
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-reward-400 text-ink-900">
                  <Trophy size={20} aria-hidden />
                </span>
                <span>
                  <span className="block font-bold">{exam.title}</span>
                  <span className="block text-sm text-ink-500 tabular-nums dark:text-ink-400">
                    {best !== null
                      ? `Record : ${best}/${max}`
                      : exam.type === 'ecrit'
                        ? 'Environ 2 h — première tentative'
                        : 'Environ 15 min — première tentative'}
                  </span>
                </span>
              </div>
              <Link
                to={`/examen?id=${exam.id}`}
                className="rounded-2xl bg-reward-400 px-6 py-3.5 text-center font-bold text-ink-900 shadow-lg shadow-reward-400/30 transition hover:bg-reward-300 active:scale-95"
              >
                Commencer
              </Link>
            </div>
          )
        })}
      </div>

      {attempts.length > 0 && (
        <div>
          <h2 className="mb-2 font-bold">Mes tentatives</h2>
          <div className="flex flex-col gap-2">
            {attempts.map((attempt) => {
              const passed = attempt.score / attempt.maxScore >= EXAM_PASS_RATIO
              return (
                <div
                  key={attempt.takenAt}
                  className="flex items-center justify-between rounded-2xl border border-ink-200 bg-white p-4 text-sm dark:border-ink-700 dark:bg-ink-800"
                >
                  <span>
                    <span className="font-semibold">{examById(attempt.examId)?.title ?? attempt.examId}</span>
                    <span className="block text-xs text-ink-500 dark:text-ink-400">
                      {new Date(attempt.takenAt).toLocaleDateString('fr-BE', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 font-display font-extrabold tabular-nums ${
                      passed
                        ? 'bg-reward-100 text-reward-900 dark:bg-reward-900 dark:text-reward-200'
                        : 'bg-ink-100 text-ink-600 dark:bg-ink-700 dark:text-ink-300'
                    }`}
                  >
                    {attempt.score}/{attempt.maxScore}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
