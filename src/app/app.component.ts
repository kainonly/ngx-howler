import { Component, OnInit } from '@angular/core';
import { NgxHowlerService } from 'ngx-howler';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  constructor(
    private howler: NgxHowlerService
  ) {
  }

  ngOnInit() {
    this.howler.register('dev', {
      src: ['https://cdn.kainonly.com/sound/ping.mp3'],
      html5: true
    }).subscribe(status => {
      // ok
    });
  }

  play() {
    this.howler.get('dev').play();
  }
}
