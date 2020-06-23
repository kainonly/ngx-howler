import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NgxHowlerComponent } from './ngx-howler.component';

describe('NgxHowlerComponent', () => {
  let component: NgxHowlerComponent;
  let fixture: ComponentFixture<NgxHowlerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NgxHowlerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NgxHowlerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
