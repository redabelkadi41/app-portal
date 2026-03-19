import { Component, input } from '@angular/core';

@Component({
  selector: 'app-phase-stepper',
  standalone: true,
  templateUrl: './phase-stepper.html',
  styleUrl: './phase-stepper.css'
})
/** Step indicator showing current phase (1: Round 1 data entry, 2: Round 2 simulation) */
export class PhaseStepper {
  readonly currentPhase = input.required<1 | 2>();
}
