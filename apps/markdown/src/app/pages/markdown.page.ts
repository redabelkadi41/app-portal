import { Component } from '@angular/core';

@Component({
  selector: 'app-markdown-page',
  standalone: true,
  template: `
    <div class="container page">
      <h1>Markdown Preview</h1>
      <p>Coming soon.</p>
    </div>
  `,
  styles: `
    .page {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
    }
    h1 {
      font-size: var(--font-4xl);
      font-weight: 700;
      background: linear-gradient(135deg, var(--text) 40%, var(--primary-light));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    p { color: var(--text-secondary); }
  `
})
export class MarkdownPage {}
