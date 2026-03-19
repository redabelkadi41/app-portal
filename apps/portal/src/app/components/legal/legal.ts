import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslationService, TranslatePipe, ThemeService } from '@libs/shared';

@Component({
  selector: 'app-legal',
  standalone: true,
  imports: [TranslatePipe, RouterLink],
  templateUrl: './legal.html',
  styleUrl: '../shared-page.css'
})
export class LegalComponent {
  protected readonly i18n = inject(TranslationService);
  protected readonly theme = inject(ThemeService);
}
