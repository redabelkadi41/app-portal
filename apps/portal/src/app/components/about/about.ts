import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslationService, TranslatePipe, ThemeService } from '@libs/shared';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [TranslatePipe, RouterLink],
  template: `
    <nav class="navbar">
      <div class="nav-container container">
        <a class="logo" routerLink="/">AP</a>
        <div class="nav-actions">
          <button class="theme-toggle" (click)="theme.toggle()" aria-label="Toggle theme">
            @if (theme.current() === 'dark') {
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            } @else {
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            }
          </button>
          <button class="lang-toggle" (click)="i18n.toggleLang()">
            {{ i18n.currentLang() === 'fr' ? 'EN' : 'FR' }}
          </button>
        </div>
      </div>
    </nav>

    <main class="page">
      <div class="container">
        <a class="back-link" routerLink="/">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          {{ 'page.back_home' | translate }}
        </a>
        <h1>{{ 'about.title' | translate }}</h1>

        <section>
          <p>{{ 'about.intro' | translate }}</p>
        </section>

        <section>
          <h2>{{ 'about.project_title' | translate }}</h2>
          <p>{{ 'about.project_text' | translate }}</p>
        </section>

        <section>
          <h2>{{ 'about.tech_title' | translate }}</h2>
          <p>{{ 'about.tech_text' | translate }} <a href="https://github.com/redabelkadi41" target="_blank" rel="noopener">GitHub</a>.</p>
        </section>

        <section>
          <h2>{{ 'about.contact_title' | translate }}</h2>
          <p>{{ 'about.contact_text' | translate }}</p>
        </section>
      </div>
    </main>
  `,
  styleUrl: '../shared-page.css'
})
export class AboutComponent {
  protected readonly i18n = inject(TranslationService);
  protected readonly theme = inject(ThemeService);
}
