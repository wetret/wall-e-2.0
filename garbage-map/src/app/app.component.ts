import { Component, OnInit } from '@angular/core';

import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { OSM, Vector as VectorSource } from 'ol/source';
import { Fill, Stroke, Style, Text } from 'ol/style';
import { DataService} from './data.service';

import { fromLonLat, transform } from 'ol/proj';
import { Feature } from 'ol';

import Polygon from 'ol/geom/Polygon';
import LineString from 'ol/geom/LineString';
import Point from 'ol/geom/Point';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  private initialLatitude = 7.5715701;
  private initialLongitude = 47.5661319;

  private map: Map;
  private vectorLayer: VectorLayer;
  private vectorSource: VectorSource;
  private places$;

  constructor(private dataService: DataService) {}

  polygonFromString(input: string): Polygon {
    const cutInput = input.substr(input.indexOf('((') + 2, input.length - input.indexOf('((') - 4);
    const coordPairs = cutInput.split(', ');
    const splitCoordPairs = coordPairs.map((s) => this.transformCoords(s.split(' ')));

    return new Polygon(
      [splitCoordPairs]
    );
  }

  lineFromString(input: string) {
    const cutInput = input.substr(input.indexOf('((') + 2, input.length - input.indexOf('((') - 4);
    const coordPairs = cutInput.split(', ');
    const splitCoordPairs = coordPairs.map((s) => this.transformCoords(s.split(' ')));

    return new LineString(
      [splitCoordPairs[0], splitCoordPairs[1]]
    );
  }

  transformCoords(stringCoords: string[]) {
    return transform(stringCoords.map(s => parseFloat(s)), 'urn:ogc:def:crs:OGC:1.3:CRS84', 'EPSG:3857');
  }

  addPolygon() {
    const testString = 'POLYGON((7.601737973795679 47.532477, 7.601737012793303 47.53249029658966, 7.601734139041156 47.53250346512589, 7.60172938021504 47.53251637878849, 7.601722782145053 47.532528913211834, 7.601714408374216 47.53254094768257, 7.601704339546519 47.53255236630216, 7.601692672630277 47.53256305910307, 7.6016795199842715 47.532572923107764, 7.601665008275673 47.532581863320495, 7.60164927726017 47.532589793642124, 7.601632478436039 47.53259663769933, 7.6016147735851405 47.53260232958008, 7.601596333214867 47.532606814468465, 7.6015773349160645 47.532610049172554, 7.601557961652737 47.53261200254038, 7.6015384 47.53261265575994, 7.601518838347263 47.53261200254038, 7.601499465083935 47.532610049172554, 7.601480466785133 47.532606814468465, 7.601462026414859 47.53260232958008, 7.601444321563961 47.53259663769933, 7.60142752273983 47.532589793642124, 7.601411791724327 47.532581863320495, 7.601397280015728 47.532572923107764, 7.601384127369723 47.53256305910307, 7.601372460453481 47.53255236630216, 7.601362391625784 47.53254094768257, 7.601354017854947 47.532528913211834, 7.60134741978496 47.53251637878849, 7.601342660958844 47.53250346512589, 7.601339787206697 47.53249029658966, 7.601338826204321 47.532477, 7.601339787206697 47.53246370341034, 7.601342660958844 47.53245053487411, 7.60134741978496 47.53243762121151, 7.601354017854947 47.532425086788166, 7.601362391625784 47.53241305231743, 7.601372460453481 47.53240163369784, 7.601384127369723 47.53239094089693, 7.601397280015728 47.532381076892236, 7.601411791724327 47.532372136679506, 7.60142752273983 47.532364206357876, 7.601444321563961 47.53235736230067, 7.601462026414859 47.53235167041992, 7.601480466785133 47.532347185531535, 7.601499465083935 47.532343950827446, 7.601518838347263 47.53234199745962, 7.6015384 47.53234134424006, 7.601557961652737 47.53234199745962, 7.6015773349160645 47.532343950827446, 7.601596333214867 47.532347185531535, 7.6016147735851405 47.53235167041992, 7.601632478436039 47.53235736230067, 7.60164927726017 47.532364206357876, 7.601665008275673 47.532372136679506, 7.6016795199842715 47.532381076892236, 7.601692672630277 47.53239094089693, 7.601704339546519 47.53240163369784, 7.601714408374216 47.53241305231743, 7.601722782145053 47.532425086788166, 7.60172938021504 47.53243762121151, 7.601734139041156 47.53245053487411, 7.601737012793303 47.53246370341034, 7.601737973795679 47.532477))';
    const testLine = '';

    const style = new Style({
      stroke: new Stroke({
        color: 'blue',
        width: 10
      }),
      fill: new Fill({
        color: 'green'
      })
    });

    const feature = new Feature(this.polygonFromString(testString));

    feature.setStyle(style);
    this.vectorSource.addFeatures([
      feature
    ]);
  }

  ngOnInit() {
    this.vectorSource = new VectorSource();
    this.vectorLayer = new VectorLayer({
      source: this.vectorSource
    });

    this.map = new Map({
      target: 'map',
      layers: [
        new TileLayer({
          source: new OSM()
        }),
        this.vectorLayer
      ],
      view: new View({
        center: fromLonLat([this.initialLatitude, this.initialLongitude]),
        zoom: 16
      })
    });

    this.addPolygon();
  }
}
