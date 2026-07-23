import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeamForm } from './team-form';

describe('TeamForm', () => {
  let component: TeamForm;
  let fixture: ComponentFixture<TeamForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeamForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TeamForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
