import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DatePipe, NgIf, NgForOf } from '@angular/common';

import { OgcService, OgcParams } from '../../services/ogc.service';
import { GeometryService } from '../../services/geometry.service';
import html2canvas from 'html2canvas';
import * as L from 'leaflet';

@Component({
  selector: 'app-ogc-view',
  standalone: true,
  imports: [
    FormsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatSnackBarModule,
    DatePipe,
    NgIf,
    NgForOf,
  ],
  templateUrl: './ogc-view.component.html',
  styleUrls: ['./ogc-view.component.css']
})
export class OgcViewComponent {
  startDate: Date | null = null;
  endDate: Date | null = null;
  maxDate: Date = new Date();

  formats: string[] = ['image/png','image/tiff'];
  selectedFormat: string = 'image/png';
  layers = ['GEOLOGY', 'LAI_SAVI', 'MOISTURE_INDEX', 'NDVI-L2A'];
  selectedLayer: string | null = null;
  cloud_percentage: number | null = 25;
  downloading = false;

  constructor(
    private ogcService: OgcService,
    private geometryService: GeometryService,
    private snackBar: MatSnackBar
  ) {}

  onSubmit() {
    const missingFields: string[] = [];
    if (!this.startDate || !this.endDate) missingFields.push('date range');
    if (this.cloud_percentage === null || this.cloud_percentage < 0 || this.cloud_percentage > 100) missingFields.push('cloud percentage (0–100)');
    if (!this.selectedLayer) missingFields.push('data layer');
    if (!this.geometryService.hasPolygon()) missingFields.push('polygon drawing');

    if (missingFields.length > 0) {
      this.snackBar.open(`Please complete: ${missingFields.join(', ')}`, 'Close', { duration: 3000 });
      return;
    }

    const params: OgcParams = {
      startDate: this.startDate!,
      endDate: this.endDate!,
      cloudPercentage: this.cloud_percentage!,
      selectedLayer: this.selectedLayer!,
    };

    this.ogcService.updateParams(params);
    this.snackBar.open('Submitted successfully', '', { duration: 1500 });
  }

  downloadData() {
    if (this.selectedFormat === 'image/tiff') {
      let wmsUrl: string | null = this.ogcService.getWmsUrl();
      if (!wmsUrl) {
        this.snackBar.open('WMS URL not available. Submit and draw a polygon first.', 'Close', { duration: 2500 });
        return;
      }

      const formatParam = `FORMAT=${encodeURIComponent('image/tiff')}`;
      wmsUrl = wmsUrl.includes('FORMAT=') ? wmsUrl.replace(/FORMAT=[^&]+/, formatParam) : wmsUrl + (wmsUrl.includes('?') ? '&' : '?') + formatParam;

      this.snackBar.open('TIFF export started', '', { duration: 1500 });

      fetch(wmsUrl)
        .then(res => { if (!res.ok) throw new Error('Download failed'); return res.blob(); })
        .then(blob => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'map.tiff';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        })
        .catch(err => { console.error(err); this.snackBar.open('TIFF download failed', 'Close', { duration: 3000 }); });

    } else if (this.selectedFormat === 'image/png') {
      const mapEl = document.getElementById('map');
      if (!mapEl) { this.snackBar.open('Map not found on page.', 'Close', { duration: 2500 }); return; }

      const polygon = this.geometryService.getPolygon();
      if (!polygon) { this.snackBar.open('Polygon not found.', 'Close', { duration: 2500 }); return; }

      // calculate centroid safely
      const centroid = this.calculateCentroid(polygon);

      // get area name from free reverse geocoding
      this.getAreaName(centroid).then(areaName => {
        const svgElements = Array.from(document.querySelectorAll('.leaflet-overlay-pane svg')) as HTMLElement[];
        const previousVisibility = svgElements.map(el => el.style.visibility);
        svgElements.forEach(el => el.style.visibility = 'hidden');
        this.downloading = true;

        html2canvas(mapEl, { useCORS: true, allowTaint: false, scale: Math.min(2, window.devicePixelRatio || 1) })
          .then(canvas => {
            const framePadding = 40;
            const compassSize = 200;
            const titleHeight = compassSize;

            const framedCanvas = document.createElement('canvas');
            framedCanvas.width = canvas.width + framePadding * 2;
            framedCanvas.height = canvas.height + framePadding * 2 + titleHeight;

            const ctx = framedCanvas.getContext('2d');
            if (!ctx) throw new Error('Could not get canvas context');

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, framedCanvas.width, framedCanvas.height);

            const compassImage = new Image();
            compassImage.src = '/images/compass.png';
            compassImage.crossOrigin = 'anonymous';
            compassImage.onload = () => {
              ctx.drawImage(compassImage, 10, 10, compassSize, compassSize);

              ctx.fillStyle = '#000000';
              ctx.font = 'bold 36px Arial';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
const layerName = (this.selectedLayer || '').replace(/[-_]/g, ' ');
ctx.fillText(`${layerName} Map of ${areaName}`, framedCanvas.width / 2, 10 + compassSize / 2);

              const mapOffsetX = framePadding;
              const mapOffsetY = 10 + compassSize + framePadding;
              ctx.drawImage(canvas, mapOffsetX, mapOffsetY);

              framedCanvas.toBlob(blob => {
                if (blob) {
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `map-of-${areaName}.png`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  this.snackBar.open('Framed PNG with compass downloaded', '', { duration: 1500 });
                }
              }, 'image/png');
            };
          })
          .catch(err => { console.error('Download failed:', err); this.snackBar.open('Download failed. Check CORS and try again.', 'Close', { duration: 3000 }); })
          .finally(() => { svgElements.forEach((el, idx) => el.style.visibility = previousVisibility[idx] || ''); this.downloading = false; });

      }).catch(err => { console.error('Reverse geocoding failed:', err); this.snackBar.open('Failed to determine area name.', 'Close', { duration: 3000 }); });

    } else {
      this.snackBar.open('Unsupported format selected', 'Close', { duration: 2000 });
    }
  }

  private calculateCentroid(polygon: L.Polygon): { lat: number, lon: number } {
    let latLngs: L.LatLng[] = [];
    const raw = polygon.getLatLngs();
    if (Array.isArray(raw[0])) latLngs = raw[0] as L.LatLng[];
    else latLngs = raw as L.LatLng[];

    const lat = latLngs.reduce((sum, p) => sum + p.lat, 0) / latLngs.length;
    const lon = latLngs.reduce((sum, p) => sum + p.lng, 0) / latLngs.length;
    return { lat, lon };
  }

  private async getAreaName({ lat, lon }: { lat: number, lon: number }): Promise<string> {
    const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
    if (!response.ok) throw new Error('Failed to fetch area name');
    const data = await response.json();
    return data.city || data.locality || data.countryName || 'Unknown Area';
  }
}
