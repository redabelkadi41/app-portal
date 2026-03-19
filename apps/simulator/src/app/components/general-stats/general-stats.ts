import { Component, input, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-general-stats',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './general-stats.html',
  styleUrl: './general-stats.css'
})
/** Input form for general election statistics: registered voters, voters, null/blank ballots */
export class GeneralStats {
  readonly inscrits = input.required<number>();
  readonly votants = input.required<number>();
  readonly nuls = input.required<number>();
  readonly blancs = input.required<number>();
  readonly exprimes = input.required<number>();
  readonly participationRate = input.required<number>();
  readonly abstentionPool = input.required<number>();

  readonly inscritChange = output<number>();
  readonly votantChange = output<number>();
  readonly nulChange = output<number>();
  readonly blancChange = output<number>();

  toInt(e: Event): number {
    return parseInt((e.target as HTMLInputElement).value, 10) || 0;
  }
}
