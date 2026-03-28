/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import chai from 'chai'
import sinon from 'sinon'

import { challenges } from '../../data/datacache'
import * as adaptiveGuidance from '../../lib/adaptiveGuidance'

const expect = chai.expect

describe('adaptiveGuidance', () => {
  let req: any
  let socketTarget: any
  let emit: any

  beforeEach(() => {
    req = {
      headers: {
        authorization: 'Bearer adaptive-guidance-token'
      }
    }
    challenges.forgedReviewChallenge = { solved: false } as any
    emit = sinon.spy()
    socketTarget = {
      emit
    }
    ;(global as any).io = {
      to: sinon.stub().returns(socketTarget)
    }
    adaptiveGuidance.registerSocketForToken('socket-1', 'adaptive-guidance-token')
  })

  afterEach(() => {
    adaptiveGuidance.unregisterSocket('socket-1')
    delete (global as any).io
  })

  it('emits a first adaptive hint after repeated forged review create attempts', () => {
    adaptiveGuidance.trackForgedReviewCreateAttempt(req)
    adaptiveGuidance.trackForgedReviewCreateAttempt(req)
    adaptiveGuidance.trackForgedReviewCreateAttempt(req)

    expect(emit.calledOnce).to.equal(true)
    expect(emit.firstCall.args[0]).to.equal('adaptive guidance')
    expect(emit.firstCall.args[1]).to.deep.include({
      challengeKey: 'forgedReviewChallenge',
      level: 1
    })
  })

  it('does not emit forged review create hints after the update route was explored', () => {
    adaptiveGuidance.trackForgedReviewUpdateAttempt(req)
    adaptiveGuidance.trackForgedReviewCreateAttempt(req)
    adaptiveGuidance.trackForgedReviewCreateAttempt(req)
    adaptiveGuidance.trackForgedReviewCreateAttempt(req)
    adaptiveGuidance.trackForgedReviewCreateAttempt(req)
    adaptiveGuidance.trackForgedReviewCreateAttempt(req)

    expect(emit.called).to.equal(false)
  })
})
