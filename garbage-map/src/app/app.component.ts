import { Component, OnInit } from '@angular/core';

import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { OSM, Vector as VectorSource } from 'ol/source';
import { Fill, Stroke, Style, Text } from 'ol/style';
import { DataService } from './data.service';
import MousePosition from 'ol/control/MousePosition';
import { fromLonLat, transform } from 'ol/proj';
import { Feature } from 'ol';
import { defaults as defaultControls } from 'ol/control';
import { DatePipe } from '@angular/common';
import Polygon from 'ol/geom/Polygon';
import LineString from 'ol/geom/LineString';
import Point from 'ol/geom/Point';
import { createStringXY } from 'ol/coordinate';
import { Place } from './place.interface';
import { PlaceInfo } from './placeinfo.interface';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ThrowStmt } from '@angular/compiler';
import { AverageInfo } from './averageinfo.interface';
import { Average } from './average.interface';


function mixColors(c1: number[], c2: number[], t: number) {
  return [c1[0] * (1 - t) + c2[0] * t, c1[1] * (1 - t) + c2[1] * t, c1[2] * (1 - t) + c2[2] * t];
}

function getColorFromCCI(cci: number) {
  let r;
  let g;
  if (cci < 4) {
    r = 255;
    g = cci * 64;
  } else {
    r = (cci - 4) * 255;
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
  private dataForm = new FormGroup({});

  minDate = new Date(2019, 3, 1);
  maxDate = new Date(2019, 8, 28);

  private map: Map;
  private vectorLayer: VectorLayer;
  private vectorSource: VectorSource;

  private allPolygons: Feature[] = [];
  private allLines: Feature[] = [];
  private internalState = '2019-08-30 evening';

  constructor(private dataService: DataService, private datePipe: DatePipe) {
    this.dataForm.addControl('date', new FormControl("2019-08-25", [
      Validators.required]));
    this.dataForm.addControl('time', new FormControl("evening", [
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
          source: new OSM({ url: 'https://{a-c}.tile.openstreetmap.de/{z}/{x}/{y}.png' })
        }),
        this.vectorLayer
      ],
      view: new View({
        center: fromLonLat([this.initialLatitude, this.initialLongitude]),
        zoom: 16
      })
    });

    this.updateMap();
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
      feature["placeInfo"] = { cci: p.cci, name: p.name, type: p.type } as PlaceInfo;
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
      feature["placeInfo"] = { cci: p.cci, name: p.name, type: p.type } as PlaceInfo;
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

  addLineAveragesToVectorLayer(averages: Average[]) {
    for (const p of averages) {
      const feature = new Feature(this.lineFromString(p.coordinates));
      feature["averageInfo"] = { cci: p.cci, name: p.name, type: p.type, 
  rateGums: p.rateGums,
  rateSyringues: p.rateSyringues,
  rateLeaves: p.rateLeaves,
  rateGlassDebris: p.rateGlassDebris,
  rateBottles: p.rateBottles,
  ratePapers: p.ratePapers,
  rateExcrements: p.rateExcrements,
  rateCigarrettes: p.rateCigarrettes,
  rateGrits: p.rateGrits, } as AverageInfo;
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

  addPolygonAveragesToVectorLayer(averages: Average[]) {
    for (const p of averages) {
      const feature = new Feature(this.polygonFromString(p.coordinates));
      feature["averageInfo"] = { cci: p.cci, name: p.name, type: p.type, 
        rateGums: p.rateGums,
        rateSyringues: p.rateSyringues,
        rateLeaves: p.rateLeaves,
        rateGlassDebris: p.rateGlassDebris,
        rateBottles: p.rateBottles,
        ratePapers: p.ratePapers,
        rateExcrements: p.rateExcrements,
        rateCigarrettes: p.rateCigarrettes,
        rateGrits: p.rateGrits, } as AverageInfo;
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
    setInterval(function (_this) {
      const domElement = document.getElementById('mouse-position');
      const coords = domElement.firstElementChild.innerHTML.split(', ').map(s => parseFloat(s));
      if (isNaN(coords[0])) {
        return;
      }
      let highestAnimationValue = 0;
      let highestAnimationElement;
      let shortestValue = 2000;
      let shortestElement: Feature;
      for (const l of _this.allLines) {
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
          const cciColor = getColorFromCCI("placeInfo" in l ? l["placeInfo"].cci : l["averageInfo"].cci);
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
      for (const l of _this.allPolygons) {
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
          const cciColor = getColorFromCCI("placeInfo" in l ? l["placeInfo"].cci : l["averageInfo"].cci);
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
        const info = "placeInfo" in highestAnimationElement ? (highestAnimationElement["placeInfo"] as PlaceInfo) : (highestAnimationElement["averageInfo"] as AverageInfo);
        document.getElementById("tooltip-span").style.display = 'block';
        document.getElementById("card-title").innerHTML = info.name === 'no name found' ? '' : info.name;
        document.getElementById("card-subtitle").innerHTML = (info.type === 'no type found' || !(info.type)) ? '' : info.type;
        document.getElementById("card-list-item-1").innerHTML = '<strong>Cleanliness: ' + (Math.round(info.cci * 100) / 100) + ' / 5</strong>';
        if ("averageInfo" in highestAnimationElement) {
          let s = ""
          console.log((highestAnimationElement["averageInfo"] as AverageInfo))
          s += ((highestAnimationElement["averageInfo"] as AverageInfo).rateCigarrettes > 0.41) ? '🚬' : '';
          s += ((highestAnimationElement["averageInfo"] as AverageInfo).rateBottles > 0.15) ? '🍾' : '';
          s += ((highestAnimationElement["averageInfo"] as AverageInfo).rateGums > 0) ? '🧠' : '';
          s += ((highestAnimationElement["averageInfo"] as AverageInfo).rateSyringues > 0) ? '💉' : '';
          s += ((highestAnimationElement["averageInfo"] as AverageInfo).ratePapers > 0.56) ? '📰' : '';
          s += ((highestAnimationElement["averageInfo"] as AverageInfo).rateExcrements > 0) ? '💩' : '';
          s += ((highestAnimationElement["averageInfo"] as AverageInfo).rateLeaves > 0.007) ? '🍂' : '';
          s += ((highestAnimationElement["averageInfo"] as AverageInfo).rateGlassDebris > 0.0009) ? '✨' : '';
          if (!(s === '')) {
            document.getElementById("card-list-item-2").innerHTML = 'Frequent: ' + s; 
          }
        } else {
          document.getElementById("card-list-item-2").innerHTML = ''; 
        }
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
    }.bind(undefined, this), 50);
    return mousePositionControl;
  }

  getPlaces(time: string) {
    console.log('getplaces call', time);
    return this.dataService.getPlaces(time);
  }

  getAverages() {
    console.log('getplaces call');
    return this.dataService.getAverages();
  }

  recommendGo() {
    // ash tray
    //rateCigarrettes: number;

    // general purpose trash can
    //ratePapers: number;
    //rateGums: number;

    const container = [...this.allLines, ...this.allPolygons];
    container.sort((a, b) => {
      const x1 = (a["averageInfo"] as AverageInfo);
      const x2 = (b["averageInfo"] as AverageInfo);
      return x2.rateCigarrettes - x1.rateCigarrettes ;
    });

    const style = new Style({
      stroke: new Stroke({
        color: [0, 0, 0],
        width: 50
      }),
      fill: new Fill({
        color: [0, 0, 0, 0.2]
      })
    });
    container[0].setStyle(style);
    container[1].setStyle(style);
    container[2].setStyle(style);
    container[3].setStyle(style);
    container[4].setStyle(style);

    for (let i = 5; i < container.length();i++) {
      container[i].setStyle(new Style());
    }
  }

  clearMap() {
    this.map.removeLayer(this.vectorLayer);

    this.vectorSource = new VectorSource();
    this.vectorLayer = new VectorLayer({
      source: this.vectorSource
    });

    this.map.addLayer(this.vectorLayer);

    this.allPolygons = [];
    this.allLines = [];
  }

  updateMap() {

    this.clearMap();

    const form = this.dataForm.value;
    const momentDate = new Date(form.date); // Replace event.value with your date value
    const dateString = this.datePipe.transform(momentDate, 'yyyy-MM-dd');
    this.internalState = dateString + ' ' + form.time;

    this.getPlaces(dateString + '/' + form.time).subscribe(places => {
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

  showAverages() {
    this.clearMap();
    this.internalState = 'Average Data'

    this.getAverages().subscribe(places => {
      this.places = places;
      places.forEach(place => {
        if (place.coordinates.substr(0, 4) === 'LINE') {
          this.addLineAveragesToVectorLayer([place]);
        } else {
          this.addPolygonAveragesToVectorLayer([place]);
        }
      });
    });
  }
}
