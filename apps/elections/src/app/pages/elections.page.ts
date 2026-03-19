import { Component, computed, effect, inject, signal, PLATFORM_ID } from '@angular/core';
import { DecimalPipe, isPlatformBrowser } from '@angular/common';
import { ThemeService } from '@libs/shared';
import { BureauService } from '../services/bureau.service';
import { ElectionApiService } from '../services/election-api.service';
import { Commune } from '../models/bureau.model';

interface Candidate {
  id: number;
  name: string;
}
import { REGIONS, DEPARTMENTS, getDepartmentEntries } from '../data/departments';

@Component({
  selector: 'app-elections-page',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    @if (bureauService.loading()) {
      <div class="loading-screen">
        <div class="spinner"></div>
        <p>Chargement des bureaux de vote...</p>
      </div>
    } @else if (bureauService.error()) {
      <div class="loading-screen">
        <p class="error-text">{{ bureauService.error() }}</p>
      </div>
    } @else {
      <div class="layout">
        @if (saveError()) {
          <div class="save-error-banner">
            <span>{{ saveError() }}</span>
            <button (click)="dismissError()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        }

        @if (saving()) {
          <div class="save-indicator">Sauvegarde...</div>
        }

        <!-- Mobile toggle -->
        <div class="mobile-toggle">
          <button
            class="mobile-toggle-btn"
            [class.active]="mobilePanel() === 'sidebar'"
            (click)="mobilePanel.set('sidebar')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            Communes
          </button>
          <button
            class="mobile-toggle-btn"
            [class.active]="mobilePanel() === 'main'"
            (click)="mobilePanel.set('main')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 16l4-8 4 4 4-6"/></svg>
            Resultats
          </button>
        </div>

        <!-- Sidebar -->
        <aside class="sidebar" [class.mobile-hidden]="mobilePanel() === 'main'">
          <div class="sidebar-header">
            <h1>Suivi Elections</h1>
            <button class="theme-btn" (click)="theme.toggle()" [attr.aria-label]="'Changer de theme'">
              @if (theme.current() === 'dark') {
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              } @else {
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              }
            </button>
          </div>

          <div class="filters">
            <div class="filter-group">
              <label for="region">Region</label>
              <select id="region" (change)="onRegionChange($event)">
                <option value="">Toutes les regions</option>
                @for (r of regions; track r) {
                  <option [value]="r" [selected]="selectedRegion() === r">{{ r }}</option>
                }
              </select>
            </div>

            <div class="filter-group">
              <label for="dept">Departement</label>
              <select id="dept" (change)="onDepartmentChange($event)">
                <option value="">Tous les departements</option>
                @for (d of filteredDepartments(); track d.code) {
                  <option [value]="d.code" [selected]="selectedDepartment() === d.code">
                    {{ d.code }} - {{ d.name }}
                  </option>
                }
              </select>
            </div>

            <div class="search-wrapper">
              <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                type="text"
                placeholder="Rechercher une commune..."
                [value]="searchQuery()"
                (input)="onSearchInput($event)">
              @if (searchQuery()) {
                <button class="clear-btn" (click)="clearSearch()">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              }
            </div>

            @if (shouldShowCommunes()) {
              <span class="result-count">
                {{ filteredCommunes().length }} commune{{ filteredCommunes().length > 1 ? 's' : '' }}
              </span>
            }
          </div>

          <div class="commune-list">
            @if (!shouldShowCommunes()) {
              <div class="sidebar-hint">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <p>Selectionnez une region, un departement ou recherchez une commune</p>
              </div>
            } @else if (filteredCommunes().length === 0) {
              <div class="sidebar-hint">
                <p>Aucune commune trouvee</p>
              </div>
            } @else {
              @for (c of displayedCommunes(); track c.codeCommune) {
                <button
                  class="commune-item"
                  [class.active]="selectedCommune()?.codeCommune === c.codeCommune"
                  (click)="selectCommune(c)">
                  <span class="commune-name">{{ c.name }}</span>
                  <span class="commune-meta">
                    <span class="commune-cp">{{ c.codePostal }}</span>
                    <span class="commune-count">{{ c.bureauCount }} bureau{{ c.bureauCount > 1 ? 'x' : '' }}</span>
                  </span>
                </button>
              }

              @if (filteredCommunes().length > maxDisplayed) {
                <p class="more-results">
                  et {{ filteredCommunes().length - maxDisplayed }} autres...
                </p>
              }
            }
          </div>
        </aside>

        <!-- Main panel -->
        <main class="main-panel" [class.mobile-hidden]="mobilePanel() === 'sidebar'">
          @if (!selectedCommune()) {
            <div class="empty-state">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 3v18h18"/>
                <path d="M7 16l4-8 4 4 4-6"/>
              </svg>
              <h2>Selectionnez une commune</h2>
              <p>Choisissez une commune dans le panneau de gauche pour afficher ses bureaux de vote et saisir les resultats.</p>
            </div>
          } @else {
            <div class="city-section">
              <div class="city-header">
                <div>
                  <h2>{{ selectedCommune()!.name }}</h2>
                  <div class="city-meta">
                    <span class="badge">{{ selectedCommune()!.departmentCode }} - {{ selectedCommune()!.departmentName }}</span>
                    <span class="badge">{{ selectedCommune()!.region }}</span>
                  </div>
                </div>
                <div class="city-stats">
                  <div class="stat">
                    <span class="stat-value">{{ selectedCommune()!.bureauCount }}</span>
                    <span class="stat-label">bureau{{ selectedCommune()!.bureauCount > 1 ? 'x' : '' }}</span>
                  </div>
                  <div class="stat">
                    <span class="stat-value">{{ getCityTotal() }}</span>
                    <span class="stat-label">votes</span>
                  </div>
                </div>
              </div>

              <div class="candidates-panel">
                <div class="candidates-panel-header">
                  <h3>Candidats</h3>
                  <button class="add-btn" (click)="addCandidate()">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Ajouter
                  </button>
                </div>

                @if (candidates().length === 0) {
                  <p class="candidates-empty">Ajoutez des candidats pour saisir les resultats</p>
                } @else {
                  <div class="candidates-list">
                    @for (c of candidates(); track c.id; let i = $index, first = $first, last = $last) {
                      <div class="candidate-row">
                        <div class="candidate-reorder">
                          <button
                            class="reorder-btn"
                            [disabled]="first"
                            (click)="moveCandidate(i, -1)"
                            aria-label="Monter">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 15l-6-6-6 6"/></svg>
                          </button>
                          <button
                            class="reorder-btn"
                            [disabled]="last"
                            (click)="moveCandidate(i, 1)"
                            aria-label="Descendre">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
                          </button>
                        </div>
                        <span class="candidate-index">{{ i + 1 }}</span>
                        <input
                          type="text"
                          class="candidate-name-input"
                          placeholder="Nom du candidat"
                          [value]="c.name"
                          (input)="renameCandidate(c.id, $event)">
                        <button class="remove-btn" (click)="removeCandidate(c.id)" aria-label="Supprimer">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </div>
                    }
                  </div>
                }
              </div>

              <!-- Tabs -->
              <div class="tabs">
                <button
                  class="tab"
                  [class.tab-active]="activeTab() === 'city'"
                  (click)="activeTab.set('city')">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 16l4-8 4 4 4-6"/></svg>
                  Resultats commune
                </button>
                <button
                  class="tab"
                  [class.tab-active]="activeTab() === 'bureaux'"
                  (click)="activeTab.set('bureaux')">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                  Bureaux de vote
                </button>
              </div>

              <!-- Tab 1: City results -->
              @if (activeTab() === 'city') {
                @if (candidates().length === 0) {
                  <div class="tab-empty">
                    <p>Ajoutez des candidats pour voir les resultats de la commune.</p>
                  </div>
                } @else {
                  <div class="dashboard">
                    <div class="dashboard-header">
                      <h3>Dashboard - {{ selectedCommune()!.name }}</h3>
                      <span class="total-badge">{{ getCityTotal() }} votes au total</span>
                    </div>
                    <div class="dashboard-bars">
                      @for (c of candidates(); track c.id) {
                        <div class="dash-row">
                          <span class="dash-label" [class.dash-leader]="getCityLeader() === c.id">
                            {{ c.name || 'Candidat ' + (candidatePosition(c.id) + 1) }}
                            @if (getCityLeader() === c.id) {
                              <span class="leader-tag">En tete</span>
                            }
                          </span>
                          <div class="dash-bar-track">
                            <div
                              class="dash-bar-fill"
                              [class.dash-bar-leader]="getCityLeader() === c.id"
                              [style.width.%]="getCityCandidatePercent(c.id)">
                            </div>
                          </div>
                          <span class="dash-value">
                            {{ getCityCandidateVotes(c.id) }}
                            ({{ getCityCandidatePercent(c.id) | number:'1.1-1' }}%)
                          </span>
                        </div>
                      }
                      <div class="dash-row dash-row-muted">
                        <span class="dash-label">Blancs</span>
                        <div class="dash-bar-track">
                          <div class="dash-bar-fill dash-bar-blancs" [style.width.%]="getCityBlancsPercent()"></div>
                        </div>
                        <span class="dash-value">
                          {{ getCityBlancsTotal() }}
                          ({{ getCityBlancsPercent() | number:'1.1-1' }}%)
                        </span>
                      </div>
                      <div class="dash-row dash-row-muted">
                        <span class="dash-label">Nuls</span>
                        <div class="dash-bar-track">
                          <div class="dash-bar-fill dash-bar-nuls" [style.width.%]="getCityNulsPercent()"></div>
                        </div>
                        <span class="dash-value">
                          {{ getCityNulsTotal() }}
                          ({{ getCityNulsPercent() | number:'1.1-1' }}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- Per-bureau summary table -->
                  <div class="bureau-summary">
                    <h3>Detail par bureau</h3>
                    <div class="summary-table-wrapper">
                      <table class="summary-table">
                        <thead>
                          <tr>
                            <th>Bureau</th>
                            @for (c of candidates(); track c.id) {
                              <th>{{ c.name || 'Candidat ' + (candidatePosition(c.id) + 1) }}</th>
                            }
                            <th>Blancs</th>
                            <th>Nuls</th>
                            <th>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          @for (b of selectedBureaux(); track b.id) {
                            <tr>
                              <td class="bureau-cell">{{ b.code }} - {{ titleCase(b.libelle) }}</td>
                              @for (c of candidates(); track c.id) {
                                <td [class.leader-cell]="getBureauLeader(b.id) === c.id">
                                  {{ getVotes(b.id, c.id) }}
                                  <span class="cell-pct">({{ getBureauCandidatePercent(b.id, c.id) | number:'1.0-0' }}%)</span>
                                </td>
                              }
                              <td class="muted-cell">{{ getBlancs(b.id) }}</td>
                              <td class="muted-cell">{{ getNuls(b.id) }}</td>
                              <td class="total-cell">{{ getTotal(b.id) }}</td>
                            </tr>
                          }
                        </tbody>
                        <tfoot>
                          <tr>
                            <td class="bureau-cell">Total</td>
                            @for (c of candidates(); track c.id) {
                              <td [class.leader-cell]="getCityLeader() === c.id">
                                <strong>{{ getCityCandidateVotes(c.id) }}</strong>
                                <span class="cell-pct">({{ getCityCandidatePercent(c.id) | number:'1.0-0' }}%)</span>
                              </td>
                            }
                            <td class="muted-cell"><strong>{{ getCityBlancsTotal() }}</strong></td>
                            <td class="muted-cell"><strong>{{ getCityNulsTotal() }}</strong></td>
                            <td class="total-cell"><strong>{{ getCityTotal() }}</strong></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                }
              }

              <!-- Tab 2: Bureaux results -->
              @if (activeTab() === 'bureaux') {
                <div class="bureaux-grid">
                  @for (b of selectedBureaux(); track b.id) {
                    <div class="bureau-card">
                      <div class="bureau-header">
                        <div class="bureau-title">
                          <span class="bureau-number">{{ b.code }}</span>
                          <h3>{{ titleCase(b.libelle) }}</h3>
                        </div>
                        <span class="bureau-address">
                          @if (b.numVoie.trim()) { {{ b.numVoie }} }
                          {{ b.voie }}, {{ b.codePostal }}
                        </span>
                      </div>

                      @if (candidates().length > 0) {
                        <div class="bureau-pct-section">
                          @for (c of candidates(); track c.id) {
                            <div class="bureau-pct-row">
                              <span class="bureau-pct-label" [class.dash-leader]="getBureauLeader(b.id) === c.id">
                                {{ c.name || 'Candidat ' + (candidatePosition(c.id) + 1) }}
                              </span>
                              <div class="bureau-pct-track">
                                <div
                                  class="dash-bar-fill"
                                  [class.dash-bar-leader]="getBureauLeader(b.id) === c.id"
                                  [style.width.%]="getBureauCandidatePercent(b.id, c.id)">
                                </div>
                              </div>
                              <span class="bureau-pct-value">{{ getBureauCandidatePercent(b.id, c.id) | number:'1.1-1' }}%</span>
                            </div>
                          }
                        </div>

                        <div class="results-section">
                          <div class="results-header">
                            <h4>Resultats</h4>
                            <span class="total-badge">
                              Total : {{ getTotal(b.id) }} voix
                            </span>
                          </div>

                          @for (c of candidates(); track c.id) {
                            <div class="result-row">
                              <span class="candidate-label">{{ c.name || 'Candidat ' + (candidatePosition(c.id) + 1) }}</span>
                              <div class="vote-controls">
                                <button
                                  class="incr-btn decr"
                                  (click)="decrementVotes(b.id, c.id)"
                                  [disabled]="getVotes(b.id, c.id) === 0">
                                  -
                                </button>
                                <input
                                  type="number"
                                  min="0"
                                  class="vote-input"
                                  placeholder="0"
                                  [value]="getVotes(b.id, c.id) || ''"
                                  (input)="updateVotes(b.id, c.id, $event)">
                                <button
                                  class="incr-btn incr"
                                  (click)="incrementVotes(b.id, c.id)">
                                  +
                                </button>
                                <span class="vote-suffix">voix</span>
                              </div>
                            </div>
                          }

                          <div class="result-row result-row-special">
                            <span class="candidate-label special-label">Blancs</span>
                            <div class="vote-controls">
                              <button
                                class="incr-btn decr"
                                (click)="decrementBlancs(b.id)"
                                [disabled]="getBlancs(b.id) === 0">
                                -
                              </button>
                              <input
                                type="number"
                                min="0"
                                class="vote-input"
                                placeholder="0"
                                [value]="getBlancs(b.id) || ''"
                                (input)="updateBlancs(b.id, $event)">
                              <button
                                class="incr-btn incr"
                                (click)="incrementBlancs(b.id)">
                                +
                              </button>
                              <span class="vote-suffix">voix</span>
                            </div>
                          </div>

                          <div class="result-row result-row-special">
                            <span class="candidate-label special-label">Nuls</span>
                            <div class="vote-controls">
                              <button
                                class="incr-btn decr"
                                (click)="decrementNuls(b.id)"
                                [disabled]="getNuls(b.id) === 0">
                                -
                              </button>
                              <input
                                type="number"
                                min="0"
                                class="vote-input"
                                placeholder="0"
                                [value]="getNuls(b.id) || ''"
                                (input)="updateNuls(b.id, $event)">
                              <button
                                class="incr-btn incr"
                                (click)="incrementNuls(b.id)">
                                +
                              </button>
                              <span class="vote-suffix">voix</span>
                            </div>
                          </div>
                        </div>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          }
        </main>
      </div>
    }
  `,
  styles: `
    :host {
      display: block;
      height: 100vh;
      overflow: hidden;
    }

    /* Loading */
    .loading-screen {
      height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 20px;
      color: var(--text-secondary);
    }

    .spinner {
      width: 36px;
      height: 36px;
      border: 3px solid var(--border);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error-text {
      color: #ef4444;
    }

    /* Layout */
    .layout {
      display: grid;
      grid-template-columns: 400px 1fr;
      height: 100vh;
    }

    /* Sidebar */
    .sidebar {
      background: var(--bg-secondary);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .sidebar-header {
      padding: 20px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--border);
    }

    .sidebar-header h1 {
      font-size: var(--font-xl);
      font-weight: 700;
      background: linear-gradient(135deg, var(--text) 40%, var(--primary-light));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .theme-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: var(--radius-sm);
      color: var(--text-secondary);
      transition: background var(--transition-fast), color var(--transition-fast);
    }

    .theme-btn:hover {
      background: var(--bg-card);
      color: var(--text);
    }

    /* Filters */
    .filters {
      padding: 16px 24px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      border-bottom: 1px solid var(--border);
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .filter-group label {
      font-size: var(--font-xs);
      font-weight: 500;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    select {
      width: 100%;
      background: var(--bg-card);
      border: 1px solid var(--border);
      color: var(--text);
      border-radius: var(--radius-sm);
      padding: 8px 32px 8px 12px;
      font-size: var(--font-sm);
      font-family: inherit;
      outline: none;
      cursor: pointer;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236a6a7a' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 10px center;
      transition: border-color var(--transition-fast);
    }

    select:focus {
      border-color: var(--primary);
    }

    .search-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-icon {
      position: absolute;
      left: 12px;
      color: var(--text-muted);
      pointer-events: none;
    }

    .search-wrapper input {
      width: 100%;
      background: var(--bg-card);
      border: 1px solid var(--border);
      color: var(--text);
      border-radius: var(--radius-sm);
      padding: 8px 36px 8px 36px;
      font-size: var(--font-sm);
      font-family: inherit;
      outline: none;
      transition: border-color var(--transition-fast);
    }

    .search-wrapper input:focus {
      border-color: var(--primary);
    }

    .search-wrapper input::placeholder {
      color: var(--text-muted);
    }

    .clear-btn {
      position: absolute;
      right: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border-radius: var(--radius-sm);
      color: var(--text-muted);
      transition: color var(--transition-fast), background var(--transition-fast);
    }

    .clear-btn:hover {
      color: var(--text);
      background: var(--surface);
    }

    .result-count {
      font-size: var(--font-xs);
      color: var(--text-muted);
    }

    /* Commune list */
    .commune-list {
      flex: 1;
      overflow-y: auto;
      padding: 8px;
    }

    .sidebar-hint {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 48px 24px;
      text-align: center;
      color: var(--text-muted);
      font-size: var(--font-sm);
    }

    .commune-item {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 2px;
      text-align: left;
      padding: 10px 16px;
      border-radius: var(--radius-sm);
      transition: background var(--transition-fast);
      color: var(--text);
      border: 1px solid transparent;
    }

    .commune-item:hover {
      background: var(--bg-card-hover);
    }

    .commune-item.active {
      background: var(--primary-glow);
      border-color: var(--primary);
    }

    .commune-name {
      font-size: var(--font-sm);
      font-weight: 500;
    }

    .commune-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: var(--font-xs);
      color: var(--text-muted);
    }

    .commune-count {
      color: var(--primary-light);
    }

    .more-results {
      text-align: center;
      padding: 12px;
      font-size: var(--font-xs);
      color: var(--text-muted);
    }

    /* Main panel */
    .main-panel {
      overflow-y: auto;
      background: var(--bg);
    }

    .empty-state {
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      color: var(--text-muted);
      text-align: center;
      padding: 48px;
    }

    .empty-state h2 {
      color: var(--text-secondary);
      font-size: var(--font-lg);
      font-weight: 600;
    }

    .empty-state p {
      max-width: 360px;
      font-size: var(--font-sm);
      line-height: 1.6;
    }

    /* City section */
    .city-section {
      padding: 32px;
    }

    .city-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 28px;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--border);
    }

    .city-header h2 {
      font-size: var(--font-2xl);
      font-weight: 700;
      margin-bottom: 8px;
    }

    .city-meta {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      padding: 3px 10px;
      border-radius: var(--radius-full);
      font-size: var(--font-xs);
      font-weight: 500;
      background: var(--bg-card);
      border: 1px solid var(--border);
      color: var(--text-secondary);
    }

    .city-stats {
      display: flex;
      gap: 16px;
    }

    .stat {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 8px 16px;
      background: var(--primary-glow);
      border: 1px solid var(--primary);
      border-radius: var(--radius-md);
    }

    .stat-value {
      font-size: var(--font-xl);
      font-weight: 700;
      color: var(--primary-light);
    }

    .stat-label {
      font-size: var(--font-xs);
      color: var(--text-muted);
    }

    /* Candidates panel */
    .candidates-panel {
      margin-bottom: 24px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 16px 20px;
    }

    .candidates-panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .candidates-panel-header h3 {
      font-size: var(--font-base);
      font-weight: 600;
    }

    .candidates-empty {
      font-size: var(--font-sm);
      color: var(--text-muted);
      padding: 8px 0;
    }

    .candidates-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .candidate-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 0;
    }

    .candidate-reorder {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .reorder-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 16px;
      border-radius: 3px;
      color: var(--text-muted);
      transition: color var(--transition-fast), background var(--transition-fast);
    }

    .reorder-btn:not(:disabled):hover {
      color: var(--text);
      background: var(--surface);
    }

    .reorder-btn:disabled {
      opacity: 0.25;
      cursor: default;
    }

    .candidate-index {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 22px;
      height: 22px;
      border-radius: var(--radius-sm);
      background: var(--primary-glow);
      color: var(--primary-light);
      font-size: var(--font-xs);
      font-weight: 700;
    }

    .candidate-name-input {
      flex: 1;
      background: var(--bg);
      border: 1px solid var(--border);
      color: var(--text);
      border-radius: var(--radius-sm);
      padding: 6px 10px;
      font-size: var(--font-sm);
      font-family: inherit;
      outline: none;
      transition: border-color var(--transition-fast);
    }

    .candidate-name-input:focus {
      border-color: var(--primary);
    }

    .candidate-name-input::placeholder {
      color: var(--text-muted);
    }

    /* Dashboard */
    .dashboard {
      margin-bottom: 24px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 20px 24px;
    }

    .dashboard-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }

    .dashboard-header h3 {
      font-size: var(--font-base);
      font-weight: 600;
    }

    .dashboard-bars {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .dash-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .dash-row-muted {
      opacity: 0.65;
    }

    .dash-label {
      min-width: 160px;
      font-size: var(--font-sm);
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .dash-label.dash-leader {
      color: var(--primary-light);
      font-weight: 700;
    }

    .leader-tag {
      font-size: 10px;
      padding: 2px 8px;
      background: var(--primary-glow-strong);
      color: var(--primary-light);
      border-radius: var(--radius-full);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .dash-bar-track {
      flex: 1;
      height: 22px;
      background: var(--surface);
      border-radius: var(--radius-sm);
      overflow: hidden;
    }

    .dash-bar-fill {
      height: 100%;
      background: var(--primary);
      border-radius: var(--radius-sm);
      transition: width 0.4s ease;
    }

    .dash-bar-fill.dash-bar-leader {
      background: linear-gradient(135deg, var(--primary-light), var(--primary));
    }

    .dash-bar-fill.dash-bar-blancs {
      background: var(--text-muted);
    }

    .dash-bar-fill.dash-bar-nuls {
      background: #f59e0b;
    }

    .dash-value {
      min-width: 110px;
      text-align: right;
      font-size: var(--font-sm);
      color: var(--text-secondary);
      font-variant-numeric: tabular-nums;
    }

    /* Bureau percentage section */
    .bureau-pct-section {
      margin-top: 14px;
      padding: 10px 0;
      border-top: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .bureau-pct-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .bureau-pct-label {
      min-width: 110px;
      font-size: var(--font-xs);
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .bureau-pct-track {
      flex: 1;
      height: 12px;
      background: var(--surface);
      border-radius: var(--radius-sm);
      overflow: hidden;
    }

    .bureau-pct-value {
      min-width: 48px;
      text-align: right;
      font-size: var(--font-xs);
      color: var(--text-secondary);
      font-variant-numeric: tabular-nums;
    }

    /* Bureau cards */
    .bureaux-grid {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .bureau-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 20px;
      transition: border-color var(--transition-fast);
    }

    .bureau-card:hover {
      border-color: var(--border-light);
    }

    .bureau-header {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .bureau-title {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .bureau-number {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 28px;
      height: 28px;
      padding: 0 8px;
      border-radius: var(--radius-sm);
      background: var(--primary-glow);
      color: var(--primary-light);
      font-size: var(--font-xs);
      font-weight: 700;
    }

    .bureau-header h3 {
      font-size: var(--font-base);
      font-weight: 600;
    }

    .bureau-address {
      font-size: var(--font-sm);
      color: var(--text-muted);
      margin-left: 38px;
    }

    /* Results */
    .results-section {
      margin-top: 12px;
      padding-top: 14px;
      border-top: 1px solid var(--border);
    }

    .results-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .results-header h4 {
      font-size: var(--font-sm);
      font-weight: 600;
      color: var(--text-secondary);
    }

    .total-badge {
      font-size: var(--font-xs);
      font-weight: 600;
      color: var(--primary-light);
      background: var(--primary-glow);
      padding: 3px 10px;
      border-radius: var(--radius-full);
    }

    .result-row {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 12px;
      align-items: center;
      margin-bottom: 8px;
    }

    .result-row-special {
      padding-top: 8px;
      border-top: 1px dashed var(--border);
    }

    .candidate-label {
      font-size: var(--font-sm);
      font-weight: 500;
      color: var(--text-secondary);
    }

    .special-label {
      color: var(--text-muted);
      font-style: italic;
    }

    .vote-controls {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .incr-btn {
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--font-lg);
      font-weight: 700;
      border-radius: var(--radius-sm);
      transition: all var(--transition-fast);
      color: var(--text);
      flex-shrink: 0;
    }

    .incr-btn:disabled {
      opacity: 0.25;
      cursor: not-allowed;
    }

    .incr-btn.decr {
      background: rgba(239, 68, 68, 0.08);
      border: 1px solid rgba(239, 68, 68, 0.2);
    }

    .incr-btn.decr:hover:not(:disabled) {
      background: #ef4444;
      color: #fff;
    }

    .incr-btn.incr {
      background: rgba(34, 197, 94, 0.08);
      border: 1px solid rgba(34, 197, 94, 0.2);
    }

    .incr-btn.incr:hover:not(:disabled) {
      background: #22c55e;
      color: #fff;
    }

    .vote-input {
      width: 70px;
      background: var(--bg);
      border: 1px solid var(--border);
      color: var(--text);
      border-radius: var(--radius-sm);
      padding: 6px 10px;
      font-size: var(--font-sm);
      font-family: inherit;
      outline: none;
      text-align: center;
      transition: border-color var(--transition-fast);
      -moz-appearance: textfield;
    }

    .vote-input::-webkit-inner-spin-button,
    .vote-input::-webkit-outer-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    .vote-input:focus {
      border-color: var(--primary);
    }

    .vote-suffix {
      font-size: var(--font-xs);
      color: var(--text-muted);
      white-space: nowrap;
    }

    .remove-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: var(--radius-sm);
      color: var(--text-muted);
      transition: color var(--transition-fast), background var(--transition-fast);
    }

    .remove-btn:hover {
      color: #ef4444;
      background: rgba(239, 68, 68, 0.1);
    }

    .add-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-top: 4px;
      padding: 6px 12px;
      border-radius: var(--radius-sm);
      font-size: var(--font-sm);
      color: var(--primary);
      transition: background var(--transition-fast);
    }

    .add-btn:hover {
      background: var(--primary-glow);
    }

    /* Tabs */
    .tabs {
      display: flex;
      gap: 4px;
      margin-bottom: 24px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 4px;
    }

    .tab {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px 16px;
      border-radius: var(--radius-md);
      font-size: var(--font-sm);
      font-weight: 500;
      color: var(--text-muted);
      transition: all var(--transition-fast);
    }

    .tab:hover {
      color: var(--text-secondary);
      background: var(--surface);
    }

    .tab-active {
      background: var(--primary-glow);
      color: var(--primary-light);
      font-weight: 600;
      border: 1px solid var(--primary);
    }

    .tab-active:hover {
      background: var(--primary-glow);
      color: var(--primary-light);
    }

    .tab-empty {
      text-align: center;
      padding: 48px 24px;
      color: var(--text-muted);
      font-size: var(--font-sm);
    }

    /* Bureau summary table */
    .bureau-summary {
      margin-top: 24px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 20px 24px;
    }

    .bureau-summary h3 {
      font-size: var(--font-base);
      font-weight: 600;
      margin-bottom: 16px;
    }

    .summary-table-wrapper {
      overflow-x: auto;
    }

    .summary-table {
      width: 100%;
      border-collapse: collapse;
      font-size: var(--font-sm);
    }

    .summary-table th,
    .summary-table td {
      padding: 8px 12px;
      text-align: right;
      border-bottom: 1px solid var(--border);
      white-space: nowrap;
    }

    .summary-table th {
      font-weight: 600;
      color: var(--text-secondary);
      font-size: var(--font-xs);
      text-transform: uppercase;
      letter-spacing: 0.03em;
      background: var(--surface);
    }

    .summary-table th:first-child,
    .summary-table td:first-child {
      text-align: left;
    }

    .summary-table tbody tr:hover {
      background: var(--bg-card-hover);
    }

    .summary-table tfoot td {
      border-top: 2px solid var(--border-light);
      border-bottom: none;
      font-weight: 600;
    }

    .bureau-cell {
      font-weight: 600;
      color: var(--primary-light);
    }

    .leader-cell {
      color: var(--primary-light);
      font-weight: 600;
    }

    .muted-cell {
      color: var(--text-muted);
    }

    .total-cell {
      font-weight: 600;
    }

    .cell-pct {
      font-size: var(--font-xs);
      color: var(--text-muted);
      margin-left: 4px;
    }

    /* Save indicator & error banner */
    .save-indicator {
      position: fixed;
      top: 12px;
      right: 12px;
      z-index: 100;
      padding: 6px 14px;
      border-radius: var(--radius-full);
      background: var(--primary-glow-strong);
      color: var(--primary-light);
      font-size: var(--font-xs);
      font-weight: 500;
      pointer-events: none;
    }

    .save-error-banner {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 200;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 10px 16px;
      background: #ef4444;
      color: #fff;
      font-size: var(--font-sm);
      font-weight: 500;
    }

    .save-error-banner button {
      color: #fff;
      opacity: 0.8;
      display: flex;
    }

    .save-error-banner button:hover {
      opacity: 1;
    }

    /* Mobile toggle (hidden on desktop) */
    .mobile-toggle {
      display: none;
    }

    /* Responsive */
    @media (max-width: 900px) {
      :host {
        height: auto;
        overflow: auto;
      }

      .layout {
        display: flex;
        flex-direction: column;
        height: 100vh;
      }

      .mobile-toggle {
        display: flex;
        gap: 4px;
        padding: 8px;
        background: var(--bg-secondary);
        border-bottom: 1px solid var(--border);
        flex-shrink: 0;
      }

      .mobile-toggle-btn {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 10px 12px;
        border-radius: var(--radius-md);
        font-size: var(--font-sm);
        font-weight: 500;
        color: var(--text-muted);
        transition: all var(--transition-fast);
      }

      .mobile-toggle-btn:hover {
        color: var(--text-secondary);
        background: var(--surface);
      }

      .mobile-toggle-btn.active {
        background: var(--primary-glow);
        color: var(--primary-light);
        font-weight: 600;
        border: 1px solid var(--primary);
      }

      .mobile-hidden {
        display: none !important;
      }

      .sidebar {
        flex: 1;
        max-height: none;
        border-right: none;
        overflow-y: auto;
      }

      .main-panel {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
      }

      .city-section {
        padding: 16px;
      }

      .city-header {
        flex-direction: column;
        gap: 12px;
      }

      .city-stats {
        gap: 8px;
      }

      .dash-label {
        min-width: 80px;
        font-size: var(--font-xs);
      }

      .dash-value {
        min-width: 70px;
        font-size: var(--font-xs);
      }

      .dash-row {
        gap: 8px;
      }

      .result-row {
        grid-template-columns: 1fr;
        gap: 6px;
      }

      .bureau-card {
        padding: 14px;
      }

      .tabs {
        flex-direction: column;
      }

      .candidates-panel {
        padding: 14px 16px;
      }

      .candidate-row {
        flex-wrap: wrap;
      }

      .candidate-name-input {
        min-width: 0;
      }

      .vote-controls {
        width: 100%;
        justify-content: flex-end;
      }
    }

    @media (max-width: 480px) {
      .sidebar-header h1 {
        font-size: var(--font-base);
      }

      .filters {
        padding: 12px 16px;
        gap: 8px;
      }

      .city-section {
        padding: 12px;
      }

      .dashboard {
        padding: 14px 16px;
      }

      .bureau-summary {
        padding: 14px 16px;
      }

      .summary-table th,
      .summary-table td {
        padding: 6px 8px;
        font-size: var(--font-xs);
      }
    }
  `,
})
export class ElectionsPage {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly api = inject(ElectionApiService);

  protected readonly theme = inject(ThemeService);
  protected readonly bureauService = inject(BureauService);

  protected readonly regions = REGIONS;
  private readonly allDepartments = getDepartmentEntries();
  protected readonly maxDisplayed = 50;

  protected readonly selectedRegion = signal<string | null>(null);
  protected readonly selectedDepartment = signal<string | null>(null);
  protected readonly searchQuery = signal('');
  protected readonly selectedCommune = signal<Commune | null>(null);
  protected readonly candidates = signal<Candidate[]>([]);
  protected readonly votes = signal(new Map<string, Map<number, number>>());
  protected readonly blancs = signal(new Map<string, number>());
  protected readonly nuls = signal(new Map<string, number>());
  protected readonly activeTab = signal<'city' | 'bureaux'>('city');
  protected readonly mobilePanel = signal<'sidebar' | 'main'>('sidebar');
  protected readonly saving = signal(false);
  protected readonly saveError = signal<string | null>(null);

  private readonly versions = new Map<string, number>();
  private readonly saveTimers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor() {
    if (this.isBrowser) {
      this.loadCandidatesFromApi();
    }
  }

  // --- API loading ---

  private async loadCandidatesFromApi(): Promise<void> {
    try {
      const apiCandidates = await this.api.getCandidates();
      this.candidates.set(
        apiCandidates.map(c => ({ id: c.id, name: c.name }))
      );
    } catch {
      // API not available yet — start with empty
    }
  }

  private async loadVotesForBureaux(bureauIds: string[]): Promise<void> {
    if (bureauIds.length === 0) return;
    try {
      const data = await this.api.getBulkVotes(bureauIds);
      const newVotes = new Map(this.votes());
      const newBlancs = new Map(this.blancs());
      const newNuls = new Map(this.nuls());

      for (const [bureauId, bv] of Object.entries(data)) {
        const candidateVotes = new Map<number, number>();
        for (const [cid, count] of Object.entries(bv.votes)) {
          candidateVotes.set(Number(cid), count as number);
        }
        newVotes.set(bureauId, candidateVotes);
        newBlancs.set(bureauId, bv.blancs);
        newNuls.set(bureauId, bv.nuls);
        this.versions.set(bureauId, bv.version);
      }

      this.votes.set(newVotes);
      this.blancs.set(newBlancs);
      this.nuls.set(newNuls);
    } catch {
      // Silently fail — data will be empty
    }
  }

  private scheduleSave(bureauId: string): void {
    const existing = this.saveTimers.get(bureauId);
    if (existing) clearTimeout(existing);

    this.saveTimers.set(bureauId, setTimeout(() => {
      this.saveTimers.delete(bureauId);
      this.saveBureauToApi(bureauId);
    }, 500));
  }

  private async saveBureauToApi(bureauId: string): Promise<void> {
    this.saving.set(true);
    this.saveError.set(null);

    const candidateVotes: Record<number, number> = {};
    const bv = this.votes().get(bureauId);
    if (bv) {
      for (const [cid, count] of bv) {
        candidateVotes[cid] = count;
      }
    }

    try {
      const result = await this.api.saveBureauVotes(bureauId, {
        votes: candidateVotes,
        blancs: this.getBlancs(bureauId),
        nuls: this.getNuls(bureauId),
        version: this.versions.get(bureauId) ?? 0,
      });
      this.versions.set(bureauId, result.version);
    } catch (e: any) {
      if (e.status === 409) {
        this.saveError.set('Conflit : un autre utilisateur a modifie ces donnees. Rechargez la page.');
      } else {
        this.saveError.set('Erreur de sauvegarde');
      }
    } finally {
      this.saving.set(false);
    }
  }

  // --- Computed ---

  protected readonly filteredDepartments = computed(() => {
    const region = this.selectedRegion();
    if (!region) return this.allDepartments;
    return this.allDepartments.filter(d => d.region === region);
  });

  protected readonly shouldShowCommunes = computed(() =>
    !!this.selectedRegion() || !!this.selectedDepartment() || this.searchQuery().length >= 2
  );

  protected readonly filteredCommunes = computed(() => {
    if (!this.shouldShowCommunes()) return [];

    const communes = this.bureauService.communes();
    const region = this.selectedRegion();
    const dept = this.selectedDepartment();
    const query = this.searchQuery().toLowerCase().trim();

    let filtered = communes;

    if (region) {
      filtered = filtered.filter(c => c.region === region);
    }
    if (dept) {
      filtered = filtered.filter(c => c.departmentCode === dept);
    }
    if (query.length >= 2) {
      filtered = filtered.filter(
        c =>
          c.name.toLowerCase().includes(query) ||
          c.codePostal.includes(query) ||
          c.codeCommune.includes(query)
      );
    }

    return filtered;
  });

  protected readonly displayedCommunes = computed(() =>
    this.filteredCommunes().slice(0, this.maxDisplayed)
  );

  protected readonly selectedBureaux = computed(() => {
    const commune = this.selectedCommune();
    if (!commune) return [];
    return this.bureauService.getBureaux(commune.codeCommune);
  });

  // --- UI actions ---

  protected onRegionChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value || null;
    this.selectedRegion.set(value);

    if (value && this.selectedDepartment()) {
      const dept = DEPARTMENTS[this.selectedDepartment()!];
      if (dept && dept[1] !== value) {
        this.selectedDepartment.set(null);
      }
    }
    this.selectedCommune.set(null);
  }

  protected onDepartmentChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value || null;
    this.selectedDepartment.set(value);

    if (value && !this.selectedRegion()) {
      const dept = DEPARTMENTS[value];
      if (dept) this.selectedRegion.set(dept[1]);
    }
    this.selectedCommune.set(null);
  }

  protected onSearchInput(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  protected clearSearch(): void {
    this.searchQuery.set('');
  }

  protected selectCommune(commune: Commune): void {
    this.selectedCommune.set(commune);
    this.activeTab.set('city');
    this.mobilePanel.set('main');

    // Load votes for this commune's bureaux from API
    const bureaux = this.bureauService.getBureaux(commune.codeCommune);
    this.loadVotesForBureaux(bureaux.map(b => b.id));
  }

  protected titleCase(str: string): string {
    return str.replace(/\b\w/g, c => c.toUpperCase());
  }

  // --- Candidates (API-backed) ---

  protected async addCandidate(): Promise<void> {
    try {
      const sortOrder = this.candidates().length;
      const created = await this.api.createCandidate('', sortOrder);
      this.candidates.update(list => [...list, { id: created.id, name: created.name }]);
    } catch {
      this.saveError.set('Erreur lors de l\'ajout du candidat');
    }
  }

  protected async removeCandidate(candidateId: number): Promise<void> {
    try {
      await this.api.deleteCandidate(candidateId);
      this.candidates.update(list => list.filter(c => c.id !== candidateId));
      this.votes.update(m => {
        const updated = new Map(m);
        for (const [bureauId, bv] of updated) {
          const copy = new Map(bv);
          copy.delete(candidateId);
          updated.set(bureauId, copy);
        }
        return updated;
      });
    } catch {
      this.saveError.set('Erreur lors de la suppression du candidat');
    }
  }

  private renameSaveTimer: ReturnType<typeof setTimeout> | null = null;

  protected renameCandidate(candidateId: number, event: Event): void {
    const name = (event.target as HTMLInputElement).value;
    this.candidates.update(list =>
      list.map(c => (c.id === candidateId ? { ...c, name } : c))
    );

    // Debounce API call
    if (this.renameSaveTimer) clearTimeout(this.renameSaveTimer);
    this.renameSaveTimer = setTimeout(() => {
      this.api.updateCandidate(candidateId, { name }).catch(() => {});
    }, 500);
  }

  protected async moveCandidate(index: number, direction: -1 | 1): Promise<void> {
    this.candidates.update(list => {
      const arr = [...list];
      const target = index + direction;
      [arr[index], arr[target]] = [arr[target], arr[index]];
      return arr;
    });

    // Persist new order
    const orderedIds = this.candidates().map(c => c.id);
    try {
      await this.api.reorderCandidates(orderedIds);
    } catch {
      // Reorder failed silently — local state is still updated
    }
  }

  protected candidatePosition(candidateId: number): number {
    return this.candidates().findIndex(c => c.id === candidateId);
  }

  // --- Votes ---

  protected getVotes(bureauId: string, candidateId: number): number {
    return this.votes().get(bureauId)?.get(candidateId) ?? 0;
  }

  protected updateVotes(bureauId: string, candidateId: number, event: Event): void {
    const value = Math.max(0, parseInt((event.target as HTMLInputElement).value, 10) || 0);
    this.setVotes(bureauId, candidateId, value);
  }

  protected incrementVotes(bureauId: string, candidateId: number): void {
    this.setVotes(bureauId, candidateId, this.getVotes(bureauId, candidateId) + 1);
  }

  protected decrementVotes(bureauId: string, candidateId: number): void {
    const current = this.getVotes(bureauId, candidateId);
    if (current > 0) this.setVotes(bureauId, candidateId, current - 1);
  }

  private setVotes(bureauId: string, candidateId: number, value: number): void {
    this.votes.update(m => {
      const updated = new Map(m);
      const bv = new Map(updated.get(bureauId) ?? []);
      bv.set(candidateId, value);
      updated.set(bureauId, bv);
      return updated;
    });
    this.scheduleSave(bureauId);
  }

  // --- Blancs ---

  protected getBlancs(bureauId: string): number {
    return this.blancs().get(bureauId) ?? 0;
  }

  protected updateBlancs(bureauId: string, event: Event): void {
    const value = Math.max(0, parseInt((event.target as HTMLInputElement).value, 10) || 0);
    this.blancs.update(m => new Map(m).set(bureauId, value));
    this.scheduleSave(bureauId);
  }

  protected incrementBlancs(bureauId: string): void {
    this.blancs.update(m => new Map(m).set(bureauId, this.getBlancs(bureauId) + 1));
    this.scheduleSave(bureauId);
  }

  protected decrementBlancs(bureauId: string): void {
    const current = this.getBlancs(bureauId);
    if (current > 0) {
      this.blancs.update(m => new Map(m).set(bureauId, current - 1));
      this.scheduleSave(bureauId);
    }
  }

  // --- Nuls ---

  protected getNuls(bureauId: string): number {
    return this.nuls().get(bureauId) ?? 0;
  }

  protected updateNuls(bureauId: string, event: Event): void {
    const value = Math.max(0, parseInt((event.target as HTMLInputElement).value, 10) || 0);
    this.nuls.update(m => new Map(m).set(bureauId, value));
    this.scheduleSave(bureauId);
  }

  protected incrementNuls(bureauId: string): void {
    this.nuls.update(m => new Map(m).set(bureauId, this.getNuls(bureauId) + 1));
    this.scheduleSave(bureauId);
  }

  protected decrementNuls(bureauId: string): void {
    const current = this.getNuls(bureauId);
    if (current > 0) {
      this.nuls.update(m => new Map(m).set(bureauId, current - 1));
      this.scheduleSave(bureauId);
    }
  }

  // --- Bureau totals & percentages ---

  protected getTotal(bureauId: string): number {
    const bv = this.votes().get(bureauId);
    let sum = this.getBlancs(bureauId) + this.getNuls(bureauId);
    if (bv) {
      for (const v of bv.values()) sum += v;
    }
    return sum;
  }

  protected getExpressedVotes(bureauId: string): number {
    const bv = this.votes().get(bureauId);
    if (!bv) return 0;
    let sum = 0;
    for (const v of bv.values()) sum += v;
    return sum;
  }

  protected getBureauCandidatePercent(bureauId: string, candidateId: number): number {
    const expressed = this.getExpressedVotes(bureauId);
    if (expressed === 0) return 0;
    return (this.getVotes(bureauId, candidateId) / expressed) * 100;
  }

  protected getBureauLeader(bureauId: string): number | null {
    const candidateList = this.candidates();
    if (candidateList.length === 0) return null;
    let maxVotes = 0;
    let leader: number | null = null;
    let tie = false;
    for (const c of candidateList) {
      const v = this.getVotes(bureauId, c.id);
      if (v > maxVotes) {
        maxVotes = v;
        leader = c.id;
        tie = false;
      } else if (v === maxVotes && v > 0) {
        tie = true;
      }
    }
    return tie ? null : leader;
  }

  // --- City-level aggregates ---

  protected getCityTotal(): number {
    const bureaux = this.selectedBureaux();
    let sum = 0;
    for (const b of bureaux) {
      sum += this.getTotal(b.id);
    }
    return sum;
  }

  protected getCityCandidateVotes(candidateId: number): number {
    const bureaux = this.selectedBureaux();
    let sum = 0;
    for (const b of bureaux) {
      sum += this.getVotes(b.id, candidateId);
    }
    return sum;
  }

  protected getCityExpressedVotes(): number {
    return this.selectedBureaux().reduce((s, b) => s + this.getExpressedVotes(b.id), 0);
  }

  protected getCityCandidatePercent(candidateId: number): number {
    const expressed = this.getCityExpressedVotes();
    if (expressed === 0) return 0;
    return (this.getCityCandidateVotes(candidateId) / expressed) * 100;
  }

  protected getCityBlancsTotal(): number {
    return this.selectedBureaux().reduce((s, b) => s + this.getBlancs(b.id), 0);
  }

  protected getCityNulsTotal(): number {
    return this.selectedBureaux().reduce((s, b) => s + this.getNuls(b.id), 0);
  }

  protected getCityBlancsPercent(): number {
    const total = this.getCityTotal();
    if (total === 0) return 0;
    return (this.getCityBlancsTotal() / total) * 100;
  }

  protected getCityNulsPercent(): number {
    const total = this.getCityTotal();
    if (total === 0) return 0;
    return (this.getCityNulsTotal() / total) * 100;
  }

  protected getCityLeader(): number | null {
    const candidateList = this.candidates();
    if (candidateList.length === 0) return null;
    let maxVotes = 0;
    let leader: number | null = null;
    let tie = false;
    for (const c of candidateList) {
      const v = this.getCityCandidateVotes(c.id);
      if (v > maxVotes) {
        maxVotes = v;
        leader = c.id;
        tie = false;
      } else if (v === maxVotes && v > 0) {
        tie = true;
      }
    }
    return tie ? null : leader;
  }

  protected dismissError(): void {
    this.saveError.set(null);
  }
}
