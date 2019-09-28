import {Component, OnInit} from '@angular/core';

declare var ol: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'garbage-map';

  initialLatitude = 7.5868;
  initialLongitude = 47.5585;

  map: any;
  vectorLines: any;

  ngOnInit() {
    this.vectorLines = new ol.layer.Vector({
      source: new ol.source.Vector({
        url: 'https://openlayers.org/en/latest/examples/data/geojson/polygon-samples.geojson',
        format: new ol.format.GeoJSON()
      }),
      style: lineStyleFunction
    });

    function lineStyleFunction(feature, resolution) {
      return new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: 'green',
          width: 2
        }),
        text: null
      });
    }

    this.map = new ol.Map({
      target: 'map',
      layers: [
        new ol.layer.Tile({
          source: new ol.source.OSM()
        }),
        this.vectorLines
      ],
      view: new ol.View({
        /*center: ol.proj.fromLonLat([this.initialLatitude, this.initialLongitude]),
        zoom: 15*/
        center: [-8161939, 6095025],
        zoom: 8
      })
    });
  }
}
