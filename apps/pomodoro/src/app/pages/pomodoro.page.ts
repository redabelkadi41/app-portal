import { Component, signal, computed, OnDestroy } from '@angular/core';

type TimerMode = 'work' | 'short-break' | 'long-break';

const DURATIONS: Record<TimerMode, number> = {
  'work': 25 * 60,
  'short-break': 5 * 60,
  'long-break': 15 * 60,
};

const MODE_LABELS: Record<TimerMode, string> = {
  'work': 'Focus',
  'short-break': 'Short Break',
  'long-break': 'Long Break',
};

@Component({
  selector: 'app-pomodoro-page',
  standalone: true,
  template: `
    <div class="page">
      <h1>Pomodoro</h1>

      <div class="mode-tabs">
        @for (m of modes; track m) {
          <button
            class="mode-tab"
            [class.active]="mode() === m"
            (click)="setMode(m)"
          >{{ modeLabels[m] }}</button>
        }
      </div>

      <div class="timer-ring" [class.running]="running()">
        <svg viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="90" class="track" />
          <circle
            cx="100" cy="100" r="90"
            class="progress"
            [class.work]="mode() === 'work'"
            [class.short-break]="mode() === 'short-break'"
            [class.long-break]="mode() === 'long-break'"
            [style.stroke-dasharray]="circumference"
            [style.stroke-dashoffset]="dashOffset()"
          />
        </svg>
        <div class="timer-display">
          <span class="time">{{ display() }}</span>
          <span class="mode-label">{{ modeLabels[mode()] }}</span>
        </div>
      </div>

      <div class="controls">
        <button class="btn secondary" (click)="reset()" title="Reset">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="1 4 1 10 7 10"/>
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
          </svg>
        </button>
        <button class="btn primary" (click)="toggle()">
          {{ running() ? 'Pause' : 'Start' }}
        </button>
        <button class="btn secondary" (click)="skip()" title="Skip">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="5 4 15 12 5 20 5 4"/>
            <line x1="19" y1="5" x2="19" y2="19"/>
          </svg>
        </button>
      </div>

      <div class="sessions">
        @for (i of sessionDots(); track i) {
          <span class="dot" [class.filled]="i < completedSessions()"></span>
        }
      </div>
      <p class="session-count">{{ completedSessions() }} / 4 sessions</p>
    </div>
  `,
  styles: `
    .page {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 24px;
      padding: 24px;
    }

    h1 {
      font-size: var(--font-4xl);
      font-weight: 700;
      background: linear-gradient(135deg, var(--text) 40%, var(--primary-light));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .mode-tabs {
      display: flex;
      gap: 4px;
      background: var(--bg-card);
      border-radius: var(--radius-full);
      padding: 4px;
      border: 1px solid var(--border);
    }

    .mode-tab {
      padding: 8px 20px;
      border-radius: var(--radius-full);
      font-size: var(--font-sm);
      font-weight: 500;
      color: var(--text-secondary);
      transition: all var(--transition-fast);
    }

    .mode-tab:hover {
      color: var(--text);
    }

    .mode-tab.active {
      background: var(--primary);
      color: #fff;
    }

    .timer-ring {
      position: relative;
      width: 280px;
      height: 280px;
    }

    .timer-ring svg {
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);
    }

    .track {
      fill: none;
      stroke: var(--border);
      stroke-width: 6;
    }

    .progress {
      fill: none;
      stroke-width: 6;
      stroke-linecap: round;
      transition: stroke-dashoffset 0.5s linear;
    }

    .progress.work { stroke: var(--primary); }
    .progress.short-break { stroke: var(--success); }
    .progress.long-break { stroke: #a78bfa; }

    .timer-display {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .time {
      font-size: 3.5rem;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      color: var(--text);
      letter-spacing: 2px;
    }

    .mode-label {
      font-size: var(--font-sm);
      color: var(--text-muted);
      margin-top: 4px;
    }

    .controls {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .btn {
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-full);
      transition: all var(--transition-fast);
    }

    .btn.primary {
      padding: 14px 48px;
      font-size: var(--font-lg);
      font-weight: 600;
      background: var(--primary);
      color: #fff;
      min-width: 140px;
    }

    .btn.primary:hover {
      background: var(--primary-dark);
      transform: scale(1.03);
    }

    .btn.secondary {
      width: 44px;
      height: 44px;
      background: var(--bg-card);
      color: var(--text-secondary);
      border: 1px solid var(--border);
    }

    .btn.secondary:hover {
      background: var(--bg-card-hover);
      color: var(--text);
    }

    .sessions {
      display: flex;
      gap: 10px;
    }

    .dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: var(--border);
      transition: background var(--transition-fast);
    }

    .dot.filled {
      background: var(--primary);
    }

    .session-count {
      color: var(--text-muted);
      font-size: var(--font-sm);
    }

    @media (max-width: 480px) {
      .timer-ring { width: 240px; height: 240px; }
      .time { font-size: 2.75rem; }
      .mode-tab { padding: 6px 14px; font-size: var(--font-xs); }
    }
  `,
})
export class PomodoroPage implements OnDestroy {
  readonly modes: TimerMode[] = ['work', 'short-break', 'long-break'];
  readonly modeLabels = MODE_LABELS;
  readonly circumference = 2 * Math.PI * 90;

  readonly mode = signal<TimerMode>('work');
  readonly remaining = signal(DURATIONS['work']);
  readonly running = signal(false);
  readonly completedSessions = signal(0);

  readonly display = computed(() => {
    const s = this.remaining();
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  });

  readonly dashOffset = computed(() => {
    const total = DURATIONS[this.mode()];
    const fraction = this.remaining() / total;
    return this.circumference * (1 - fraction);
  });

  readonly sessionDots = computed(() => [0, 1, 2, 3]);

  private intervalId: ReturnType<typeof setInterval> | null = null;

  toggle() {
    if (this.running()) {
      this.pause();
    } else {
      this.start();
    }
  }

  start() {
    if (this.remaining() <= 0) return;
    this.running.set(true);
    this.intervalId = setInterval(() => {
      const next = this.remaining() - 1;
      if (next <= 0) {
        this.remaining.set(0);
        this.pause();
        this.onComplete();
      } else {
        this.remaining.set(next);
      }
    }, 1000);
  }

  pause() {
    this.running.set(false);
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  reset() {
    this.pause();
    this.remaining.set(DURATIONS[this.mode()]);
  }

  skip() {
    this.pause();
    this.onComplete();
  }

  setMode(m: TimerMode) {
    this.pause();
    this.mode.set(m);
    this.remaining.set(DURATIONS[m]);
  }

  private onComplete() {
    if (this.mode() === 'work') {
      const sessions = this.completedSessions() + 1;
      this.completedSessions.set(sessions);
      if (sessions % 4 === 0) {
        this.setMode('long-break');
      } else {
        this.setMode('short-break');
      }
    } else {
      this.setMode('work');
    }
  }

  ngOnDestroy() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
    }
  }
}
