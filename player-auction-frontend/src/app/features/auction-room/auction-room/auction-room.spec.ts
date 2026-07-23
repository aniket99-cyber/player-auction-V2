import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuctionRoom } from './auction-room';

describe('AuctionRoom', () => {
  let component: AuctionRoom;
  let fixture: ComponentFixture<AuctionRoom>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuctionRoom]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AuctionRoom);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
