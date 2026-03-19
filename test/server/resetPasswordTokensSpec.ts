/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { expect } from 'chai'
import {
  createResetPasswordToken,
  createResetPasswordTokenPrefix,
  createResetPasswordTokenSuffix
} from '../../lib/resetPasswordTokenUtils'

describe('resetPasswordTokens', () => {
  it('keeps the beginning of the token stable for the same user across different dates', () => {
    const first = createResetPasswordToken('admin@juice-sh.op', 11, new Date('2026-03-18T12:00:00.000Z'))
    const second = createResetPasswordToken('admin@juice-sh.op', 12, new Date('2026-03-19T12:00:00.000Z'))

    expect(first.startsWith(createResetPasswordTokenPrefix('admin@juice-sh.op'))).to.equal(true)
    expect(second.startsWith(createResetPasswordTokenPrefix('admin@juice-sh.op'))).to.equal(true)
  })

  it('keeps the end of the token stable for different users on the same date', () => {
    const date = new Date('2026-03-19T12:00:00.000Z')
    const first = createResetPasswordToken('jim@juice-sh.op', 7, date)
    const second = createResetPasswordToken('bender@juice-sh.op', 8, date)

    expect(first.endsWith(createResetPasswordTokenSuffix(date))).to.equal(true)
    expect(second.endsWith(createResetPasswordTokenSuffix(date))).to.equal(true)
  })

  it('changes the middle part of the token when the stored entry id changes', () => {
    const date = new Date('2026-03-19T12:00:00.000Z')
    const first = createResetPasswordToken('admin@juice-sh.op', 11, date)
    const second = createResetPasswordToken('admin@juice-sh.op', 12, date)

    expect(first).to.not.equal(second)
    expect(first.startsWith(createResetPasswordTokenPrefix('admin@juice-sh.op'))).to.equal(true)
    expect(second.endsWith(createResetPasswordTokenSuffix(date))).to.equal(true)
  })
})
