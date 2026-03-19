import { Injectable, signal } from '@angular/core';
import fr from './fr.json';
import en from './en.json';

type Translations = Record<string, unknown>;

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private readonly dictionaries: Record<string, Translations> = { fr, en };
  readonly currentLang = signal<string>('fr');

  setLang(lang: string): void {
    if (this.dictionaries[lang]) {
      this.currentLang.set(lang);
    }
  }

  toggleLang(): void {
    this.setLang(this.currentLang() === 'fr' ? 'en' : 'fr');
  }

  translate(key: string): string {
    const parts = key.split('.');
    let result: unknown = this.dictionaries[this.currentLang()];
    for (const part of parts) {
      if (result && typeof result === 'object') {
        result = (result as Record<string, unknown>)[part];
      } else {
        return key;
      }
    }
    return typeof result === 'string' ? result : key;
  }
}
