# ngx-howler

Audio library based on howler.js for Angular

[![npm](https://img.shields.io/npm/v/ngx-howler.svg?style=flat-square)](https://www.npmjs.com/package/ngx-howler)
[![Downloads](https://img.shields.io/npm/dm/ngx-howler.svg?style=flat-square)](https://www.npmjs.com/package/ngx-howler)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-blue.svg?style=flat-square)](https://www.typescriptlang.org/)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](https://github.com/kainonly/ngx-howler/blob/master/LICENSE)

### Setup

```shell
npm install ngx-howler --save
```

### Configuration

Load howler.js library, you can use local or external CDN

```typescript
export class AppModule {
  constructor(
    ngxHowlerService: NgxHowlerService
  ) {
    ngxHowlerService.loadScript('https://cdnjs.cloudflare.com/ajax/libs/howler/2.2.0/howler.min.js');
  }
}
```

### Usage

Register an audio object

```typescript
export class ExampleComponent implements OnInit {
  constructor(
    public howl: NgxHowlerService
  ) {
  }

  ngOnInit() {
    this.howl.register('dev', {
      src: ['sound.mp3'],
      html5: true
    }).subscribe(status => {
      // ok
    });
  }
}
```

Play this audio object

```typescript
export class ExampleComponent implements OnInit {
  constructor(
    public howl: NgxHowlerService
  ) {
  }

  play() {
    this.howl.get('dev').play();
  }
}
```

If howler's listen event is used, you need to manually cancel the listen when the page is destroyed

```typescript
export class ExampleComponent implements OnInit {
  constructor(
    public howl: NgxHowlerService
  ) {
  }

  ngOnInit() {
    this.howl.get('dev').on('load', () => {
      // ...
    });
  }

  ngOnDestroy() {
    this.howl.get('dev').off();
  }
}
```

Unregistered audio object

```typescript
export class ExampleComponent implements OnInit {
  constructor(
    public howl: NgxHowlerService
  ) {
  }

  unregister() {
    this.howl.unregister('dev');
  }
}
```
