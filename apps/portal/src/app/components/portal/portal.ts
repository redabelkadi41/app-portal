import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslationService, TranslatePipe, ThemeService, ScrollAnimateDirective } from '@libs/shared';

interface AppEntry {
  key: string;
  path: string;
  icon: string;
  comingSoon?: boolean;
}

@Component({
  selector: 'app-portal',
  standalone: true,
  imports: [TranslatePipe, ScrollAnimateDirective, RouterLink],
  templateUrl: './portal.html',
  styleUrl: './portal.css'
})
export class PortalComponent {
  protected readonly i18n = inject(TranslationService);
  protected readonly theme = inject(ThemeService);

  readonly apps: AppEntry[] = [
    {
      key: 'elections',
      path: '/elections/',
      icon: 'M3 3v18h18M7 16l4-8 4 4 4-6',
      comingSoon: true
    },
    {
      key: 'simulator',
      path: '/simulateur-reports-voix/',
      icon: 'M12 20V10M18 20V4M6 20v-4M3 3v18h18'
    }
  ];
}
