import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-simulator-header',
  standalone: true,
  templateUrl: './simulator-header.html',
  styleUrl: './simulator-header.css'
})
/** Header bar with tricolor banner, app title, subtitle and dark/light theme toggle */
export class SimulatorHeader {
  readonly theme = input.required<string>();
  readonly themeToggle = output<void>();
}
