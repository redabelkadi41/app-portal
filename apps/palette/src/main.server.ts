import { bootstrapApplication, type BootstrapContext } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { provideZonelessChangeDetection } from '@angular/core';

import { App } from './app/app';
import { routes } from './app/app.routes';
import { serverRoutes } from './app/app.routes.server';

const bootstrap = (context: BootstrapContext) =>
  bootstrapApplication(
    App,
    {
      providers: [
        provideZonelessChangeDetection(),
        provideRouter(routes),
        provideServerRendering(withRoutes(serverRoutes)),
      ],
    },
    context,
  );

export default bootstrap;
