import {
  Component, effect, input,
  PLATFORM_ID, viewChild, ElementRef, inject
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

declare const Chart: any;

@Component({
  selector: 'app-comparison-chart',
  standalone: true,
  templateUrl: './comparison-chart.html',
  styleUrl: './comparison-chart.css'
})
/** Bar chart (Chart.js) comparing round 1 actual votes vs projected round 2 votes per candidate */
export class ComparisonChart {
  readonly labels = input.required<string[]>();
  readonly r1Data = input.required<number[]>();
  readonly r2Data = input.required<number[]>();
  readonly isDark = input.required<boolean>();

  private readonly platformId = inject(PLATFORM_ID);
  private readonly chartCanvas = viewChild<ElementRef<HTMLCanvasElement>>('chartCanvas');
  private chart: any = null;

  constructor() {
    effect(() => {
      const canvas = this.chartCanvas();
      if (!canvas || !isPlatformBrowser(this.platformId)) return;

      const labels = this.labels();
      const r1Data = this.r1Data();
      const r2Data = this.r2Data();
      const isDark = this.isDark();

      requestAnimationFrame(() => this.renderChart(canvas.nativeElement, labels, r1Data, r2Data, isDark));
    });
  }

  private renderChart(
    canvas: HTMLCanvasElement,
    labels: string[],
    r1Data: number[],
    r2Data: number[],
    isDark: boolean
  ): void {
    if (typeof Chart === 'undefined') return;

    const textColor = isDark ? '#a0a0b0' : '#4a5568';
    const gridColor = isDark ? '#2a2a3a' : '#d0d5dd';

    if (this.chart) {
      this.chart.data.labels = labels;
      this.chart.data.datasets[0].data = r1Data;
      this.chart.data.datasets[1].data = r2Data;
      this.chart.options.scales.x.ticks.color = textColor;
      this.chart.options.scales.y.ticks.color = textColor;
      this.chart.options.scales.y.grid.color = gridColor;
      this.chart.options.plugins.legend.labels.color = textColor;
      this.chart.update('none');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: '1er tour',
            data: r1Data,
            backgroundColor: isDark ? '#3366cc' : '#002395',
            borderRadius: 4,
          },
          {
            label: '2nd tour (projeté)',
            data: r2Data,
            backgroundColor: '#ED2939',
            borderRadius: 4,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'top' as const,
            labels: { color: textColor, font: { family: "'Inter', sans-serif" } }
          }
        },
        scales: {
          x: {
            ticks: { color: textColor, font: { family: "'Inter', sans-serif" } },
            grid: { display: false },
          },
          y: {
            beginAtZero: true,
            ticks: { color: textColor, font: { family: "'Inter', sans-serif" } },
            grid: { color: gridColor },
          }
        }
      }
    });
  }
}
