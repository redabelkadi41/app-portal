import {
  Component, computed, inject, signal
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ThemeService } from '@libs/shared';

import { RoundOneCandidate, Round2CandidateInfo, TransferPool } from '../models/simulator.models';
import { SimulatorHeader } from '../components/simulator-header/simulator-header';
import { PhaseStepper } from '../components/phase-stepper/phase-stepper';
import { GeneralStats } from '../components/general-stats/general-stats';
import { CandidateCard } from '../components/candidate-card/candidate-card';
import { ValidationBox } from '../components/validation-box/validation-box';
import { TransferPoolComponent } from '../components/transfer-pool/transfer-pool';
import { ResultCard } from '../components/result-card/result-card';
import { SummaryTable, SummaryRow } from '../components/summary-table/summary-table';
import { ComparisonChart } from '../components/comparison-chart/comparison-chart';

@Component({
  selector: 'app-simulator-page',
  standalone: true,
  imports: [
    DecimalPipe,
    SimulatorHeader,
    PhaseStepper,
    GeneralStats,
    CandidateCard,
    ValidationBox,
    TransferPoolComponent,
    ResultCard,
    SummaryTable,
    ComparisonChart,
  ],
  template: `
    <div class="simulator">

      <app-simulator-header
        [theme]="theme.current()"
        (themeToggle)="theme.toggle()">
      </app-simulator-header>

      <app-phase-stepper [currentPhase]="currentPhase()"></app-phase-stepper>

      <!-- ==================== PHASE 1 ==================== -->
      @if (currentPhase() === 1) {
        <div class="phase-content fade-in">

          <app-general-stats
            [inscrits]="inscrits()"
            [votants]="votants()"
            [nuls]="nuls()"
            [blancs]="blancs()"
            [exprimes]="exprimes()"
            [participationRate]="participationRate()"
            [abstentionPool]="abstentionPool()"
            (inscritChange)="inscrits.set($event)"
            (votantChange)="votants.set($event)"
            (nulChange)="nuls.set($event)"
            (blancChange)="blancs.set($event)">
          </app-general-stats>

          <!-- Candidates -->
          <section class="card">
            <div class="card-head">
              <h2 class="card-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                Candidats
              </h2>
              <button class="btn btn-primary" (click)="addCandidate()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Ajouter
              </button>
            </div>

            @if (candidates().length === 0) {
              <p class="empty-hint">Ajoutez au moins 2 candidats pour commencer.</p>
            } @else {
              @for (c of candidates(); track c.id; let i = $index) {
                <app-candidate-card
                  [candidate]="c"
                  [index]="i"
                  [hasFirstRoundWinner]="!!firstRoundWinner()"
                  [exprimes]="exprimes()"
                  [mergeTargets]="getMergeTargets(c.id)"
                  (nameChange)="updateName($event.id, $event.name)"
                  (votesChange)="updateVotes($event.id, $event.event)"
                  (willRunChange)="setWillRun($event.id, $event.value)"
                  (mergeToggle)="toggleMerge($event)"
                  (mergeTargetChange)="setMergeTarget($event.id, $event.event)"
                  (remove)="removeCandidate($event)">
                </app-candidate-card>
              }
            }
          </section>

          <!-- Validation -->
          @if (candidates().length > 0) {
            <app-validation-box
              [voteDelta]="voteDelta()"
              [hasRound2Candidate]="hasRound2Candidate()"
              [allCandidatesDecided]="allCandidatesDecided()"
              [hasIncompleteNames]="hasIncompleteNames()"
              [hasMergeErrors]="hasMergeErrors()"
              [isValid]="isPhase1Valid()"
              [firstRoundWinner]="firstRoundWinner()"
              [candidatePercentFn]="candidatePercentFn">
            </app-validation-box>
          }

          <!-- T1 winner: seat distribution -->
          @if (firstRoundWinner()) {
            <div class="t1-seats-section fade-in">
              <div class="t1-seats-head">
                <h2 class="card-title">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                  Répartition des sièges — Élu(e) au 1er tour
                </h2>
                <div class="sieges-field">
                  <label for="sieges-t1">Sièges</label>
                  <input id="sieges-t1" type="number" min="0"
                    [value]="sieges()"
                    (input)="sieges.set(toInt($event))">
                </div>
              </div>

              @if (t1SeatBreakdown(); as sb) {
                <div class="seat-card">
                  <div class="seat-meta">
                    <div class="seat-meta-row">
                      <span>Prime majoritaire (50% arrondi sup.)</span>
                      <strong>{{ sb.primeSeats }} sièges → {{ sb.winnerName }}</strong>
                    </div>
                    <div class="seat-meta-row">
                      <span>Sièges restants à la proportionnelle</span>
                      <strong>{{ sb.remainingSeats }}</strong>
                    </div>
                    <div class="seat-meta-row">
                      <span>Quotient électoral ({{ sb.admittedVotes | number }} / {{ sb.remainingSeats }})</span>
                      <strong>{{ sb.quotient | number:'1.2-2' }}</strong>
                    </div>
                  </div>

                  <table class="seat-table">
                    <thead>
                      <tr>
                        <th>Liste</th>
                        <th>Voix T1</th>
                        <th>% T1</th>
                        <th>Prime</th>
                        <th>Proportionnel</th>
                        <th>Moyenne</th>
                        <th>+ Moy.</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (l of sb.lists; track l.name) {
                        <tr [class.winner-row]="l.prime > 0">
                          <td>{{ l.name }}</td>
                          <td>{{ l.votes | number }}</td>
                          <td>{{ l.percent | number:'1.2-2' }}%</td>
                          <td>{{ l.prime || '-' }}</td>
                          <td>{{ l.proportional }}</td>
                          <td>{{ l.average | number:'1.2-2' }}</td>
                          <td>{{ l.avgSeat || '-' }}</td>
                          <td class="seat-total">{{ l.total }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </div>
          }

          <!-- CTA -->
          <div class="cta-wrap">
            <button class="btn btn-cta" [disabled]="!isPhase1Valid()" (click)="proceedToPhase2()">
              Passer à la simulation
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>
      }

      <!-- ==================== PHASE 2 ==================== -->
      @if (currentPhase() === 2) {
        <div class="phase-content fade-in">
          <button class="btn btn-back" (click)="currentPhase.set(1)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Modifier les données du 1er tour
          </button>

          <div class="sim-layout">
            <!-- Left: sliders by pool -->
            <div class="sliders-col">
              <div class="sliders-head">
                <h2>Reports de voix</h2>
                <button class="btn btn-sm" (click)="resetSliders()">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
                  Réinitialiser
                </button>
              </div>

              @for (pool of transferPools(); track pool.id) {
                <app-transfer-pool
                  [pool]="pool"
                  [round2Candidates]="round2Candidates()"
                  [remainingPercent]="remainingPercent(pool.id)"
                  [allSliders]="sliders()"
                  (sliderChange)="setSlider($event.candidateId, $event.poolId, $event.event)"
                  (votesChange)="setSliderPercent($event.candidateId, $event.poolId, $event.percent)">
                </app-transfer-pool>
              }
            </div>

            <!-- Right: results -->
            <div class="results-col">
              <div class="results-head">
                <h2>Résultats projetés — 2nd tour</h2>
                <div class="sieges-field">
                  <label for="sieges-r2">Sièges</label>
                  <input id="sieges-r2" type="number" min="0"
                    [value]="sieges()"
                    (input)="sieges.set(toInt($event))">
                </div>
              </div>

              <div class="res-cards">
                @for (r2 of round2Candidates(); track r2.id) {
                  <app-result-card
                    [candidate]="r2"
                    [isWinner]="projectedWinnerId() === r2.id"
                    [projectedVotes]="getProjectedVotes(r2.id)"
                    [projectedPercent]="getProjectedPercent(r2.id)"
                    [seats]="getSeats(r2.id)"
                    [showSeats]="sieges() > 0">
                  </app-result-card>
                }
              </div>

              <div class="abs-summary">
                <div class="abs-row">
                  <span>Exprimés projetés (T2)</span>
                  <strong>{{ totalProjectedExpressed() | number }}</strong>
                </div>
                <div class="abs-row">
                  <span>Abstentions projetées (T2)</span>
                  <strong>{{ projectedAbstentions() | number }} ({{ projectedAbstentionRate() | number:'1.2-2' }}% des inscrits)</strong>
                </div>
              </div>

              <app-comparison-chart
                [labels]="chartLabels()"
                [r1Data]="chartR1Data()"
                [r2Data]="chartR2Data()"
                [isDark]="theme.current() === 'dark'">
              </app-comparison-chart>

              <app-summary-table
                [rows]="summaryRows()"
                [showSeats]="sieges() > 0">
              </app-summary-table>

              @if (seatBreakdown(); as sb) {
                <div class="seat-card">
                  <h3 class="seat-title">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                    Répartition des {{ sb.totalSeats }} sièges
                  </h3>

                  <div class="seat-meta">
                    <div class="seat-meta-row">
                      <span>Prime majoritaire (50% arrondi sup.)</span>
                      <strong>{{ sb.primeSeats }} sièges → {{ sb.winnerName }}</strong>
                    </div>
                    <div class="seat-meta-row">
                      <span>Sièges restants à la proportionnelle</span>
                      <strong>{{ sb.remainingSeats }}</strong>
                    </div>
                    <div class="seat-meta-row">
                      <span>Quotient électoral ({{ sb.admittedVotes | number }} / {{ sb.remainingSeats }})</span>
                      <strong>{{ sb.quotient | number:'1.2-2' }}</strong>
                    </div>
                  </div>

                  <table class="seat-table">
                    <thead>
                      <tr>
                        <th>Liste</th>
                        <th>Voix T2</th>
                        <th>Prime</th>
                        <th>Proportionnel</th>
                        <th>Moyenne</th>
                        <th>+ Moy.</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (l of sb.lists; track l.name) {
                        <tr [class.winner-row]="l.prime > 0">
                          <td>{{ l.name }}</td>
                          <td>{{ l.votes | number }}</td>
                          <td>{{ l.prime || '-' }}</td>
                          <td>{{ l.proportional }}</td>
                          <td>{{ l.average | number:'1.2-2' }}</td>
                          <td>{{ l.avgSeat || '-' }}</td>
                          <td class="seat-total">{{ l.total }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }

              <div class="export-row">
                <button class="btn btn-secondary" (click)="exportCSV()">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Exporter CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
      min-height: 100vh;
      --fr-blue: #002395;
      --fr-red: #ED2939;
      --fr-blue-l: #3366cc;
      --fr-red-l: #ff4d5e;
    }

    /* --- Phase content --- */
    .phase-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 24px 40px;
    }
    .fade-in {
      animation: fadeIn 0.3s ease;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* --- Card (used for candidates section) --- */
    .card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 24px;
      margin-bottom: 20px;
    }
    .card-title {
      font-size: var(--font-lg);
      font-weight: 600;
      color: var(--text);
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 20px;
    }
    .card-title svg { color: var(--fr-blue-l); flex-shrink: 0; }
    .card-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .card-head .card-title { margin-bottom: 0; }

    /* --- Buttons --- */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: var(--radius-sm);
      font-size: var(--font-sm);
      font-weight: 500;
      transition: all var(--transition-fast);
    }
    .btn-primary {
      background: var(--fr-blue);
      color: #fff;
    }
    .btn-primary:hover { background: var(--fr-blue-l); }
    .btn-secondary {
      background: var(--surface);
      color: var(--text);
      border: 1px solid var(--border);
    }
    .btn-secondary:hover { background: var(--bg-card-hover); }
    .btn-sm { padding: 6px 12px; font-size: var(--font-xs); }
    .btn-sm:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-back {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      font-size: var(--font-sm);
      color: var(--text-secondary);
      border-radius: var(--radius-sm);
      margin-bottom: 20px;
      transition: all var(--transition-fast);
    }
    .btn-back:hover { color: var(--text); background: var(--bg-card); }
    .btn-cta {
      background: var(--fr-blue);
      color: #fff;
      padding: 14px 32px;
      font-size: var(--font-base);
      font-weight: 600;
      border-radius: var(--radius-md);
    }
    .btn-cta:hover:not(:disabled) { background: var(--fr-blue-l); }
    .btn-cta:disabled { opacity: 0.4; cursor: not-allowed; }
    .cta-wrap { text-align: center; margin-top: 8px; }

    .empty-hint { color: var(--text-muted); font-size: var(--font-sm); }

    /* --- T1 winner seat distribution --- */
    .t1-seats-section {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 24px;
      margin-bottom: 20px;
    }
    .t1-seats-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .t1-seats-head .card-title { margin-bottom: 0; }

    /* ==================== PHASE 2 ==================== */
    .sim-layout {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      align-items: start;
    }

    /* --- Sliders column --- */
    .sliders-col {}
    .sliders-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .sliders-head h2 { font-size: var(--font-xl); font-weight: 600; }

    /* --- Results column --- */
    .results-col {}
    .results-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .results-head h2 {
      font-size: var(--font-xl);
      font-weight: 600;
    }
    .sieges-field {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .sieges-field label {
      font-size: var(--font-xs);
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      white-space: nowrap;
    }
    .sieges-field input {
      width: 80px;
      padding: 8px 10px;
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      color: var(--text);
      font-size: var(--font-base);
      font-family: inherit;
      transition: border-color var(--transition-fast);
    }
    .sieges-field input:focus {
      outline: none;
      border-color: var(--fr-blue-l);
    }
    .res-cards { display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px; }

    /* --- Abstention summary --- */
    .abs-summary {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 14px 16px;
      margin-bottom: 20px;
    }
    .abs-row {
      display: flex;
      justify-content: space-between;
      font-size: var(--font-sm);
      color: var(--text-secondary);
      padding: 4px 0;
    }
    .abs-row strong { color: var(--text); }

    /* --- Seat distribution card --- */
    .seat-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 20px;
      margin-bottom: 16px;
    }
    .seat-title {
      font-size: var(--font-base);
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
    }
    .seat-title svg { color: var(--fr-blue-l); flex-shrink: 0; }
    .seat-meta {
      margin-bottom: 16px;
      padding-bottom: 14px;
      border-bottom: 1px solid var(--border);
    }
    .seat-meta-row {
      display: flex;
      justify-content: space-between;
      font-size: var(--font-sm);
      color: var(--text-secondary);
      padding: 3px 0;
    }
    .seat-meta-row strong { color: var(--text); }
    .seat-table {
      width: 100%;
      border-collapse: collapse;
      font-size: var(--font-sm);
    }
    .seat-table th {
      text-align: left;
      padding: 8px 10px;
      background: var(--surface);
      color: var(--text-secondary);
      font-weight: 600;
      font-size: var(--font-xs);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      white-space: nowrap;
    }
    .seat-table td {
      padding: 8px 10px;
      border-top: 1px solid var(--border);
      white-space: nowrap;
    }
    .seat-table .winner-row { background: rgba(0,35,149,0.04); }
    .seat-total { font-weight: 700; color: var(--fr-blue-l); }

    /* --- Export --- */
    .export-row { text-align: right; }

    /* ==================== RESPONSIVE ==================== */
    @media (max-width: 1024px) {
      .sim-layout {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .phase-content { padding: 0 16px 32px; }
      .card { padding: 16px; }
    }
  `
})
export class SimulatorPage {
  protected readonly theme = inject(ThemeService);

  // -- Phase state
  readonly currentPhase = signal<1 | 2>(1);

  // -- Phase 1: global stats
  readonly inscrits = signal(0);
  readonly votants = signal(0);
  readonly nuls = signal(0);
  readonly blancs = signal(0);
  readonly sieges = signal(0);

  readonly exprimes = computed(() => this.votants() - this.nuls() - this.blancs());
  readonly participationRate = computed(() => {
    const i = this.inscrits();
    return i > 0 ? (this.votants() / i) * 100 : 0;
  });
  readonly abstentionPool = computed(() => Math.max(0, this.inscrits() - this.exprimes()));

  // -- Phase 1: candidates
  private nextId = 1;
  readonly candidates = signal<RoundOneCandidate[]>([]);

  // -- Phase 1: validation
  readonly voteDelta = computed(() => {
    const sum = this.candidates().reduce((s, c) => s + c.votes, 0);
    return sum - this.exprimes();
  });

  readonly hasRound2Candidate = computed(() =>
    this.candidates().some(c => c.willRunInRound2 === true)
  );

  readonly allCandidatesDecided = computed(() =>
    this.candidates().length > 0 && this.candidates().every(c => c.willRunInRound2 !== null)
  );

  readonly firstRoundWinner = computed<RoundOneCandidate | null>(() => {
    const exp = this.exprimes();
    if (exp <= 0) return null;
    return this.candidates().find(c => c.votes > exp / 2) ?? null;
  });

  readonly hasIncompleteNames = computed(() =>
    this.candidates().some(c => !c.name)
  );

  readonly hasMergeErrors = computed(() => {
    const all = this.candidates();
    const r2Ids = new Set(all.filter(c => c.willRunInRound2 === true).map(c => c.id));
    return all.some(c => {
      if (c.willRunInRound2 === false && c.willMerge) {
        if (c.mergeTargetId === null) return true;
        if (!r2Ids.has(c.mergeTargetId)) return true;
      }
      return false;
    });
  });

  readonly isPhase1Valid = computed(() => {
    const cs = this.candidates();
    if (cs.length < 2) return false;
    if (this.inscrits() <= 0 || this.votants() <= 0 || this.exprimes() <= 0) return false;
    if (this.voteDelta() !== 0) return false;
    if (!this.hasRound2Candidate()) return false;
    if (!this.allCandidatesDecided()) return false;
    if (cs.some(c => !c.name)) return false;
    if (this.hasMergeErrors()) return false;
    if (this.firstRoundWinner()) return false;
    return true;
  });

  // Function reference for passing to ValidationBox input
  readonly candidatePercentFn = (c: RoundOneCandidate): number => this.candidatePercent(c);

  // -- Phase 1: T1 seat breakdown (when a candidate wins outright in round 1)
  readonly t1SeatBreakdown = computed(() => {
    const winner = this.firstRoundWinner();
    const totalSeats = this.sieges();
    const cs = this.candidates();
    const exp = this.exprimes();
    if (!winner || totalSeats <= 0 || cs.length === 0 || exp <= 0 || this.voteDelta() !== 0) return null;

    const primeSeats = Math.ceil(totalSeats / 2);
    const remainingSeats = totalSeats - primeSeats;

    // Lists admitted to proportional: >= 5% of expressed votes
    const admitted = cs.filter(c => (c.votes / exp) * 100 >= 5);
    const admittedVotes = admitted.reduce((s, c) => s + c.votes, 0);
    const quotient = remainingSeats > 0 && admittedVotes > 0 ? admittedVotes / remainingSeats : 0;

    const lists: {
      name: string;
      votes: number;
      percent: number;
      prime: number;
      proportional: number;
      average: number;
      avgSeat: number;
      total: number;
    }[] = [];

    let distributedProp = 0;
    for (const c of cs) {
      const isAdmitted = admitted.some(a => a.id === c.id);
      const prop = isAdmitted && remainingSeats > 0 && quotient > 0 ? Math.floor(c.votes / quotient) : 0;
      distributedProp += prop;
      lists.push({
        name: c.name,
        votes: c.votes,
        percent: (c.votes / exp) * 100,
        prime: c.id === winner.id ? primeSeats : 0,
        proportional: prop,
        average: 0,
        avgSeat: 0,
        total: 0,
      });
    }

    // Plus forte moyenne for leftover seats
    const admittedIds = new Set(admitted.map(c => c.id));
    let leftover = remainingSeats - distributedProp;
    while (leftover > 0) {
      let bestIdx = -1;
      let bestAvg = -1;
      for (let i = 0; i < lists.length; i++) {
        if (!admittedIds.has(cs[i].id)) continue;
        const propTotal = lists[i].proportional + lists[i].avgSeat;
        const avg = lists[i].votes / (propTotal + 1);
        if (avg > bestAvg) {
          bestAvg = avg;
          bestIdx = i;
        }
      }
      if (bestIdx >= 0) {
        lists[bestIdx].avgSeat++;
        leftover--;
      } else break;
    }

    for (const l of lists) {
      l.average = l.votes / (l.proportional + 1);
      l.total = l.prime + l.proportional + l.avgSeat;
    }

    return {
      totalSeats, primeSeats, remainingSeats, quotient, admittedVotes,
      totalExpressed: exp, lists,
      winnerName: winner.name,
    };
  });

  // -- Phase 2: derived data
  readonly round2Candidates = computed<Round2CandidateInfo[]>(() => {
    const all = this.candidates();
    return all
      .filter(c => c.willRunInRound2 === true)
      .map(c => {
        const merged = all.filter(m =>
          m.willRunInRound2 === false && m.willMerge && m.mergeTargetId === c.id
        );
        return {
          id: c.id,
          name: c.name,
          ownVotes: c.votes,
          mergedFrom: merged.map(m => m.name),
        };
      });
  });

  readonly transferPools = computed<TransferPool[]>(() => {
    const all = this.candidates();
    const pools: TransferPool[] = [];

    for (const c of all) {
      const name = c.name;
      if (c.willRunInRound2 === true) {
        pools.push({ id: `c-${c.id}`, label: name, votes: c.votes, type: 'r2' });
      } else if (c.willMerge && c.mergeTargetId !== null) {
        const target = all.find(t => t.id === c.mergeTargetId);
        pools.push({
          id: `c-${c.id}`, label: name, votes: c.votes, type: 'merged',
          mergeTarget: target ? target.name : undefined,
        });
      } else {
        pools.push({ id: `c-${c.id}`, label: name, votes: c.votes, type: 'eliminated' });
      }
    }

    const abs = this.inscrits() - this.exprimes();
    if (abs > 0) {
      pools.push({ id: 'abstention', label: 'Abstentionnistes', votes: abs, type: 'abstention' });
    }

    return pools;
  });

  // -- Phase 2: slider state
  readonly sliders = signal<Record<number, Record<string, number>>>({});

  // -- Phase 2: chart pre-computed data
  readonly chartLabels = computed(() => this.round2Candidates().map(c => c.name));
  readonly chartR1Data = computed(() => this.round2Candidates().map(c => c.ownVotes));
  readonly chartR2Data = computed(() => this.round2Candidates().map(c => this.getProjectedVotes(c.id)));

  // -- Phase 2: summary rows
  readonly summaryRows = computed<SummaryRow[]>(() =>
    this.round2Candidates().map(r2 => ({
      name: r2.name,
      r1Votes: r2.ownVotes,
      r1Percent: this.getR1Percent(r2),
      r2Votes: this.getProjectedVotes(r2.id),
      r2Percent: this.getProjectedPercent(r2.id),
      evolution: this.getProjectedVotes(r2.id) - r2.ownVotes,
      seats: this.getSeats(r2.id),
      isWinner: this.projectedWinnerId() === r2.id,
    }))
  );

  // ===== Helpers =====

  toInt(e: Event): number {
    return parseInt((e.target as HTMLInputElement).value, 10) || 0;
  }

  // ===== Phase 1 methods =====

  addCandidate(): void {
    this.candidates.update(cs => [
      ...cs,
      {
        id: this.nextId++,
        name: '',
        votes: 0,
        willRunInRound2: null,
        willMerge: false,
        mergeTargetId: null,
      }
    ]);
  }

  removeCandidate(id: number): void {
    this.candidates.update(cs =>
      cs
        .filter(c => c.id !== id)
        .map(c => c.mergeTargetId === id ? { ...c, willMerge: false, mergeTargetId: null } : c)
    );
  }

  updateName(id: number, name: string): void {
    this.candidates.update(cs =>
      cs.map(c => c.id === id ? { ...c, name } : c)
    );
  }

  updateVotes(id: number, e: Event): void {
    const val = Math.max(0, parseInt((e.target as HTMLInputElement).value, 10) || 0);
    this.candidates.update(cs => {
      const exp = this.votants() - this.nuls() - this.blancs();
      return cs.map(c => {
        if (c.id !== id) return c;
        const updated = { ...c, votes: val };
        if (exp > 0 && (val / exp) * 100 < 5) {
          updated.willRunInRound2 = false;
          updated.willMerge = false;
          updated.mergeTargetId = null;
        }
        return updated;
      });
    });
  }

  setWillRun(id: number, value: boolean): void {
    this.candidates.update(cs => cs.map(c => {
      if (c.id !== id) {
        if (!value && c.mergeTargetId === id) {
          return { ...c, willMerge: false, mergeTargetId: null };
        }
        return c;
      }
      return {
        ...c,
        willRunInRound2: value,
        willMerge: false,
        mergeTargetId: null,
      };
    }));
  }

  toggleMerge(id: number): void {
    this.candidates.update(cs =>
      cs.map(c => c.id === id
        ? { ...c, willMerge: !c.willMerge, mergeTargetId: null }
        : c
      )
    );
  }

  setMergeTarget(id: number, e: Event): void {
    const val = parseInt((e.target as HTMLSelectElement).value, 10) || null;
    this.candidates.update(cs =>
      cs.map(c => c.id === id ? { ...c, mergeTargetId: val } : c)
    );
  }

  getMergeTargets(candidateId: number): RoundOneCandidate[] {
    const all = this.candidates();
    const exp = this.exprimes();
    const threshold = exp * 0.1;
    return all.filter(c =>
      c.id !== candidateId &&
      c.willRunInRound2 === true &&
      c.votes > threshold
    );
  }

  candidatePercent(c: RoundOneCandidate): number {
    const exp = this.exprimes();
    return exp > 0 ? (c.votes / exp) * 100 : 0;
  }

  // ===== Phase transition =====

  proceedToPhase2(): void {
    const r2 = this.round2Candidates();
    const pools = this.transferPools();
    const init: Record<number, Record<string, number>> = {};
    for (const c of r2) {
      init[c.id] = {};
      for (const p of pools) {
        init[c.id][p.id] = 0;
      }
    }
    this.sliders.set(init);
    this.currentPhase.set(2);
  }

  // ===== Phase 2 methods =====

  getSlider(candidateId: number, poolId: string): number {
    return this.sliders()[candidateId]?.[poolId] ?? 0;
  }

  setSlider(candidateId: number, poolId: string, e: Event): void {
    const el = e.target as HTMLInputElement;
    const raw = parseInt(el.value, 10) || 0;
    const current = this.sliders();

    const othersSum = this.round2Candidates()
      .filter(c => c.id !== candidateId)
      .reduce((s, c) => s + (current[c.id]?.[poolId] ?? 0), 0);
    const maxAllowed = 100 - othersSum;
    const final = Math.max(0, Math.min(raw, maxAllowed));

    if (raw > maxAllowed) {
      el.value = String(final);
    }

    this.sliders.update(state => {
      const updated = { ...state };
      updated[candidateId] = { ...updated[candidateId], [poolId]: final };
      return updated;
    });
  }

  setSliderPercent(candidateId: number, poolId: string, raw: number): void {
    const current = this.sliders();
    const othersSum = this.round2Candidates()
      .filter(c => c.id !== candidateId)
      .reduce((s, c) => s + (current[c.id]?.[poolId] ?? 0), 0);
    const maxAllowed = 100 - othersSum;
    const final = Math.max(0, Math.min(raw, maxAllowed));

    this.sliders.update(state => {
      const updated = { ...state };
      updated[candidateId] = { ...updated[candidateId], [poolId]: final };
      return updated;
    });
  }

  getCapturedVotes(candidateId: number, poolId: string): number {
    const pool = this.transferPools().find(p => p.id === poolId);
    if (!pool) return 0;
    return Math.round(pool.votes * this.getSlider(candidateId, poolId) / 100);
  }

  remainingPercent(poolId: string): number {
    const r2 = this.round2Candidates();
    const current = this.sliders();
    const total = r2.reduce((s, c) => s + (current[c.id]?.[poolId] ?? 0), 0);
    return 100 - total;
  }

  resetSliders(): void {
    const r2 = this.round2Candidates();
    const pools = this.transferPools();
    const init: Record<number, Record<string, number>> = {};
    for (const c of r2) {
      init[c.id] = {};
      for (const p of pools) {
        init[c.id][p.id] = 0;
      }
    }
    this.sliders.set(init);
  }

  getProjectedVotes(candidateId: number): number {
    const pools = this.transferPools();
    return pools.reduce((s, p) => s + this.getCapturedVotes(candidateId, p.id), 0);
  }

  readonly totalProjectedExpressed = computed(() =>
    this.round2Candidates().reduce((s, c) => s + this.getProjectedVotes(c.id), 0)
  );

  getProjectedPercent(candidateId: number): number {
    const total = this.totalProjectedExpressed();
    return total > 0 ? (this.getProjectedVotes(candidateId) / total) * 100 : 0;
  }

  readonly projectedWinnerId = computed(() => {
    const r2 = this.round2Candidates();
    if (r2.length === 0) return null;
    let maxVotes = -1;
    let winnerId = r2[0].id;
    for (const c of r2) {
      const v = this.getProjectedVotes(c.id);
      if (v > maxVotes) {
        maxVotes = v;
        winnerId = c.id;
      }
    }
    return winnerId;
  });

  readonly projectedAbstentions = computed(() => {
    const pools = this.transferPools();
    const sliders = this.sliders();
    const r2 = this.round2Candidates();
    let unallocated = 0;
    for (const p of pools) {
      const allocated = r2.reduce((s, c) => s + (sliders[c.id]?.[p.id] ?? 0), 0);
      unallocated += Math.round(p.votes * (100 - allocated) / 100);
    }
    return unallocated;
  });

  readonly projectedAbstentionRate = computed(() => {
    const i = this.inscrits();
    return i > 0 ? (this.projectedAbstentions() / i) * 100 : 0;
  });

  readonly seatDistribution = computed(() => {
    const totalSeats = this.sieges();
    const r2 = this.round2Candidates();
    const result: Record<number, number> = {};

    if (totalSeats <= 0 || r2.length === 0) {
      for (const c of r2) result[c.id] = 0;
      return result;
    }

    const totalExpressed = this.totalProjectedExpressed();
    if (totalExpressed <= 0) {
      for (const c of r2) result[c.id] = 0;
      return result;
    }

    // 1. Prime majoritaire: ceil(totalSeats / 2) → winner
    const winnerId = this.projectedWinnerId();
    const primeMajoritaire = Math.ceil(totalSeats / 2);
    const remainingSeats = totalSeats - primeMajoritaire;

    for (const c of r2) {
      result[c.id] = c.id === winnerId ? primeMajoritaire : 0;
    }

    if (remainingSeats > 0) {
      // 2. Lists admitted to proportional: >= 5% of expressed votes
      const admitted = r2.filter(c =>
        (this.getProjectedVotes(c.id) / totalExpressed) * 100 >= 5
      );
      const admittedVotes = admitted.reduce((s, c) => s + this.getProjectedVotes(c.id), 0);

      if (admitted.length > 0 && admittedVotes > 0) {
        // 3. Electoral quotient = admitted votes / remaining seats
        const quotient = admittedVotes / remainingSeats;

        // 4. Proportional distribution by quotient
        const propSeats: Record<number, number> = {};
        let distributedProp = 0;
        for (const c of admitted) {
          const votes = this.getProjectedVotes(c.id);
          propSeats[c.id] = Math.floor(votes / quotient);
          distributedProp += propSeats[c.id];
        }

        // 5. Plus forte moyenne for leftover seats
        let leftover = remainingSeats - distributedProp;
        while (leftover > 0) {
          let bestId: number | null = null;
          let bestAvg = -1;
          for (const c of admitted) {
            const votes = this.getProjectedVotes(c.id);
            const avg = votes / ((propSeats[c.id] ?? 0) + 1);
            if (avg > bestAvg) {
              bestAvg = avg;
              bestId = c.id;
            }
          }
          if (bestId !== null) {
            propSeats[bestId] = (propSeats[bestId] ?? 0) + 1;
            leftover--;
          } else break;
        }

        for (const c of admitted) {
          result[c.id] += propSeats[c.id] ?? 0;
        }
      }
    }

    return result;
  });

  getSeats(candidateId: number): number {
    return this.seatDistribution()[candidateId] ?? 0;
  }

  readonly seatBreakdown = computed(() => {
    const totalSeats = this.sieges();
    const r2 = this.round2Candidates();
    const totalExpressed = this.totalProjectedExpressed();
    if (totalSeats <= 0 || r2.length === 0 || totalExpressed <= 0) return null;

    const winnerId = this.projectedWinnerId();
    const primeSeats = Math.ceil(totalSeats / 2);
    const remainingSeats = totalSeats - primeSeats;

    // Lists admitted to proportional: >= 5% of expressed votes
    const admittedIds = new Set(
      r2.filter(c => (this.getProjectedVotes(c.id) / totalExpressed) * 100 >= 5).map(c => c.id)
    );
    const admittedVotes = r2
      .filter(c => admittedIds.has(c.id))
      .reduce((s, c) => s + this.getProjectedVotes(c.id), 0);

    // Electoral quotient = admitted votes / remaining seats
    const quotient = remainingSeats > 0 && admittedVotes > 0 ? admittedVotes / remainingSeats : 0;

    const lists: {
      name: string;
      votes: number;
      prime: number;
      proportional: number;
      average: number;
      avgSeat: number;
      total: number;
    }[] = [];

    let distributedProp = 0;
    for (let i = 0; i < r2.length; i++) {
      const c = r2[i];
      const votes = this.getProjectedVotes(c.id);
      const prime = c.id === winnerId ? primeSeats : 0;
      const admitted = admittedIds.has(c.id);
      const prop = admitted && remainingSeats > 0 && quotient > 0 ? Math.floor(votes / quotient) : 0;
      distributedProp += prop;
      lists.push({ name: c.name, votes, prime, proportional: prop, average: 0, avgSeat: 0, total: 0 });
    }

    // Plus forte moyenne for leftover seats
    let leftover = remainingSeats - distributedProp;
    while (leftover > 0) {
      let bestIdx = -1;
      let bestAvg = -1;
      for (let i = 0; i < lists.length; i++) {
        if (!admittedIds.has(r2[i].id)) continue;
        const propTotal = lists[i].proportional + lists[i].avgSeat;
        const avg = lists[i].votes / (propTotal + 1);
        if (avg > bestAvg) {
          bestAvg = avg;
          bestIdx = i;
        }
      }
      if (bestIdx >= 0) {
        lists[bestIdx].avgSeat++;
        leftover--;
      } else break;
    }

    // Compute initial average for display: votes / (quotient_seats + 1)
    for (const l of lists) {
      l.average = l.votes / (l.proportional + 1);
      l.total = l.prime + l.proportional + l.avgSeat;
    }

    return { totalSeats, primeSeats, remainingSeats, quotient, admittedVotes, totalExpressed, lists, winnerName: lists.find((_, i) => r2[i].id === winnerId)?.name ?? '' };
  });

  getR1Percent(r2: Round2CandidateInfo): number {
    const exp = this.exprimes();
    return exp > 0 ? (r2.ownVotes / exp) * 100 : 0;
  }

  // ===== CSV Export =====

  exportCSV(): void {
    const r2 = this.round2Candidates();
    const hasSeats = this.sieges() > 0;
    const headers = ['Candidat', 'Voix T1', '% T1', 'Voix T2 (projeté)', '% T2 (projeté)', 'Evolution'];
    if (hasSeats) headers.push('Sièges');
    const rows = [
      headers.join(';'),
      ...r2.map(c => {
        const cols: (string | number)[] = [
          c.name,
          c.ownVotes,
          this.getR1Percent(c).toFixed(1),
          this.getProjectedVotes(c.id),
          this.getProjectedPercent(c.id).toFixed(1),
          this.getProjectedVotes(c.id) - c.ownVotes,
        ];
        if (hasSeats) cols.push(this.getSeats(c.id));
        return cols.join(';');
      })
    ];

    const blob = new Blob(['\uFEFF' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'simulation-electorale.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
}
