/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

// eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
// @ts-expect-error FIXME no typescript definitions for z85 :(
import * as z85 from 'z85'

function padForZ85 (value: string): string {
  const remainder = value.length % 4
  return remainder === 0 ? value : value.padEnd(value.length + (4 - remainder), ' ')
}

function encodeForResetPasswordToken (value: string): string {
  return z85.encode(padForZ85(value))
}

export function formatResetPasswordTokenDate (date = new Date()): string {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function createResetPasswordTokenPrefix (email: string): string {
  return encodeForResetPasswordToken(email)
}

export function createResetPasswordTokenSuffix (date = new Date()): string {
  return encodeForResetPasswordToken(formatResetPasswordTokenDate(date))
}

export function createResetPasswordToken (email: string, entryId: number, date = new Date()): string {
  const encodedEntryId = encodeForResetPasswordToken(entryId.toString().padStart(4, '0'))
  return `${createResetPasswordTokenPrefix(email)}${encodedEntryId}${createResetPasswordTokenSuffix(date)}`
}

export function getResetPasswordTokenExpiry (date = new Date()): Date {
  const expiry = new Date(date)
  expiry.setHours(23, 59, 59, 999)
  return expiry
}
