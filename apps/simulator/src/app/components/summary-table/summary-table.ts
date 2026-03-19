import { Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';

export interface SummaryRow {
  name: string;
  r1Votes: number;
  r1Percent: number;
  r2Votes: number;
  r2Percent: number;
  evolution: number;
  seats: number;
  isWinner: boolean;
}

@Component({
  selector: 'app-summary-table',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './summary-table.html',
  styleUrl: './summary-table.css'
})
/** Comparative table: round 1 vs projected round 2 results (votes, %, evolution, seats) per candidate */
export class SummaryTable {
  readonly rows = input.required<SummaryRow[]>();
  readonly showSeats = input.required<boolean>();
}
