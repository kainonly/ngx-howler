import { TestBed } from '@angular/core/testing';
import { NgxHowlerService } from './ngx-howler.service';

describe('NgxHowlerService', () => {
  let service: NgxHowlerService;

  beforeEach(() => {
    if (!service) {
      TestBed.configureTestingModule({
        providers: [
          NgxHowlerService
        ]
      });
      service = TestBed.get(NgxHowlerService);
      service.loadScript('https://cdnjs.cloudflare.com/ajax/libs/howler/2.2.0/howler.min.js');
    }
  });

  it('should be register', (done) => {
    service.register('dev', {
      src: ['https://cdn.kainonly.com/sound/new-task.mp3'],
      html5: true
    }).subscribe(status => {
      expect(status).toBeTruthy();
      done();
    });
  });

  it('should be play', () => {
    const result = service.get('dev').play();
    expect(result).not.toBeNull();
  });

  it('should be unregister', () => {
    const result = service.unregister('dev');
    expect(result).toBeTruthy();
  });
});
