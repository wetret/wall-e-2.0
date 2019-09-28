import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatGridListModule, MatToolbarModule, MatButtonModule,
  MatDatepickerModule, MatNativeDateModule, MatSelectModule} from '@angular/material';

const importModules = [
  CommonModule,
  MatGridListModule,
  MatToolbarModule,
  MatButtonModule,
  MatDatepickerModule,
  MatNativeDateModule,
  MatSelectModule];

@NgModule({
  imports: [
    ...importModules
  ],
  exports: [
    ...importModules
  ],
})
export class CustomMaterialModule { }
