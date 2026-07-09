import { describe, expect, it } from 'vitest'
import { formatSeconds, isExpired, recordingPath, RECORDINGS_RETENTION_DAYS } from './speaking'

describe('formatSeconds', () => {
  it('formate en m:ss', () => {
    expect(formatSeconds(0)).toBe('0:00')
    expect(formatSeconds(9)).toBe('0:09')
    expect(formatSeconds(65)).toBe('1:05')
    expect(formatSeconds(600)).toBe('10:00')
  })

  it('tronque les fractions et ne descend jamais sous zéro', () => {
    expect(formatSeconds(59.9)).toBe('0:59')
    expect(formatSeconds(-5)).toBe('0:00')
  })
})

describe('recordingPath', () => {
  it('place le fichier dans le dossier de l’utilisateur (RLS par dossier racine)', () => {
    const now = new Date('2026-07-09T10:30:00.000Z')
    const path = recordingPath('user-123', 'spe-01', now)
    expect(path).toBe('user-123/2026-07-09T10-30-00.000Z-spe-01.webm')
    expect(path.startsWith('user-123/')).toBe(true)
    expect(path).not.toContain(':')
  })
})

describe('isExpired', () => {
  const now = new Date('2026-07-20T12:00:00.000Z')

  it('expiré au-delà de la rétention, pas avant', () => {
    expect(isExpired('2026-07-01T12:00:00.000Z', now)).toBe(true) // 19 jours
    expect(isExpired('2026-07-10T12:00:00.000Z', now)).toBe(false) // 10 jours
  })

  it('la limite exacte n’est pas encore expirée', () => {
    const exactly = new Date(now.getTime() - RECORDINGS_RETENTION_DAYS * 24 * 60 * 60 * 1000)
    expect(isExpired(exactly.toISOString(), now)).toBe(false)
    expect(isExpired(new Date(exactly.getTime() - 1000).toISOString(), now)).toBe(true)
  })

  it('rétention paramétrable', () => {
    expect(isExpired('2026-07-18T12:00:00.000Z', now, 1)).toBe(true)
    expect(isExpired('2026-07-19T13:00:00.000Z', now, 1)).toBe(false)
  })
})
