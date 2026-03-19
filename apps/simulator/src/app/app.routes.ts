import { Routes } from '@angular/router';
import { SimulatorPage } from './pages/simulator.page';

export const routes: Routes = [
  { path: '', component: SimulatorPage },
  { path: '**', redirectTo: '' }
];
