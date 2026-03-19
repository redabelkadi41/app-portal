import { Routes } from '@angular/router';
import { ElectionsPage } from './pages/elections.page';

export const routes: Routes = [
  { path: '', component: ElectionsPage },
  { path: '**', redirectTo: '' }
];
