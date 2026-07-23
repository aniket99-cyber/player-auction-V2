import { Component } from '@angular/core';
import { NgApexchartsModule } from 'ng-apexcharts';
import type {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexStroke,
  ApexGrid,
} from 'ng-apexcharts';

interface SpendChartOptions {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  dataLabels: ApexDataLabels;
  stroke: ApexStroke;
  grid: ApexGrid;
  colors: string[];
}

@Component({
  selector: 'app-dashboard',
  imports: [NgApexchartsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  readonly spendChartOptions: SpendChartOptions = {
    series: [
      {
        name: 'Budget Spent',
        data: [0, 12, 28, 45, 61, 78, 90],
      },
    ],
    chart: {
      type: 'area',
      height: 280,
      toolbar: { show: false },
      background: 'transparent',
    },
    xaxis: {
      categories: ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7'],
      labels: { style: { colors: '#9aa4b8' } },
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 3 },
    grid: { borderColor: '#262d3d' },
    colors: ['#2fd0ff'],
  };
}
