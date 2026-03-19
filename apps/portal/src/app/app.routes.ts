import { Routes } from '@angular/router';
import { PortalComponent } from './components/portal/portal';
import { LegalComponent } from './components/legal/legal';
import { AboutComponent } from './components/about/about';

export const routes: Routes = [
  { path: '', component: PortalComponent },
  { path: 'mentions-legales', component: LegalComponent },
  { path: 'a-propos', component: AboutComponent },
  { path: '**', redirectTo: '' }
];
