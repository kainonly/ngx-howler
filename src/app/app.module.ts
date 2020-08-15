import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { NgxHowlerService } from 'ngx-howler';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [
    NgxHowlerService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor(
    ngxHowlerService: NgxHowlerService
  ) {
    ngxHowlerService.loadScript('https://cdnjs.cloudflare.com/ajax/libs/howler/2.2.0/howler.min.js');

  }
}
