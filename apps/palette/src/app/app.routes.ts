import { Routes } from '@angular/router';
import { PalettePage } from './pages/palette.page';

export const routes: Routes = [
  { path: '', component: PalettePage },
  { path: '**', redirectTo: '' }
];
