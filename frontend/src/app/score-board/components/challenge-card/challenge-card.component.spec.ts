import { type ComponentFixture, TestBed } from '@angular/core/testing'
import { provideZoneChangeDetection } from '@angular/core'

import { ChallengeCardComponent } from './challenge-card.component'
import { type Config } from 'src/app/Services/configuration.service'
import { TranslateModule } from '@ngx-translate/core'
import { MatIconModule } from '@angular/material/icon'
import { MatTooltipModule } from '@angular/material/tooltip'

describe('ChallengeCard', () => {
  let component: ChallengeCardComponent
  let fixture: ComponentFixture<ChallengeCardComponent>

  const defaultChallenge = {
    category: 'foobar',
    name: 'my name',
    mitigationUrl: 'https://owasp.example.com',
    hasCodingChallenge: true,
    description: 'lorem ipsum',
    tagList: ['Easy']
  } as any

  const defaultAppConfig = {
    ctf: { showFlagsInNotifications: true },
    challenges: { codingChallengesEnabled: 'solved' },
    hackingInstructor: { isEnabled: true }
  } as Config

  async function setup () {
    await TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot(), MatIconModule, MatTooltipModule, ChallengeCardComponent],
      providers: [provideZoneChangeDetection()]
    })
      .compileComponents()

    fixture = TestBed.createComponent(ChallengeCardComponent)
    component = fixture.componentInstance

    component.challenge = { ...defaultChallenge } as any
    component.applicationConfiguration = defaultAppConfig

    fixture.detectChanges()
  }

  function appendCodeToFixture (text: string) {
    const codeTag = document.createElement('code')
    codeTag.innerText = text
    fixture.nativeElement.appendChild(codeTag)
    return codeTag
  }

  beforeEach(async () => {
    await setup()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should not show a mitigation link when challenge has it but is not solved', () => {
    component.challenge.solved = false
    component.challenge.mitigationUrl = 'https://owasp.example.com'
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('[aria-label="Vulnerability mitigation link"]'))
      .toBeFalsy()
  })

  it('should show a mitigation link when challenge has it and is solved', () => {
    component.challenge.solved = true
    component.challenge.mitigationUrl = 'https://owasp.example.com'
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('[aria-label="Vulnerability mitigation link"]'))
      .toBeTruthy()
  })

  it('should copy payload to clipboard and show confirmation', async () => {
    const codeTag = appendCodeToFixture('javascript:alert(`xss`)')

    const mockClipboard = {
      writeText: jasmine.createSpy('writeText').and.returnValue(Promise.resolve())
    }
    Object.defineProperty(navigator, 'clipboard', {
      value: mockClipboard,
      writable: true
    })
    spyOn((component as any).snackBarHelperService, 'open')

    component.copyPayload({ target: codeTag } as unknown as MouseEvent)
    fixture.detectChanges()
    await fixture.whenStable()

    expect(mockClipboard.writeText).toHaveBeenCalledWith('javascript:alert(`xss`)')
    expect((component as any).snackBarHelperService.open).toHaveBeenCalledWith('COPY_SUCCESS', 'confirmBar')
  })

  it('should do nothing when no code element is present', async () => {
    const existingCodeTag = fixture.nativeElement.querySelector('code')
    if (existingCodeTag) existingCodeTag.remove()

    const mockClipboard = {
      writeText: jasmine.createSpy('writeText').and.returnValue(Promise.resolve())
    }
    Object.defineProperty(navigator, 'clipboard', {
      value: mockClipboard,
      writable: true
    })
    spyOn((component as any).snackBarHelperService, 'open')

    component.copyPayload({ target: fixture.nativeElement } as unknown as MouseEvent)
    fixture.detectChanges()
    await fixture.whenStable()

    expect(mockClipboard.writeText).not.toHaveBeenCalled()
    expect((component as any).snackBarHelperService.open).not.toHaveBeenCalled()
  })

  it('should handle unavailable clipboard gracefully', async () => {
    const codeTag = appendCodeToFixture('javascript:alert(`xss`)')

    Object.defineProperty(navigator, 'clipboard', { value: undefined, writable: true })
    spyOn((component as any).snackBarHelperService, 'open')

    component.copyPayload({ target: codeTag } as unknown as MouseEvent)
    fixture.detectChanges()
    await fixture.whenStable()

    expect((component as any).snackBarHelperService.open).not.toHaveBeenCalled()
  })

  it('should show adaptive guidance inside the challenge card', () => {
    component.challenge = {
      ...defaultChallenge,
      adaptiveGuidance: {
        message: 'Try interacting with one of your existing reviews and inspect the request that is sent when you edit it.',
        level: 2
      }
    } as any

    fixture.detectChanges()

    expect(fixture.nativeElement.querySelector('.adaptive-guidance-row')?.textContent)
      .toContain('Try interacting with one of your existing reviews')
  })

  it('should allow admin users to open the forged review coding challenge before solving it', () => {
    const originalToken = localStorage.getItem('token')
    localStorage.setItem('token', 'header.eyJkYXRhIjp7InJvbGUiOiJhZG1pbiJ9fQ.signature')
    component.challenge = {
      ...defaultChallenge,
      key: 'forgedReviewChallenge',
      solved: false,
      hasCodingChallenge: true
    } as any

    expect(component.canOpenCodingChallenge()).toBeTrue()

    if (originalToken) {
      localStorage.setItem('token', originalToken)
    } else {
      localStorage.removeItem('token')
    }
  })
})
