import { Component, OnInit } from '@angular/core';

import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { OSM, Vector as VectorSource } from 'ol/source';
import { Fill, Stroke, Style, Text } from 'ol/style';

import { fromLonLat, transform } from 'ol/proj';
import { Feature } from 'ol';

import Polygon from 'ol/geom/Polygon';



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

  transformCoords(coords: number[]) {
    return transform(coords, 'urn:ogc:def:crs:OGC:1.3:CRS84', 'EPSG:3857');
  }

  ngOnInit() {
    this.vectorSource = new VectorSource();

    this.vectorSource.addFeatures([
      new Feature(new Polygon(
        [[
          this.transformCoords([7.569630, 47.56665]),
          this.transformCoords([7.571700, 47.56661]),
          this.transformCoords([7.571290, 47.56481]),
          this.transformCoords([7.569630, 47.56665])
        ]]
      ))
    ]);

    this.vectorLayer = new VectorLayer({
      source: this.vectorSource,
      style: vectorStyleFunction
    });

    function vectorStyleFunction(feature, resolution) {
      return new Style({
        stroke: new Stroke({
          color: 'green',
          width: 5
        }),
        fill: new Fill({
          color: 'blue'
        })
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
