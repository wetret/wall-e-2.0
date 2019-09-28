import { Injectable } from '@angular/core';
import {Observable} from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  private places: Observable<any[]>;
  private placesUrl = '';

  constructor(private http: HttpClient) { }

  getPlaces(): Observable<any[]> {
    return this.http.get<any[]>(this.placesUrl);
  }
}
