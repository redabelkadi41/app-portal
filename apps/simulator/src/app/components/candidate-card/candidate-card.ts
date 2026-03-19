import { Component, computed, input, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RoundOneCandidate } from '../../models/simulator.models';

@Component({
  selector: 'app-candidate-card',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './candidate-card.html',
  styleUrl: './candidate-card.css'
})
/** Card for a single candidate: name inputs, vote count, round 2 participation toggle, and list merge options */
export class CandidateCard {
  readonly candidate = input.required<RoundOneCandidate>();
  readonly index = input.required<number>();
  readonly exprimes = input.required<number>();
  readonly mergeTargets = input.required<RoundOneCandidate[]>();
  readonly hasFirstRoundWinner = input.required<boolean>();

  readonly nameChange = output<{ id: number; name: string }>();
  readonly votesChange = output<{ id: number; event: Event }>();
  readonly willRunChange = output<{ id: number; value: boolean }>();
  readonly mergeToggle = output<number>();
  readonly mergeTargetChange = output<{ id: number; event: Event }>();
  readonly remove = output<number>();

  readonly candidatePercent = computed(() => {
    const exp = this.exprimes();
    return exp > 0 ? (this.candidate().votes / exp) * 100 : 0;
  });

  onNameInput(e: Event): void {
    const name = (e.target as HTMLInputElement).value;
    this.nameChange.emit({ id: this.candidate().id, name });
  }

  targetPercent(t: RoundOneCandidate): number {
    const exp = this.exprimes();
    return exp > 0 ? (t.votes / exp) * 100 : 0;
  }
}
