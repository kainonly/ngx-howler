import { Injectable } from '@angular/core';
import { Howl as HowlClass, HowlOptions } from 'howler';
import { AsyncSubject, fromEvent, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

declare let Howl: any;
declare let document: Document;

@Injectable()
export class NgxHowlerService {
  private loaded: AsyncSubject<any>;
  private audio: Map<string, HowlClass> = new Map<string, HowlClass>();

  /**
   * load script
   */
  loadScript(url: string): void {
    this.loaded = new AsyncSubject<any>();
    const scripts = document.createElement('script');
    scripts.setAttribute('type', 'text/javascript');
    scripts.setAttribute('src', url);
    document.body.appendChild(scripts);
    fromEvent(scripts, 'load').subscribe(() => {
      this.loaded.next(Howl);
      this.loaded.complete();
    });
    fromEvent(scripts, 'error').subscribe(() => {
      console.warn('howler load failed');
    });
  }

  /**
   * register audio
   */
  register(id: string, option: HowlOptions): Observable<any> {
    return this.loaded.pipe(
      map(howl => {
        this.audio.set(id, new howl(option));
        return this.audio.has(id);
      })
    );
  }

  /**
   * get audio
   */
  get(id: string): HowlClass {
    return this.audio.get(id);
  }

  /**
   * unregister audio
   */
  unregister(id: string): boolean {
    if (!this.audio.has(id)) {
      return true;
    }
    this.audio.get(id).off();
    return this.audio.delete(id);
  }
}
