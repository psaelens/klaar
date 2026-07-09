import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import type { ExamSection, ExamTask } from '../lib/exams'
import {
  comprehensionScore,
  examById,
  examMaxScore,
  EXAM_PASS_RATIO,
  examXp,
  productionScore,
} from '../lib/exams'
import { recordMockExam, uploadRecording } from '../lib/repo'
import { countWords } from '../lib/writing'
import { formatSeconds, SPEAKING_MIN_SECONDS } from '../lib/speaking'
import { speakDutch, ttsAvailable } from '../lib/tts'
import { useRecorder } from '../hooks/useRecorder'

/**
 * Examen blanc chronométré (PRD §11 M6), au format officiel CE1D
 * (docs/CE1D-FORMAT.md). Déroulé : intro → pour chaque section, répondre à
 * toutes les tâches sous chrono, puis auto-correction de la section (hors
 * chrono, comme une vraie correction) → bilan final avec cotation /70 ou /30,
 * XP boss battle (PRD §8) et enregistrement `mock_exams`.
 */

type Phase = 'intro' | 'answer' | 'review' | 'done'

/** CA : nombre d'écoutes autorisées (comme les 2-3 diffusions officielles). */
const MAX_LISTENS = 3

interface TaskRef {
  section: ExamSection
  task: ExamTask
}

export default function Exam() {
  const [searchParams] = useSearchParams()
  const exam = examById(searchParams.get('id') ?? '')

  const [phase, setPhase] = useState<Phase>('intro')
  const [sectionIndex, setSectionIndex] = useState(0)
  const [taskIndex, setTaskIndex] = useState(0)
  const [startedAt] = useState(() => new Date())
  // Réponses de l'élève : notes FR (CA/CL) ou texte NL (EE), par tâche.
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [listens, setListens] = useState<Record<string, number>>({})
  // Correction : indexes cochés du corrigé (CA/CL) ou de la grille (EE/EO).
  const [found, setFound] = useState<Record<string, number[]>>({})
  // Fin de section « répondre » : échéance du chrono (ms epoch).
  const [deadline, setDeadline] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [result, setResult] = useState<{ score: number; max: number; xp: number } | null>(null)
  const recorder = useRecorder()

  const section = exam?.sections[sectionIndex]
  const task = section?.tasks[taskIndex]
  const isProduction = task?.checklist !== undefined
  const canSpeak = ttsAvailable()

  // Chrono de la section en cours de réponse.
  useEffect(() => {
    if (phase !== 'answer' || deadline === null) return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [phase, deadline])

  const remaining = deadline !== null ? Math.max(0, Math.round((deadline - now) / 1000)) : 0
  const timeUp = phase === 'answer' && deadline !== null && remaining === 0

  useEffect(() => {
    if (timeUp) startReview()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeUp])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const scores = useMemo(() => computeScores(), [found, answers])

  if (exam === undefined || section === undefined || task === undefined) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <p>Examen introuvable.</p>
        <Link to="/" className="font-semibold text-action-700 underline dark:text-action-400">
          Retour à l'accueil
        </Link>
      </div>
    )
  }

  function allTasks(): TaskRef[] {
    return (exam?.sections ?? []).flatMap((s) => s.tasks.map((t) => ({ section: s, task: t })))
  }

  function computeScores(): Record<string, number> {
    const perTask: Record<string, number> = {}
    for (const { task: t } of allTasks()) {
      const checked = found[t.id] ?? []
      perTask[t.id] =
        t.checklist !== undefined
          ? productionScore(
              checked,
              t,
              t.minWords !== undefined ? countWords(answers[t.id] ?? '') : undefined,
            )
          : comprehensionScore(checked.length, t)
    }
    return perTask
  }

  function startAnswer(nextSection: number) {
    const target = exam?.sections[nextSection]
    if (target === undefined) return finishExam()
    setSectionIndex(nextSection)
    setTaskIndex(0)
    setPhase('answer')
    setDeadline(Date.now() + target.minutes * 60 * 1000)
    setNow(Date.now())
  }

  function startReview() {
    setDeadline(null)
    setTaskIndex(0)
    setPhase('review')
  }

  /** Fin de la réponse à une tâche (bouton ou passage). */
  function nextAnswerTask() {
    if (section === undefined || task === undefined) return
    if (task.checklist !== undefined && recorder.blob !== null) {
      // Prise d'oral : part au bucket recordings comme une session classique.
      uploadRecording(recorder.blob, task.id)
      recorder.reset()
    }
    if (taskIndex + 1 < section.tasks.length) setTaskIndex(taskIndex + 1)
    else startReview()
  }

  function nextReviewTask() {
    if (section === undefined) return
    if (taskIndex + 1 < section.tasks.length) {
      setTaskIndex(taskIndex + 1)
    } else if (sectionIndex + 1 < (exam?.sections.length ?? 0)) {
      startAnswer(sectionIndex + 1)
    } else {
      finishExam()
    }
  }

  function finishExam() {
    if (exam === undefined || result !== null) return
    const perTask = computeScores()
    const details: Record<string, number> = {}
    for (const s of exam.sections) {
      details[s.kind] = s.tasks.reduce((sum, t) => sum + (perTask[t.id] ?? 0), 0)
    }
    const score = Object.values(details).reduce((a, b) => a + b, 0)
    const max = examMaxScore(exam)
    const xp = examXp(score, max)
    const endedAt = new Date()
    const durationSeconds = Math.round((endedAt.getTime() - startedAt.getTime()) / 1000)
    recordMockExam(
      {
        examId: exam.id,
        examType: exam.type,
        score,
        maxScore: max,
        takenAt: endedAt.toISOString(),
        durationSeconds,
        details,
      },
      {
        finishedAt: endedAt.toISOString(),
        module: 'exam',
        // 0 carte : l'examen compte pour les minutes (streak) sans fausser
        // les taux de réussite du 1er coup (seen += 0).
        cardsReviewed: 0,
        correctFirstTry: 0,
        lapsed: 0,
        durationSeconds,
        xpEarned: xp,
      },
      { amount: xp, reason: `${exam.title} terminé`, createdAt: endedAt.toISOString() },
    )
    setResult({ score, max, xp })
    setPhase('done')
  }

  function toggleFound(taskId: string, index: number) {
    setFound((prev) => {
      const current = prev[taskId] ?? []
      return {
        ...prev,
        [taskId]: current.includes(index) ? current.filter((i) => i !== index) : [...current, index],
      }
    })
  }

  function listen(t: ExamTask) {
    const count = listens[t.id] ?? 0
    if (count >= MAX_LISTENS || t.source === undefined) return
    setListens((prev) => ({ ...prev, [t.id]: count + 1 }))
    speakDutch(t.source)
  }

  // --- Écran d'intro : structure de l'épreuve, comme la page de garde officielle.
  if (phase === 'intro') {
    return (
      <div className="flex flex-1 flex-col justify-center gap-6">
        <h1 className="font-display text-center text-2xl font-extrabold">🏆 {exam.title}</h1>
        <p className="text-center text-ink-600 dark:text-ink-400">
          Conditions d'examen : chaque partie est chronométrée, tu corriges toi-même à la fin de chaque
          partie. Bonus d'XP si tu atteins 50 % !
        </p>
        <div className="flex flex-col gap-3">
          {exam.sections.map((s) => (
            <div
              key={s.kind}
              className="flex items-center justify-between rounded-2xl border border-ink-200 bg-white p-4 dark:border-ink-700 dark:bg-ink-800"
            >
              <span className="font-semibold">{s.label}</span>
              <span className="text-sm text-ink-500 dark:text-ink-400">
                {s.tasks.reduce((sum, t) => sum + t.points, 0)} pts · {s.minutes} min
              </span>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => startAnswer(0)}
          className="rounded-2xl bg-action-600 py-5 text-lg font-bold text-white shadow-lg shadow-action-600/25 transition hover:bg-action-700 active:scale-95"
        >
          Commencer l'épreuve
        </button>
        <Link to="/" className="text-center text-sm text-ink-400 underline">
          Retour à l'accueil
        </Link>
      </div>
    )
  }

  // --- Bilan final.
  if (phase === 'done' && result !== null) {
    const passed = result.score / result.max >= EXAM_PASS_RATIO
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        <h1 className="font-display text-2xl font-extrabold text-action-700 dark:text-action-400">
          {passed ? 'Examen réussi ! 🏆' : 'Examen terminé 💪'}
        </h1>
        <p className="font-display text-5xl font-extrabold tabular-nums">
          {result.score}
          <span className="text-2xl text-ink-400"> / {result.max}</span>
        </p>
        <p className="text-ink-600 dark:text-ink-400">
          {passed
            ? 'Tu as atteint le seuil de réussite du CE1D (50 %). Bravo !'
            : 'Le seuil de réussite est à 50 % — analyse tes points faibles et retente bientôt.'}
        </p>
        <div className="flex flex-wrap justify-center gap-2 text-sm">
          {exam.sections.map((s) => (
            <span
              key={s.kind}
              className="rounded-full bg-ink-200 px-3 py-1 font-semibold text-ink-700 dark:bg-ink-800 dark:text-ink-300"
            >
              {s.label} : {s.tasks.reduce((sum, t) => sum + (scores[t.id] ?? 0), 0)} /{' '}
              {s.tasks.reduce((sum, t) => sum + t.points, 0)}
            </span>
          ))}
        </div>
        <p className="rounded-full bg-reward-100 px-6 py-2 text-lg font-bold text-reward-800 dark:bg-reward-900 dark:text-reward-200">
          +{result.xp} XP ⭐ {passed && '(bonus boss battle inclus)'}
        </p>
        <Link
          to="/"
          className="w-full rounded-2xl bg-action-600 px-8 py-5 text-lg font-bold text-white shadow-lg shadow-action-600/25 transition hover:bg-action-700 active:scale-95"
        >
          Retour à l'accueil
        </Link>
      </div>
    )
  }

  const isReview = phase === 'review'
  const words = task.minWords !== undefined ? countWords(answers[task.id] ?? '') : null

  return (
    <div className="flex flex-1 flex-col gap-4">
      {/* Bandeau : section, progression, chrono */}
      <div className="flex items-center justify-between text-sm font-semibold">
        <span className="text-ink-500 dark:text-ink-400">
          {section.label} — {isReview ? 'correction' : `tâche ${taskIndex + 1}/${section.tasks.length}`}
        </span>
        {!isReview && deadline !== null && (
          <span
            className={`rounded-full px-3 py-1 tabular-nums ${
              remaining < 300
                ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200'
                : 'bg-ink-200 text-ink-700 dark:bg-ink-800 dark:text-ink-300'
            }`}
          >
            ⏱️ {formatSeconds(remaining)}
          </span>
        )}
      </div>

      <div className="rounded-3xl border border-ink-200 bg-white p-5 text-left dark:border-ink-700 dark:bg-ink-800">
        <h2 className="font-bold">{task.title}</h2>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{task.context}</p>
        <p className="mt-2 text-sm whitespace-pre-line">{task.instruction}</p>
      </div>

      {!isReview ? (
        // ----- Phase réponse -----
        <div className="flex flex-col gap-3">
          {section.kind === 'ca' && (
            <button
              type="button"
              disabled={!canSpeak || (listens[task.id] ?? 0) >= MAX_LISTENS}
              onClick={() => listen(task)}
              className="rounded-2xl bg-action-600 py-4 text-lg font-bold text-white shadow-lg shadow-action-600/25 transition hover:bg-action-700 active:scale-95 disabled:opacity-40"
            >
              🔊 Écouter ({listens[task.id] ?? 0}/{MAX_LISTENS})
            </button>
          )}
          {section.kind === 'cl' && task.source !== undefined && (
            <div
              lang="nl"
              className="max-h-72 overflow-y-auto rounded-2xl border border-ink-200 bg-white p-4 text-left text-sm whitespace-pre-line dark:border-ink-600 dark:bg-ink-800"
            >
              {task.source}
            </div>
          )}
          {section.kind === 'eo' ? (
            <>
              {task.questions !== undefined && (
                <div className="flex flex-col gap-2">
                  {task.questions.map((question, index) => (
                    <button
                      key={question}
                      type="button"
                      disabled={!canSpeak}
                      onClick={() => speakDutch(question)}
                      className="rounded-2xl border-2 border-action-600 bg-white py-2.5 text-sm font-semibold text-action-700 transition hover:bg-action-50 active:scale-95 disabled:opacity-40 dark:bg-ink-800 dark:text-action-400 dark:hover:bg-ink-700"
                    >
                      🔊 Question {index + 1}
                    </button>
                  ))}
                </div>
              )}
              {recorder.status === 'recording' ? (
                <>
                  <p className="animate-pulse text-center text-3xl font-bold text-red-600 tabular-nums dark:text-red-400">
                    ● {formatSeconds(recorder.seconds)}
                  </p>
                  <button
                    type="button"
                    onClick={recorder.stop}
                    className="rounded-2xl bg-action-600 py-4 font-bold text-white transition hover:bg-action-700 active:scale-95"
                  >
                    ⏹️ Terminer la prise
                  </button>
                </>
              ) : recorder.status === 'done' ? (
                <>
                  <audio controls src={recorder.url ?? undefined} className="w-full" />
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={recorder.reset}
                      className="rounded-2xl bg-ink-200 py-4 font-semibold text-ink-700 transition hover:bg-ink-300 active:scale-95 dark:bg-ink-700 dark:text-ink-200"
                    >
                      🔄 Refaire
                    </button>
                    <button
                      type="button"
                      disabled={recorder.seconds < SPEAKING_MIN_SECONDS}
                      onClick={nextAnswerTask}
                      className="rounded-2xl bg-action-600 py-4 font-bold text-white transition hover:bg-action-700 active:scale-95 disabled:opacity-40"
                    >
                      Tâche suivante →
                    </button>
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  onClick={recorder.start}
                  className="rounded-2xl bg-action-600 py-5 text-lg font-bold text-white shadow-lg shadow-action-600/25 transition hover:bg-action-700 active:scale-95"
                >
                  🎙️ M'enregistrer
                </button>
              )}
              {recorder.status === 'unavailable' && (
                <button
                  type="button"
                  onClick={nextAnswerTask}
                  className="rounded-2xl bg-action-600 py-4 font-bold text-white transition hover:bg-action-700 active:scale-95"
                >
                  Pas de micro — je me suis entraîné à voix haute →
                </button>
              )}
            </>
          ) : (
            <>
              <textarea
                lang={section.kind === 'ee' ? 'nl' : 'fr'}
                value={answers[task.id] ?? ''}
                onChange={(event) => setAnswers((prev) => ({ ...prev, [task.id]: event.target.value }))}
                rows={section.kind === 'ee' ? 8 : 6}
                placeholder={
                  section.kind === 'ee'
                    ? 'Schrijf hier je tekst in het Nederlands…'
                    : 'Note ici tes réponses en français (une par ligne)…'
                }
                className="rounded-2xl border-2 border-ink-200 bg-white p-4 dark:border-ink-600 dark:bg-ink-800"
              />
              {words !== null && (
                <p className="text-center text-sm font-semibold tabular-nums text-ink-500 dark:text-ink-400">
                  {words} mot{words > 1 ? 's' : ''} — minimum {task.minWords}
                </p>
              )}
              <button
                type="button"
                onClick={nextAnswerTask}
                className="rounded-2xl bg-action-600 py-4 font-bold text-white transition hover:bg-action-700 active:scale-95"
              >
                {taskIndex + 1 < section.tasks.length ? 'Tâche suivante →' : 'Corriger cette partie →'}
              </button>
            </>
          )}
        </div>
      ) : (
        // ----- Phase correction (auto-évaluation, PRD §13) -----
        <div className="flex flex-col gap-3">
          {!isProduction ? (
            <>
              {(answers[task.id] ?? '') !== '' && (
                <div className="rounded-2xl border border-ink-200 bg-white p-4 text-left text-sm whitespace-pre-line dark:border-ink-700 dark:bg-ink-800">
                  <p className="mb-1 text-xs font-semibold tracking-wide text-ink-400 uppercase">Tes notes</p>
                  {answers[task.id]}
                </div>
              )}
              <div className="flex flex-col gap-2 rounded-2xl border-2 border-action-600 bg-white p-4 text-left dark:bg-ink-800">
                <p className="font-bold">Corrigé — coche les informations que tu as notées :</p>
                {(task.expected ?? []).map((info, index) => (
                  <label key={info} className="flex items-start gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={(found[task.id] ?? []).includes(index)}
                      onChange={() => toggleFound(task.id, index)}
                      className="mt-0.5 size-5 shrink-0 accent-action-600"
                    />
                    <span>{info}</span>
                  </label>
                ))}
              </div>
              <p className="text-center text-sm font-semibold text-ink-500 dark:text-ink-400">
                {scores[task.id] ?? 0} / {task.points} pts
              </p>
            </>
          ) : (
            <>
              {section.kind === 'ee' && (answers[task.id] ?? '') !== '' && (
                <div
                  lang="nl"
                  className="rounded-2xl border border-ink-200 bg-white p-4 text-left text-sm whitespace-pre-line dark:border-ink-700 dark:bg-ink-800"
                >
                  <p className="mb-1 text-xs font-semibold tracking-wide text-ink-400 uppercase">
                    Ton texte ({words} mots
                    {words !== null && words < 55 ? ' — sous 55 mots, note plafonnée' : ''})
                  </p>
                  {answers[task.id]}
                </div>
              )}
              <div className="flex flex-col gap-2 rounded-2xl border-2 border-action-600 bg-white p-4 text-left dark:bg-ink-800">
                <p className="font-bold">Grille d'évaluation — coche ce qui est vrai :</p>
                {(task.checklist ?? []).map((point, index) => (
                  <label key={point.label} className="flex items-start gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={(found[task.id] ?? []).includes(index)}
                      onChange={() => toggleFound(task.id, index)}
                      className="mt-0.5 size-5 shrink-0 accent-action-600"
                    />
                    <span>
                      {point.label}{' '}
                      <span className="text-ink-400 dark:text-ink-500">
                        ({point.points} pt{point.points > 1 ? 's' : ''})
                      </span>
                    </span>
                  </label>
                ))}
              </div>
              {task.example !== undefined && (
                <details className="rounded-2xl border border-ink-200 bg-white p-4 text-left dark:border-ink-700 dark:bg-ink-800">
                  <summary className="cursor-pointer text-sm font-semibold text-action-700 dark:text-action-400">
                    Voir un exemple de réponse
                  </summary>
                  <p lang="nl" className="mt-2 text-sm">
                    {task.example}
                  </p>
                  {canSpeak && section.kind === 'eo' && (
                    <button
                      type="button"
                      onClick={() => speakDutch(task.example ?? '')}
                      className="mt-2 rounded-full bg-action-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-action-700 active:scale-95"
                    >
                      🔊 Écouter l'exemple
                    </button>
                  )}
                </details>
              )}
              <p className="text-center text-sm font-semibold text-ink-500 dark:text-ink-400">
                {scores[task.id] ?? 0} / {task.points} pts
              </p>
            </>
          )}
          {section.kind === 'ca' && task.source !== undefined && (
            <details className="rounded-2xl border border-ink-200 bg-white p-4 text-left dark:border-ink-700 dark:bg-ink-800">
              <summary className="cursor-pointer text-sm font-semibold text-action-700 dark:text-action-400">
                Voir le transcript
              </summary>
              <p lang="nl" className="mt-2 text-sm whitespace-pre-line">
                {task.source}
              </p>
            </details>
          )}
          <button
            type="button"
            onClick={nextReviewTask}
            className="rounded-2xl bg-action-600 py-4 font-bold text-white transition hover:bg-action-700 active:scale-95"
          >
            {taskIndex + 1 < section.tasks.length
              ? 'Corriger la tâche suivante →'
              : sectionIndex + 1 < exam.sections.length
                ? 'Partie suivante →'
                : 'Voir mon résultat →'}
          </button>
        </div>
      )}

      <Link to="/" className="text-center text-sm text-ink-400 underline">
        Abandonner l'examen
      </Link>
    </div>
  )
}
