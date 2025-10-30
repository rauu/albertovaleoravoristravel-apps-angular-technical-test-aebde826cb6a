import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { HotelCardComponent } from './hotel-card.component';
import { Hotel } from '../../../../services/api/models/hotel.model';

describe('HotelCardComponent', () => {
  let fixture: ComponentFixture<HotelCardComponent>;
  let component: HotelCardComponent;

  const mockHotel: Hotel = {
    id: 'hotel-1',
    name: 'Test Hotel',
    address: '123 Test Street',
    rate: 4.5,
    stars: 4,
    price: 150,
    image: '/assets/hotel.jpg'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HotelCardComponent, TranslateModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(HotelCardComponent);
    component = fixture.componentInstance;
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('renders hotel data in the template', () => {
    component.hotel = mockHotel;
    fixture.detectChanges();

    const compiled: HTMLElement = fixture.nativeElement;
    expect(compiled.querySelector('h3')?.textContent).toContain(mockHotel.name);
    expect(compiled.querySelector('p')?.textContent).toContain(mockHotel.address);
  });

  it('emits hotel id when viewDetails is triggered', () => {
    component.hotel = mockHotel;
    const emitSpy = spyOn(component.onViewDetails, 'emit');

    component.viewDetails();

    expect(emitSpy).toHaveBeenCalledWith(mockHotel.id);
  });

  it('emits id when the action button is clicked', () => {
    component.hotel = mockHotel;
    fixture.detectChanges();
    const emitSpy = spyOn(component.onViewDetails, 'emit');

    const button: HTMLButtonElement | null = fixture.nativeElement.querySelector('button');
    button?.click();

    expect(emitSpy).toHaveBeenCalledWith(mockHotel.id);
  });
});
