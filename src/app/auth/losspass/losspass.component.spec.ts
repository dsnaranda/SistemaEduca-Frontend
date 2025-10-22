import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LosspassComponent } from './losspass.component';

describe('LosspassComponent', () => {
  let component: LosspassComponent;
  let fixture: ComponentFixture<LosspassComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LosspassComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LosspassComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
