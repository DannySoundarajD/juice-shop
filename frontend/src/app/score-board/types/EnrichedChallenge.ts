import { type Challenge } from '../../Models/challenge.model'

export interface EnrichedChallenge extends Challenge {
  originalDescription: string
  hintText: string
  nextHint: number
  hintsUnlocked: number
  hintsAvailable: number
  tagList: string[]
  adaptiveGuidance?: {
    message: string
    level: number
  }
}
