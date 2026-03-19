import { Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Round2CandidateInfo } from '../../models/simulator.models';

@Component({
  selector: 'app-result-card',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './result-card.html',
  styleUrl: './result-card.css'
})
/** Card displaying projected round 2 results for a candidate: votes, percentage bar, and seat count */
export class ResultCard {
  readonly candidate = input.required<Round2CandidateInfo>();
  readonly isWinner = input.required<boolean>();
  readonly projectedVotes = input.required<number>();
  readonly projectedPercent = input.required<number>();
  readonly seats = input.required<number>();
  readonly showSeats = input.required<boolean>();
}
