import {Component, OnInit} from '@angular/core';

import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer';
import {OSM, Vector as VectorSource} from 'ol/source';
import {Fill, Stroke, Style} from 'ol/style';
import {DataService} from './data.service';
import MousePosition from 'ol/control/MousePosition';
import {fromLonLat, transform} from 'ol/proj';
import {Feature} from 'ol';
import {defaults as defaultControls} from 'ol/control';
import {DatePipe} from '@angular/common';
import Polygon from 'ol/geom/Polygon';
import LineString from 'ol/geom/LineString';
import {createStringXY} from 'ol/coordinate';
import {FormControl, FormGroup, Validators} from '@angular/forms';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  private initialLatitude = 7.5715701;
  private initialLongitude = 47.5661319;
  private places;
  private dataForm = new FormGroup({});

  minDate = new Date(2019, 3, 1);
  maxDate = new Date(2019, 8, 28);

  private map: Map;
  private vectorLayer: VectorLayer;
  private vectorSource: VectorSource;

  private allPolygons: Feature[] = [];
  private allLines: Feature[] = [];

  constructor(private dataService: DataService, private datePipe: DatePipe) {
    this.dataForm.addControl('date', new FormControl([
      Validators.required]));
    this.dataForm.addControl('time', new FormControl([
      Validators.required]));
  }

  ngOnInit() {
    this.vectorSource = new VectorSource();
    this.vectorLayer = new VectorLayer({
      source: this.vectorSource
    });

    this.map = new Map({
      target: 'map',
      controls: defaultControls().extend([this.setupMouse()]),
      layers: [
        new TileLayer({
          source: new OSM({url: 'https://{a-c}.tile.openstreetmap.de/{z}/{x}/{y}.png'})
        }),
        this.vectorLayer
      ],
      view: new View({
        center: fromLonLat([this.initialLatitude, this.initialLongitude]),
        zoom: 16
      })
    });

    this.getPlaces('2019-08-30/evening').subscribe(places => {
      this.places = places;
      const polygons = places.filter(place => place.coordinates.substr(0, 4) === 'LINE');
      places.forEach(place => {
        if (place.coordinates.substr(0, 4) === 'LINE') {
          this.addLinesToVectorLayer([place.coordinates]);
        } else {
          this.addPolygonsToVectorLayer([place.coordinates]);
        }
      });
    });
  }

  polygonFromString(input: string): Polygon {
    const cutInput = input.substr(input.indexOf('((') + 2, input.length - input.indexOf('((') - 4);
    const coordPairs = cutInput.split(', ');
    const splitCoordPairs = coordPairs.map((s) => this.transformCoords(s.split(' ')));

    return new Polygon(
      [splitCoordPairs]
    );
  }

  lineFromString(input: string) {
    const cutInput = input.substr(input.indexOf('(') + 1, input.length - input.indexOf('(') - 2);
    const coordPairs = cutInput.split(', ');
    const splitCoordPairs = coordPairs.map((s) => this.transformCoords(s.split(' ')));

    return new LineString(
      [splitCoordPairs[0], splitCoordPairs[1]]
    );
  }

  transformCoords(stringCoords: string[]) {
    return transform(stringCoords.map(s => parseFloat(s)), 'urn:ogc:def:crs:OGC:1.3:CRS84', 'EPSG:3857');
  }

  addLinesToVectorLayer(lines: string[]) {
    const features = lines.map(s => new Feature(this.lineFromString(s)));
    features.forEach(f => {
      const cci = Math.random() * 5;
      let r;
      let g;
      if (cci < 2.5) {
        r = 255;
        g = cci * 102;
      } else {
        r = 2.5 * (cci - 2.5) * 102;
        g = 255;
      }

      const style = new Style({
        stroke: new Stroke({
          color: [r, g, 0],
          width: 5
        }),
        fill: new Fill({
          color: [r, g, 0, 0.2]
        })
      });

      f.setStyle(style);
    });
    this.allLines.push(...features);
    this.vectorSource.addFeatures(features);
  }

  addPolygonsToVectorLayer(polygons: string[]) {
    const features = polygons.map(s => new Feature(this.polygonFromString(s)));
    features.forEach(f => {
      const cci = Math.random() * 5;
      let r;
      let g;
      if (cci < 2.5) {
        r = 255;
        g = cci * 102;
      } else {
        r = 2.5 * (cci - 2.5) * 102;
        g = 255;
      }

      const style = new Style({
        stroke: new Stroke({
          color: [r, g, 0],
          width: 3
        }),
        fill: new Fill({
          color: [r, g, 0, 0.2]
        })
      });

      f.setStyle(style);
    });
    this.allPolygons.push(...features);
    this.vectorSource.addFeatures(features);
  }

  resetVectorLayer() {
    this.vectorSource.clear();
  }

  getEvents() {
    return this.dataService.getEvents();
  }

  setupMouse() {
    const tooltipSpan = document.getElementById('tooltip-span');
    window.onmousemove = (e) => {
      const x = e.clientX;
      const y = e.clientY;
      tooltipSpan.style.top = (y + 20) + 'px';
      tooltipSpan.style.left = (x + 20) + 'px';
    };

    const domElement = document.getElementById('mouse-position');
    const mousePositionControl = new MousePosition({
      coordinateFormat: createStringXY(4),
      projection: 'EPSG:3857',
      // comment the following two lines to have the mouse position
      // be placed within the map.
      className: 'mouse-position',
      target: domElement,
      undefinedHTML: '&nbsp;'
    });
    const ANIMATION_MAX = 3000;
    const ANIMATION_STEP = 350;
    setInterval(function(allLines, allPolygons) {
      const domElement = document.getElementById('mouse-position');
      const coords = domElement.firstElementChild.innerHTML.split(', ').map(s => parseFloat(s));
      if (isNaN(coords[0])) {
        return;
      }
      let highestAnimationValue = 0;
      let shortestValue = 2000;
      let shortestElement: Feature;
      for (const l of allLines) {
        const c = (l.getGeometry() as LineString).getClosestPoint(coords);
        const d = (c[0] - coords[0]) * (c[0] - coords[0]) + (c[1] - coords[1]) * (c[1] - coords[1]);
        if (d < shortestValue) {
          shortestValue = d;
          shortestElement = l;
        }

        if (l['active'] > 0) {
          l['active'] -= ANIMATION_STEP;
          if (l['active'] > highestAnimationValue) {
            highestAnimationValue = l['active'];
          }
          const style = new Style({
            stroke: new Stroke({
              color: [0, 0, 255 * l['active'] / ANIMATION_MAX],
              width: 20 * (l['active'] / ANIMATION_MAX) + 5
            })
          });
          l.setStyle(style);
        }
      }
      for (const l of allPolygons) {
        const c = (l.getGeometry() as Polygon).getClosestPoint(coords);
        const d = (c[0] - coords[0]) * (c[0] - coords[0]) + (c[1] - coords[1]) * (c[1] - coords[1]);
        if (d < shortestValue + 1000) {
          shortestValue = d + 1000;
          shortestElement = l;
        }

        if (l['active'] > 0) {
          l['active'] -= ANIMATION_STEP;
          if (l['active'] > highestAnimationValue) {
            highestAnimationValue = l['active'];
          }
          const T = l['active'] / ANIMATION_MAX;
          const style = new Style({
            stroke: new Stroke({
              color: [0, 128 * T, 255 * T],
              width: 15 * T + 5
            }),
            fill: new Fill({
              color: [0, 128 * T, 255 * T, 0.5 * T]
            })
          });
          l.setStyle(style);
        }
      }

      // disable or enable mouseover
      if (highestAnimationValue > (ANIMATION_MAX * 0.85)) {
        document.getElementById('tooltip-span').style.display = 'block';
      } else {
        document.getElementById('tooltip-span').style.display = 'none';
      }
      if (!shortestElement) {
        return;
      }

      const style = new Style({
        stroke: new Stroke({
          color: [0, 0, 255],
          width: 15
        }),
        fill: new Fill({
          color: [0, 0, 255, 0.5]
        })
      });
      shortestElement.setStyle(style);
      shortestElement['active'] = ANIMATION_MAX;
    }.bind(undefined, this.allLines, this.allPolygons), 50);
    return mousePositionControl;
  }

  getPlaces(time: string) {
    return this.dataService.getPlaces(time);
  }

  updateMap() {
    const form = this.dataForm.value;
    const momentDate = new Date(form.date); // Replace event.value with your date value
    const dateString = this.datePipe.transform(momentDate, 'yyyy-MM-dd');

    this.getPlaces(dateString + '/' + form.time).subscribe(places => {
      this.places = places;
      const polygons = places.filter(place => place.coordinates.substr(0, 4) === 'LINE');
      places.forEach(place => {
        if (place.coordinates.substr(0, 4) === 'LINE') {
          this.addLinesToVectorLayer([place.coordinates]);
        } else {
          this.addPolygonsToVectorLayer([place.coordinates]);
        }
      });
    });

  }
}
