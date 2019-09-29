import { Component, OnInit } from '@angular/core';

import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { OSM, Vector as VectorSource } from 'ol/source';
import { Fill, Stroke, Style, Text } from 'ol/style';
import { DataService} from './data.service';
import MousePosition from 'ol/control/MousePosition';
import { fromLonLat, transform } from 'ol/proj';
import { Feature } from 'ol';
import {defaults as defaultControls} from 'ol/control';

import Polygon from 'ol/geom/Polygon';
import LineString from 'ol/geom/LineString';
import Point from 'ol/geom/Point';
import { createStringXY } from 'ol/coordinate';
import { Place } from './place.interface';
import { PlaceInfo } from './placeinfo.interface';


function mixColors(c1: number[], c2: number[], t: number) {
  return [c1[0] * (1 - t) + c2[0] * t, c1[1] * (1 - t) + c2[1] * t, c1[2] * (1 - t) + c2[2] * t];
}

function getColorFromCCI(cci: number) {
  let r;
  let g;
  if (cci < 2.5) {
    r = 255;
    g = cci * 102;
  } else {
    r = 2.5 * (cci - 2.5) * 102;
    g = 255;
  }
  return [r, g, 0];
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  private initialLatitude = 7.5715701;
  private initialLongitude = 47.5661319;
  private places;

  minDate = new Date(2019, 3, 1);
  maxDate = new Date(2019, 8, 28);

  private map: Map;
  private vectorLayer: VectorLayer;
  private vectorSource: VectorSource;

  private allPolygons: Feature[] = [];
  private allLines: Feature[] = [];

  // TODO subscribe to Observables
  constructor(private dataService: DataService) {}

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

    this.getPlaces().subscribe(places => {
      this.places = places;
      places.forEach(place => {
        if (place.coordinates.substr(0, 4) === 'LINE') {
          this.addLinePlacesToVectorLayer([place]);
        } else {
          this.addPolygonPlacesToVectorLayer([place]);
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

  addLinePlacesToVectorLayer(places: Place[]) {
    for (const p of places) {
      const feature = new Feature(this.lineFromString(p.coordinates));
      feature["placeInfo"] = {cci: p.cci, name: p.name, type: p.type } as PlaceInfo;
      const cci = p.cci;
      const color = getColorFromCCI(cci);
      const style = new Style({
        stroke: new Stroke({
          color: [color[0], color[1], color[2]],
          width: 5
        }),
        fill: new Fill({
          color: [color[0], color[1], color[2], 0.2]
        })
      });

      feature.setStyle(style);
      this.allLines.push(feature);
      this.vectorSource.addFeature(feature);
    }
  }

  addPolygonPlacesToVectorLayer(places: Place[]) {
    for (const p of places) {
      const feature = new Feature(this.polygonFromString(p.coordinates));
      feature["placeInfo"] = {cci: p.cci, name: p.name, type: p.type } as PlaceInfo;
      const cci = p.cci;
      const color = getColorFromCCI(cci);
      const style = new Style({
        stroke: new Stroke({
          color: [color[0], color[1], color[2]],
          width: 5
        }),
        fill: new Fill({
          color: [color[0], color[1], color[2], 0.2]
        })
      });

      feature.setStyle(style);
      this.allPolygons.push(feature);
      this.vectorSource.addFeature(feature);
    }
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
    const HIGHLIGHT_COLOR = [0, 0, 255];
    setInterval(function(allLines, allPolygons) {
      const domElement = document.getElementById('mouse-position');
      const coords = domElement.firstElementChild.innerHTML.split(', ').map(s => parseFloat(s));
      if (isNaN(coords[0])) {
        return;
      }
      let highestAnimationValue = 0;
      let highestAnimationElement;
      let shortestValue = 2000;
      let shortestElement: Feature;
      for (const l of allLines) {
        const c = (l.getGeometry() as LineString).getClosestPoint(coords);
        const d = (c[0] - coords[0]) * (c[0] - coords[0]) + (c[1] - coords[1]) * (c[1] - coords[1]);
        if (d < shortestValue) {
          shortestValue = d;
          shortestElement = l;
        }

        if (l["active"] > 0) {
          l["active"] -= ANIMATION_STEP;
          if (l["active"] > highestAnimationValue) {
            highestAnimationValue = l["active"];
            highestAnimationElement = l;
          }
          const T = l["active"] / ANIMATION_MAX;
          const cciColor = getColorFromCCI(l["placeInfo"].cci);
          const mixColor = mixColors(HIGHLIGHT_COLOR, cciColor, 1 - T);
          const style = new Style({
            stroke: new Stroke({
              color: mixColor,
              width: 15 * T + 5
            }),
            fill: new Fill({
              color: [mixColor[0], mixColor[1], mixColor[2], 0.5 * T]
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

        if (l["active"] > 0) {
          l["active"] -= ANIMATION_STEP;
          if (l["active"] > highestAnimationValue) {
            highestAnimationValue = l["active"];
            highestAnimationElement = l;
          }
          const T = l["active"] / ANIMATION_MAX;
          const cciColor = getColorFromCCI(l["placeInfo"].cci);
          const mixColor = mixColors(HIGHLIGHT_COLOR, cciColor, 1 - T);
          const style = new Style({
            stroke: new Stroke({
              color: mixColor,
              width: 15 * T + 5
            }),
            fill: new Fill({
              color: [mixColor[0], mixColor[1], mixColor[2], 0.5 * T]
            })
          });
          l.setStyle(style);
        }
      }

      // disable or enable mouseover
      if (highestAnimationValue > (ANIMATION_MAX * 0.85)) {
        const placeInfo = (highestAnimationElement["placeInfo"] as PlaceInfo);
        document.getElementById("tooltip-span").style.display = 'block';
        document.getElementById("card-title").innerHTML = placeInfo.name;
        document.getElementById("card-subtitle").innerHTML = placeInfo.type === 'no type found' ? '' : placeInfo.type;
        document.getElementById("card-list-item-1").innerHTML = '<strong>Cleanliness: ' + (Math.round(placeInfo.cci * 100) / 100) + ' / 5</strong>';
        document.getElementById("card-list-item-2").innerHTML = ''; // 'Frequent: 🧠💉🍾📰💩🚬🗿 ';
      } else {
        document.getElementById("tooltip-span").style.display = 'none';
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
      shortestElement["active"] = ANIMATION_MAX;
    }.bind(undefined, this.allLines, this.allPolygons), 50);
    return mousePositionControl;
  }

  getPlaces() {
    return this.dataService.getPlaces('evening');
  }
}
