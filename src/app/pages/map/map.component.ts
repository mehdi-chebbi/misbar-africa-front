import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import * as L from 'leaflet';
import 'leaflet-draw';
import { Subscription } from 'rxjs';
import { BaseMapService } from '../../services/base-map.service';
import { OgcService, OgcParams } from '../../services/ogc.service';
import { GeometryService } from '../../services/geometry.service';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';

// shapefile reader
import shp from 'shpjs';

// KML parser
import { DOMParser } from 'xmldom';
import * as toGeoJSON from '@tmcw/togeojson';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
})
export class MapComponent implements AfterViewInit, OnDestroy {
  private map!: L.Map;
  private drawnItems!: L.FeatureGroup;
  private currentBaseLayer!: L.TileLayer;
  private baseMaps!: { [key: string]: L.TileLayer };
  private baseMapSubscription!: Subscription;
  private ogcParamsSubscription!: Subscription;
  private imageOverlay: L.ImageOverlay | null = null;
  private lastDrawnBounds: L.LatLngBounds | null = null;
  private defaultCenter: L.LatLngExpression = [31.76299759769429, 9.7998046875];
  private currentBaseName: string = 'OpenStreetMap';
  statusLat: number | null = null;
  statusLng: number | null = null;
  zoomLevel: number = 0;
  private locateMarker: L.Marker | null = null;

  imageMetadata: {
    areaName: string;
    startDate: string;
    endDate: string;
    layer: string;
    isVisible: boolean;
  } | null = null;

  constructor(
    private baseMapService: BaseMapService,
    private ogcService: OgcService,
    private geometryService: GeometryService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngAfterViewInit(): void {
    // Initialize map
    this.map = L.map('map', {
      center: this.defaultCenter,
      zoom: 5,
      zoomControl: false,
    });

    (L.Icon.Default as any).mergeOptions({
      iconRetinaUrl: '/assets/leaflet-images/marker-icon-2x.png',
      iconUrl: '/assets/leaflet-images/marker-icon.png',
      shadowUrl: '/assets/leaflet-images/marker-shadow.png',
    });

    // Base layers
    const allBaseMaps = {
      'NDVI': L.tileLayer.wms('https://sh.dataspace.copernicus.eu/ogc/wms/2e44e6fc-1f1c-4258-bd09-8a15c317f604', {
        layers: 'NDVI-L2A',
        format: 'image/png',
        transparent: true,
        attribution: 'Copernicus Data Space Ecosystem',
        version: '1.3.0',
        crs: L.CRS.EPSG3857,
        crossOrigin: true,
      }),
      'OpenStreetMap': L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        crossOrigin: true,
      }),
      'Satellite': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles © Esri',
        crossOrigin: true,
      }),
      'Dark': L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
        attribution: '&copy; CARTO',
        crossOrigin: true,
      }),
      'Light': L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
        attribution: '&copy; CARTO',
        crossOrigin: true,
      }),
      'Topographic': L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenTopoMap contributors',
        crossOrigin: true,
      }),
    };

    // Restrict base maps based on authentication status
    this.baseMaps = this.authService.isAuthenticated()
      ? allBaseMaps
      : { 'OpenStreetMap': allBaseMaps['OpenStreetMap'] };

    // Initial base layer
    const qs = new URLSearchParams(window.location.search);
    const urlLayer = qs.get('layer');
    const urlLat = parseFloat(qs.get('lat') || '');
    const urlLng = parseFloat(qs.get('lng') || '');
    const urlZ = parseInt(qs.get('z') || '', 10);

    if (urlLayer && this.baseMaps[urlLayer]) {
      this.currentBaseLayer = this.baseMaps[urlLayer];
      this.currentBaseName = urlLayer;
    } else {
      this.currentBaseLayer = this.baseMaps['OpenStreetMap'];
      this.currentBaseName = 'OpenStreetMap';
    }
    this.currentBaseLayer.addTo(this.map);

    if (!Number.isNaN(urlLat) && !Number.isNaN(urlLng) && !Number.isNaN(urlZ)) {
      this.map.setView([urlLat, urlLng], urlZ);
    }

    // React to base map changes
    this.baseMapSubscription = this.baseMapService.baseMap$.subscribe((mapName) => {
      if (this.baseMaps[mapName]) {
        this.map.removeLayer(this.currentBaseLayer);
        this.currentBaseLayer = this.baseMaps[mapName];
        this.currentBaseName = mapName;
        this.currentBaseLayer.addTo(this.map);
        this.updateUrlFromMap();
      }
    });

    // Drawing layer
    this.drawnItems = new L.FeatureGroup();
    this.map.addLayer(this.drawnItems);

    L.control.zoom({ position: 'topright' }).addTo(this.map);

    // Only add drawing controls for authenticated users
    if (this.authService.isAuthenticated()) {
      const drawControl = new L.Control.Draw({
        position: 'topright',
        edit: { featureGroup: this.drawnItems },
        draw: {
          polygon: {},
          marker: false,
          polyline: false,
          circle: false,
          rectangle: false,
          circlemarker: false,
        },
      });
      this.map.addControl(drawControl);
    } else {
      // Add a disabled drawing control that prompts login
      const DisabledDrawControl = (L.Control as any).extend({
        options: { position: 'topright' },
        onAdd: () => {
          const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control disabled-control');
          const button = L.DomUtil.create('a', '', container);
          button.href = '#';
          button.title = 'Register to enable drawing tools';
          button.innerHTML = '✏️';
          button.style.opacity = '0.5';
          button.style.cursor = 'not-allowed';

          L.DomEvent.on(button, 'click', L.DomEvent.stop)
            .on(button, 'click', () => {
              this.snackBar.open('Please register to enable drawing tools', 'Login', {
                duration: 5000,
                horizontalPosition: 'center',
                verticalPosition: 'top'
              }).onAction().subscribe(() => {
                this.router.navigate(['/login']);
              });
            });

          return container;
        }
      });
      this.map.addControl(new DisabledDrawControl());
    }

    // Add shapefile/geojson/KML upload control
    const UploadControl = (L.Control as any).extend({
      options: { position: 'topright' },
      onAdd: () => {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        const fileInput = L.DomUtil.create('input', '', container);
        fileInput.type = 'file';
        fileInput.accept = '.zip,.json,.geojson,.kml';
        fileInput.style.display = 'none';

        const button = L.DomUtil.create('a', '', container);
        button.href = '#';
        button.title = 'Upload Shapefile (.zip), GeoJSON or KML';
        button.innerHTML = '⬆️';

        fileInput.addEventListener('change', async (e: any) => {
          const file = e.target.files[0];
          if (!file) return;

          try {
            let geojson: any;

            if (file.name.endsWith('.zip')) {
              const arrayBuffer = await file.arrayBuffer();
              geojson = await shp(arrayBuffer);
            } else if (file.name.endsWith('.json') || file.name.endsWith('.geojson')) {
              const text = await file.text();
              geojson = JSON.parse(text);
            } else if (file.name.endsWith('.kml')) {
              const text = await file.text();
              const parser = new DOMParser();
              const kmlDoc = parser.parseFromString(text, 'text/xml');
              geojson = toGeoJSON.kml(kmlDoc as any);
            } else {
              alert('Unsupported file format. Please upload a .zip, .geojson/.json, or .kml file');
              return;
            }

            this.drawnItems.clearLayers();
            const layer = L.geoJSON(geojson).addTo(this.drawnItems);
            this.map.fitBounds(layer.getBounds());

            if (layer.getLayers().length > 0) {
              const polygon = layer.getLayers()[0] as L.Polygon;
              this.lastDrawnBounds = polygon.getBounds();
              this.geometryService.setBounds(this.lastDrawnBounds);
              this.geometryService.setPolygon(polygon);
            }

            console.log('File loaded as GeoJSON:', geojson);
          } catch (err) {
            console.error('Failed to read file:', err);
          }
        });

        L.DomEvent.on(button, 'click', L.DomEvent.stop)
          .on(button, 'click', () => fileInput.click());

        return container;
      }
    });
    this.map.addControl(new UploadControl());

    // Scale
    L.control.scale({ position: 'bottomleft', imperial: false }).addTo(this.map);

    // Locate control
    const self = this;
    const LocateControl = (L.Control as any).extend({
      options: { position: 'topright' },
      onAdd() {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        const link = L.DomUtil.create('a', '', container);
        link.href = '#';
        link.title = 'Locate me';
        link.innerHTML = '⌖';
        L.DomEvent.on(link, 'click', L.DomEvent.stop)
          .on(link, 'click', () => self.locateMe());
        return container;
      }
    });
    this.map.addControl(new LocateControl());

    // Mouse + zoom updates
    this.zoomLevel = this.map.getZoom();
    this.map.on('mousemove', (e: L.LeafletMouseEvent) => {
      this.statusLat = e.latlng.lat;
      this.statusLng = e.latlng.lng;
    });
    this.map.on('zoomend', () => {
      this.zoomLevel = this.map.getZoom();
      this.updateUrlFromMap();
    });
    this.map.on('moveend', () => {
      this.updateUrlFromMap();
    });

    // Handle draw-created
    this.map.on(L.Draw.Event.CREATED, async (e: any) => {
      const layer = e.layer;
      this.drawnItems.clearLayers();
      this.drawnItems.addLayer(layer);
      if (layer instanceof L.Polygon) {
        this.lastDrawnBounds = layer.getBounds();
        this.map.fitBounds(this.lastDrawnBounds);
        console.log('Polygon drawn, bounds:', this.lastDrawnBounds);
        this.geometryService.setBounds(this.lastDrawnBounds);
        this.geometryService.setPolygon(layer);
      }
    });

    // Watch OGC params
    this.ogcParamsSubscription = this.ogcService.params$.subscribe((params: OgcParams) => {
      this.updateMapWithParams(params);
    });
  }

  get statusText(): string {
    if (this.statusLat === null || this.statusLng === null) return '';
    return `${this.statusLat.toFixed(5)}, ${this.statusLng.toFixed(5)} | z ${this.zoomLevel}`;
  }

  private updateUrlFromMap(): void {
    const center = this.map.getCenter();
    const z = this.map.getZoom();
    const params = new URLSearchParams(window.location.search);
    params.set('lat', center.lat.toFixed(5));
    params.set('lng', center.lng.toFixed(5));
    params.set('z', String(z));
    params.set('layer', this.currentBaseName);
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    history.replaceState({}, '', newUrl);
  }

  private locateMe(): void {
    if (!navigator.geolocation) {
      console.warn('Geolocation not available');
      return;
    }
    navigator.geolocation.getCurrentPosition((pos) => {
      const latlng: L.LatLngExpression = [pos.coords.latitude, pos.coords.longitude];
      if (this.locateMarker) {
        this.map.removeLayer(this.locateMarker);
      }
      this.locateMarker = L.marker(latlng);
      this.locateMarker.addTo(this.map);
      this.map.setView(latlng, Math.max(this.map.getZoom(), 10));
    }, (err) => {
      console.warn('Geolocation error', err);
    }, { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 });
  }

  async updateMapWithParams(params: OgcParams) {
    if (!params.startDate || !params.endDate || !params.selectedLayer || params.cloudPercentage === null) {
      console.warn('Missing required parameters, skipping image overlay.');
      this.imageMetadata = null;
      return;
    }

    if (!this.lastDrawnBounds) {
      console.warn('No polygon drawn. Please draw one before requesting the map.');
      this.imageMetadata = null;
      return;
    }

    let areaName = 'Unknown Area';
    try {
      const drawnPolygon = this.drawnItems.getLayers()[0] as L.Polygon;
      if (drawnPolygon) {
        const centroid = this.calculateCentroid(drawnPolygon);
        areaName = await this.getAreaName(centroid);
      }
    } catch (error) {
      console.warn('Failed to get area name:', error);
    }

    const formattedStartTime = new Date(params.startDate).toISOString().split('.')[0] + 'Z';
    const formattedEndTime = new Date(params.endDate).toISOString().split('.')[0] + 'Z';
    const sw = this.lastDrawnBounds.getSouthWest();
    const ne = this.lastDrawnBounds.getNorthEast();
    const bbox = `${sw.lat},${sw.lng},${ne.lat},${ne.lng}`;

    const imageUrl = `https://sh.dataspace.copernicus.eu/ogc/wms/2e44e6fc-1f1c-4258-bd09-8a15c317f604?` +
      `SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=${params.selectedLayer}` +
      `&BBOX=${bbox}&CRS=EPSG:4326&WIDTH=2500&HEIGHT=2500&FORMAT=image/png` +
      `&TIME=${formattedStartTime}/${formattedEndTime}&MAXCC=${params.cloudPercentage}`;

    if (this.imageOverlay) {
      this.map.removeLayer(this.imageOverlay);
    }

    this.imageOverlay = L.imageOverlay(imageUrl, this.lastDrawnBounds, {
      opacity: 1,
      crossOrigin: true,
    });
    this.imageOverlay.addTo(this.map);

    this.imageMetadata = {
      areaName: areaName,
      startDate: new Date(params.startDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      endDate: new Date(params.endDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      layer: params.selectedLayer.replace('-L2A', '').replace('_', ' '),
      isVisible: true
    };

    console.log('WMS Image URL:', imageUrl);
    this.ogcService.setWmsUrl(imageUrl);
    this.map.fitBounds(this.lastDrawnBounds);
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

  hideMetadata(): void {
    if (this.imageMetadata) {
      this.imageMetadata.isVisible = false;
    }
  }

  clearImageOverlay(): void {
    if (this.imageOverlay) {
      this.map.removeLayer(this.imageOverlay);
      this.imageOverlay = null;
    }
    this.imageMetadata = null;
  }

  ngOnDestroy(): void {
    this.baseMapSubscription?.unsubscribe();
    this.ogcParamsSubscription?.unsubscribe();
  }
}
