import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatGridListModule, MatToolbarModule, MatButtonModule,
  MatDatepickerModule, MatNativeDateModule, MatSelectModule,
  MatInputModule, MatCardModule, MatListModule} from '@angular/material';
import {DragDropModule} from '@angular/cdk/drag-drop';
import {FullscreenOverlayContainer, OverlayContainer} from '@angular/cdk/overlay';

const importModules = [
  CommonModule,
  MatGridListModule,
  MatToolbarModule,
  MatButtonModule,
  MatDatepickerModule,
  MatNativeDateModule,
  DragDropModule,
  MatInputModule,
  MatSelectModule,
  MatCardModule,
  MatListModule];

@NgModule({
  providers: [{provide: OverlayContainer, useClass: FullscreenOverlayContainer}],
  imports: [
    ...importModules
  ],
  exports: [
    ...importModules
  ],
})
export class CustomMaterialModule { }
