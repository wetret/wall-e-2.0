import { Component, OnInit } from '@angular/core';

import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import GeoJSON from 'ol/format/GeoJSON';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { OSM, Vector as VectorSource } from 'ol/source';
import { Fill, Stroke, Style, Text } from 'ol/style';
import Circle from 'ol/geom/Circle';

import { fromLonLat } from 'ol/proj';
import { Feature } from 'ol';
import LineString from 'ol/geom/LineString';
import Point from 'ol/geom/Point';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'garbage-map';

  initialLatitude = 7.5715701;
  initialLongitude = 47.5661319;

  map: Map;
  vectorLayer: VectorLayer;
  vectorSource: VectorSource;

  ngOnInit() {
    this.vectorSource = new VectorSource();

    this.vectorSource.addFeatures([
      new Feature(
        new LineString([[7.5705014, 47.5668264], [7.5715701, 47.5661319]])
      )
    ]);

    this.vectorLayer = new VectorLayer({
      source: this.vectorSource,
      style: lineStyleFunction
    });

    function lineStyleFunction(feature, resolution) {
      return new Style({
        stroke: new Stroke({
          color: 'green',
          width: 2
        }),
        text: null
      });
    }

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
  }
}
