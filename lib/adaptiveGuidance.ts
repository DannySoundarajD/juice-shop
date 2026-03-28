/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { type Request } from 'express'
import { type Server } from 'socket.io'

import { challenges } from '../data/datacache'
import * as utils from './utils'

interface AdaptiveGuidanceMessage {
  id: string
  challengeKey: string
  title: string
  message: string
  level: number
}

interface ForgedReviewGuidanceState {
  createAttempts: number
  updateAttempts: number
  emittedLevels: number[]
}

const forgedReviewGuidanceByActor = new Map<string, ForgedReviewGuidanceState>()
const actorSockets = new Map<string, Set<string>>()
const socketActors = new Map<string, string>()

const globalWithSocketIO = global as typeof globalThis & {
  io: SocketIOClientStatic & Server
}

const getActorKeyFromToken = (token?: string) => {
  if (!token) {
    return undefined
  }
  return `token:${utils.unquote(token)}`
}

const getActorKeyFromRequest = (req: Request) => {
  return getActorKeyFromToken(utils.jwtFrom(req))
}

const getForgedReviewState = (actorKey: string) => {
  const current = forgedReviewGuidanceByActor.get(actorKey)
  if (current) {
    return current
  }

  const initialState = {
    createAttempts: 0,
    updateAttempts: 0,
    emittedLevels: []
  }
  forgedReviewGuidanceByActor.set(actorKey, initialState)
  return initialState
}

const emitAdaptiveGuidance = (actorKey: string, payload: AdaptiveGuidanceMessage) => {
  if (!globalWithSocketIO.io) {
    return
  }

  const targetSockets = actorSockets.get(actorKey)
  if (!targetSockets?.size) {
    return
  }

  targetSockets.forEach((socketId) => {
    globalWithSocketIO.io.to(socketId).emit('adaptive guidance', payload)
  })
}

const emitForgedReviewHint = (actorKey: string, level: number, message: string) => {
  emitAdaptiveGuidance(actorKey, {
    id: `forgedReviewChallenge-${level}`,
    challengeKey: 'forgedReviewChallenge',
    title: 'Adaptive Guidance',
    message,
    level
  })
}

export const registerSocketForToken = (socketId: string, token?: string) => {
  const actorKey = getActorKeyFromToken(token)
  if (!actorKey) {
    return
  }

  const sockets = actorSockets.get(actorKey) ?? new Set<string>()
  sockets.add(socketId)
  actorSockets.set(actorKey, sockets)
  socketActors.set(socketId, actorKey)
}

export const unregisterSocket = (socketId: string) => {
  const actorKey = socketActors.get(socketId)
  if (!actorKey) {
    return
  }

  const sockets = actorSockets.get(actorKey)
  sockets?.delete(socketId)
  if (sockets?.size === 0) {
    actorSockets.delete(actorKey)
  }
  socketActors.delete(socketId)
}

export const trackForgedReviewCreateAttempt = (req: Request) => {
  if (challenges.forgedReviewChallenge?.solved) {
    return
  }

  const actorKey = getActorKeyFromRequest(req)
  if (!actorKey) {
    return
  }

  const state = getForgedReviewState(actorKey)
  state.createAttempts += 1

  if (state.updateAttempts === 0 && state.createAttempts >= 3 && !state.emittedLevels.includes(1)) {
    state.emittedLevels.push(1)
    emitForgedReviewHint(actorKey, 1, 'You keep creating new reviews. This challenge might involve review functionality beyond just submitting a fresh one.')
  }

  if (state.updateAttempts === 0 && state.createAttempts >= 5 && !state.emittedLevels.includes(2)) {
    state.emittedLevels.push(2)
    emitForgedReviewHint(actorKey, 2, 'Try interacting with one of your existing reviews and inspect the request that is sent when you edit it.')
  }
}

export const trackForgedReviewUpdateAttempt = (req: Request) => {
  if (challenges.forgedReviewChallenge?.solved) {
    return
  }

  const actorKey = getActorKeyFromRequest(req)
  if (!actorKey) {
    return
  }

  const state = getForgedReviewState(actorKey)
  state.updateAttempts += 1
}

export const resetForgedReviewGuidance = (req: Request) => {
  const actorKey = getActorKeyFromRequest(req)
  if (!actorKey) {
    return
  }

  forgedReviewGuidanceByActor.delete(actorKey)
}
