import { Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RoundOneCandidate } from '../../models/simulator.models';

@Component({
  selector: 'app-validation-box',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './validation-box.html',
  styleUrl: './validation-box.css'
})
/** Validation panel: displays errors, warnings and success status for phase 1 data completeness */
export class ValidationBox {
  readonly voteDelta = input.required<number>();
  readonly hasRound2Candidate = input.required<boolean>();
  readonly allCandidatesDecided = input.required<boolean>();
  readonly hasIncompleteNames = input.required<boolean>();
  readonly hasMergeErrors = input.required<boolean>();
  readonly isValid = input.required<boolean>();
  readonly firstRoundWinner = input.required<RoundOneCandidate | null>();
  readonly candidatePercentFn = input.required<(c: RoundOneCandidate) => number>();
}
