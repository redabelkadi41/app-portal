import { Routes } from '@angular/router';
import { PomodoroPage } from './pages/pomodoro.page';

export const routes: Routes = [
  { path: '', component: PomodoroPage },
  { path: '**', redirectTo: '' }
];
