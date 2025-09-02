import { Component, ViewChild, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpParams } from '@angular/common/http';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { CommonModule } from '@angular/common';
import { GeometryService } from '../../services/geometry.service';
import * as L from 'leaflet';

import { NgChartsModule, BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions, ChartDataset, Chart } from 'chart.js';

@Component({
  selector: 'app-statistiques',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatButtonModule,
    MatCheckboxModule,
    NgChartsModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatSnackBarModule
  ],
  templateUrl: './statistiques.component.html',
  styleUrls: ['./statistiques.component.css']
})
export class StatistiquesComponent {
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  startDate: Date | null = null;
  endDate: Date | null = null;
  maxDate: Date = new Date();
  layers = ['NDVI', 'NDWI'];
  selectedLayers: string[] = [];

  reducers = [
    { label: 'Mean', value: 'mean' },
    { label: 'Min', value: 'min' },
    { label: 'Max', value: 'max' },
    { label: 'Standard Deviation', value: 'std' }
  ];
  selectedReducers: string[] = [];

  drawnBounds: L.LatLngBounds | null = null;

  loading = false;
  isProcessing = false;

  public lineChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: []
  };

  public lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    spanGaps: true,
    elements: { point: { radius: 0 } },
    interaction: { mode: 'nearest', intersect: false },
    plugins: {
      legend: {
        labels: {
          color: '#111827',
          usePointStyle: true
        }
      },
      tooltip: {
        enabled: true,
        backgroundColor: '#111827',
        titleColor: '#f9fafb',
        bodyColor: '#f9fafb'
      },
      decimation: {
        enabled: true,
        algorithm: 'lttb',
        samples: 500
      }
    },
    scales: {
      x: {
        ticks: { color: '#374151', autoSkip: true, maxRotation: 0 },
        grid: { color: 'rgba(17,24,39,0.08)' }
      },
      y: {
        beginAtZero: false,
        ticks: { color: '#374151' },
        grid: { color: 'rgba(17,24,39,0.08)' }
      }
    }
  };

  constructor(
    private geometryService: GeometryService,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    this.geometryService.bounds$.subscribe(bounds => {
      this.drawnBounds = bounds;
      if (bounds) {
        console.log('✅ Polygon bounds received in StatistiquesComponent:', bounds);
      }
    });
  }

  onLayerToggle(layer: string, isChecked: boolean): void {
    if (isChecked) {
      if (!this.selectedLayers.includes(layer)) {
        this.selectedLayers.push(layer);
      }
    } else {
      this.selectedLayers = this.selectedLayers.filter(l => l !== layer);
    }
  }

  onReducerToggle(reducer: string, isChecked: boolean): void {
    if (isChecked) {
      if (!this.selectedReducers.includes(reducer)) {
        this.selectedReducers.push(reducer);
      }
    } else {
      this.selectedReducers = this.selectedReducers.filter(r => r !== reducer);
    }
  }

  async onSubmit(): Promise<void> {
    const missingFields: string[] = [];

    if (!this.drawnBounds) missingFields.push('polygon');
    if (!this.startDate || !this.endDate) missingFields.push('date range');
    if (this.selectedLayers.length === 0) missingFields.push('layer selection');
    if (this.selectedReducers.length === 0) missingFields.push('statistics selection');

    if (missingFields.length > 0) {
      this.snackBar.open(`Please complete: ${missingFields.join(', ')}`, 'Close', { duration: 3000 });
      return;
    }

    const southWest = this.drawnBounds!.getSouthWest();
    const northEast = this.drawnBounds!.getNorthEast();

    const geom = {
      type: 'Polygon',
      coordinates: [[
        [southWest.lng, southWest.lat],
        [northEast.lng, southWest.lat],
        [northEast.lng, northEast.lat],
        [southWest.lng, northEast.lat],
        [southWest.lng, southWest.lat]
      ]]
    };

    this.isProcessing = true;

    // Initialize empty chart and show it immediately
    this.lineChartData = {
      labels: [],
      datasets: []
    };

    // Keep loading false so the spinner doesn't show
    this.loading = false;

    try {
      const allResponses: { [reducer: string]: { [layer: string]: { [date: string]: number } } } = {};
      const labelsSet = new Set<string>();

      let completedRequests = 0;
      const totalRequests = this.selectedReducers.length;

      // Process each reducer request progressively
      for (const reducer of this.selectedReducers) {
        try {
          const baseUrl = `http://10.1.10.189/${reducer}`;
          let params = new HttpParams()
            .set('geom', JSON.stringify(geom))
            .set('start_date', this.startDate!.toISOString().split('T')[0])
            .set('end_date', this.endDate!.toISOString().split('T')[0]);

          for (const layer of this.selectedLayers) {
            params = params.append('layers', layer);
          }

          console.log(`🔄 Fetching data for reducer: ${reducer}`);
          const response = await this.http.get<{ [layer: string]: { [date: string]: number } }>(baseUrl, { params }).toPromise();

          // Store this reducer's response
          allResponses[reducer] = response ?? {};

          // Update labels set with new dates
          Object.entries(response ?? {}).forEach(([layer, data]) => {
            Object.keys(data ?? {}).forEach(date => labelsSet.add(date));
          });

          // Rebuild complete chart with all data so far
          this.rebuildChart(allResponses, labelsSet);

          completedRequests++;
          console.log(`✅ Progress: ${completedRequests}/${totalRequests} requests completed`);

          // Show progress
          if (completedRequests < totalRequests) {
            this.snackBar.open(`Loading... ${completedRequests}/${totalRequests} completed`, '', { duration: 800 });
          }

        } catch (error) {
          console.error(`❌ Error fetching data for reducer ${reducer}:`, error);
          completedRequests++;
          this.snackBar.open(`Error loading ${reducer} data`, '', { duration: 1500 });
        }
      }

      this.snackBar.open('All statistics loaded successfully!', '', { duration: 2000 });

    } catch (error) {
      console.error('❌ Error in onSubmit:', error);
      this.snackBar.open('Error fetching data. Please try again later.', 'Close', { duration: 3000 });
    } finally {
      this.isProcessing = false;
    }
  }

  // Helper method to rebuild the entire chart from current responses
  private rebuildChart(
    allResponses: { [reducer: string]: { [layer: string]: { [date: string]: number } } },
    labelsSet: Set<string>
  ): void {
    const sortedLabels = Array.from(labelsSet).sort();
    const datasets: ChartDataset<'line'>[] = [];

    // Build datasets from all completed responses
    Object.entries(allResponses).forEach(([reducer, reducerResponse]) => {
      Object.entries(reducerResponse).forEach(([layer, layerData]) => {
        const values = sortedLabels.map(date => layerData[date] ?? null);
        const color = this.getColorForLayerAndReducer(layer, reducer);

        datasets.push({
          type: 'line',
          label: `${layer} (${reducer})`,
          data: values,
          fill: false,
          borderColor: color,
          backgroundColor: color, // This is what the legend uses
          pointBackgroundColor: color,
          pointBorderColor: color,
          tension: 0.2,
          pointRadius: 0,
          borderWidth: 2
        });
      });
    });

    // Update chart data
    this.lineChartData = {
      labels: sortedLabels,
      datasets
    };

    // Force chart update - this is the key!
    if (this.chart) {
      this.chart.update();
    }

    // Force Angular change detection
    this.cdr.detectChanges();

    console.log(`📊 Chart updated with ${datasets.length} datasets and ${sortedLabels.length} data points`);
  }

  private getColorForLayerAndReducer(layer: string, reducer: string): string {
    // Same color for same reducer, regardless of layer
    const reducerColors: { [key: string]: string } = {
      mean: '#2563eb',   // Blue for all means
      min: '#16a34a',    // Green for all mins
      max: '#ef4444',    // Red for all maxs
      std: '#f59e0b'     // Orange for all stds
    };

    return reducerColors[reducer] ?? '#111827';
  }
}
