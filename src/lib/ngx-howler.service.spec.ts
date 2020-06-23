import { TestBed } from '@angular/core/testing';

import { NgxHowlerService } from './ngx-howler.service';

describe('NgxHowlerService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: NgxHowlerService = TestBed.get(NgxHowlerService);
    expect(service).toBeTruthy();
  });
});
