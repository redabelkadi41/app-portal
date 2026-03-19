import { Routes } from '@angular/router';
import { MarkdownPage } from './pages/markdown.page';

export const routes: Routes = [
  { path: '', component: MarkdownPage },
  { path: '**', redirectTo: '' }
];
