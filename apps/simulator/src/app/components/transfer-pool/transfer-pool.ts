import { Component, input, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Round2CandidateInfo, TransferPool as TransferPoolModel } from '../../models/simulator.models';

@Component({
  selector: 'app-transfer-pool',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './transfer-pool.html',
  styleUrl: './transfer-pool.css'
})
/** Vote transfer controls: sliders + numeric inputs to simulate how each voter pool redistributes in round 2 */
export class TransferPoolComponent {
  readonly pool = input.required<TransferPoolModel>();
  readonly round2Candidates = input.required<Round2CandidateInfo[]>();
  readonly remainingPercent = input.required<number>();
  readonly allSliders = input.required<Record<number, Record<string, number>>>();

  readonly sliderChange = output<{ candidateId: number; poolId: string; event: Event }>();
  readonly votesChange = output<{ candidateId: number; poolId: string; percent: number }>();

  onSliderInput(candidateId: number, e: Event): void {
    this.sliderChange.emit({ candidateId, poolId: this.pool().id, event: e });
  }

  getSliderValue(candidateId: number): number {
    return this.allSliders()[candidateId]?.[this.pool().id] ?? 0;
  }

  getCapturedVotes(candidateId: number): number {
    return Math.round(this.pool().votes * this.getSliderValue(candidateId) / 100);
  }

  onVotesInput(candidateId: number, e: Event): void {
    const votes = Math.max(0, parseInt((e.target as HTMLInputElement).value, 10) || 0);
    const poolVotes = this.pool().votes;
    const percent = poolVotes > 0 ? (votes / poolVotes) * 100 : 0;
    this.votesChange.emit({ candidateId, poolId: this.pool().id, percent });
  }
}
