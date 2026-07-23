import { Component, computed, input } from '@angular/core';
import { NgApexchartsModule } from 'ng-apexcharts';
import type {
  ApexAxisChartSeries,
  ApexChart,
  ApexDataLabels,
  ApexGrid,
  ApexStroke,
  ApexXAxis,
} from 'ng-apexcharts';
import { Player, Team } from '../../../core/models';

interface ChartOptions {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  dataLabels: ApexDataLabels;
  stroke: ApexStroke;
  grid: ApexGrid;
  colors: string[];
}

// Categorical set validated (via the dataviz skill's validator, against the
// dark surface #12161f) in team-detail.ts — reused here for the identity
// comparison (role distribution). Team spend below is a magnitude
// comparison instead, so it deliberately uses ONE sequential hue, not this
// categorical set — color there would otherwise imply identity that isn't
// the point (the team names on the axis already carry that).
const CATEGORICAL_COLORS = ['#3987e5', '#d95926', '#199e70', '#c98500'];
const SEQUENTIAL_HUE = '#3987e5';

const CHART_GRID_COLOR = '#262d3d';
const CHART_LABEL_COLOR = '#9aa4b8';

@Component({
  selector: 'app-statistics',
  imports: [NgApexchartsModule],
  templateUrl: './statistics.html',
  styleUrl: './statistics.scss',
})
export class Statistics {
  readonly teams = input.required<Team[]>();
  readonly roster = input.required<Player[]>();

  readonly teamSpendChart = computed<ChartOptions>(() => {
    const ranked = [...this.teams()]
      .map((t) => ({ name: t.shortName, spent: t.totalBudget - t.remainingBudget }))
      .sort((a, b) => b.spent - a.spent);

    return {
      series: [{ name: 'Spent', data: ranked.map((t) => t.spent) }],
      chart: { type: 'bar', height: 220, toolbar: { show: false }, background: 'transparent' },
      xaxis: { categories: ranked.map((t) => t.name), labels: { style: { colors: CHART_LABEL_COLOR } } },
      dataLabels: { enabled: false },
      stroke: { width: 0 },
      grid: { borderColor: CHART_GRID_COLOR },
      colors: [SEQUENTIAL_HUE],
    };
  });

  readonly roleDistributionChart = computed<ChartOptions>(() => {
    const counts = new Map<string, number>();
    this.roster().forEach((p) => counts.set(p.role, (counts.get(p.role) ?? 0) + 1));

    return {
      series: [{ name: 'Players', data: Array.from(counts.values()) }],
      chart: { type: 'bar', height: 220, toolbar: { show: false }, background: 'transparent' },
      xaxis: {
        categories: Array.from(counts.keys()),
        labels: { style: { colors: CHART_LABEL_COLOR } },
      },
      dataLabels: { enabled: false },
      stroke: { width: 0 },
      grid: { borderColor: CHART_GRID_COLOR },
      colors: CATEGORICAL_COLORS,
    };
  });
}
