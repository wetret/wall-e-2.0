import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {

  @Input() state: string;
  @Output() averageClick = new EventEmitter();
  @Output() recommendGo = new EventEmitter();

  constructor() { }

  ngOnInit() {
  }

  averageDataClick() {
    this.averageClick.emit();
  }

  recommend() {
    this.recommendGo.emit();
  }
}
