import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import * as L from 'leaflet';

@Injectable({
  providedIn: 'root'
})
export class GeometryService {
  // Track polygon bounds (for quick checks and centroid)
  private boundsSource = new BehaviorSubject<L.LatLngBounds | null>(null);
  bounds$ = this.boundsSource.asObservable();

  // Track actual polygon object (for centroid, drawing, etc.)
  private polygon: L.Polygon | null = null;

  // ✅ Set the bounds
  setBounds(bounds: L.LatLngBounds) {
    this.boundsSource.next(bounds);
  }

  // ✅ Get the current bounds
  getBounds(): L.LatLngBounds | null {
    return this.boundsSource.getValue();
  }

  // ✅ Check if a polygon exists
  hasPolygon(): boolean {
    return !!this.polygon || !!this.boundsSource.getValue();
  }

  // ✅ Set the polygon object
  setPolygon(polygon: L.Polygon) {
    this.polygon = polygon;
    this.setBounds(polygon.getBounds()); // keep bounds in sync
  }

  // ✅ Get the polygon object
  getPolygon(): L.Polygon | null {
    return this.polygon;
  }
}
