import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';

import { HotelDetailComponent } from './hotel-detail.component';
import { HotelsService } from '../../services/api/hotels.service';

describe('HotelDetailComponent', () => {
  let fixture: ComponentFixture<HotelDetailComponent>;
  let component: HotelDetailComponent;
  let hotelsService: jasmine.SpyObj<HotelsService>;
  let router: jasmine.SpyObj<Router>;

  const mockHotel = {
    id: '1',
    name: 'Luxury Hotel',
    rate: 4.8,
    price: 250,
    stars: 5,
    image: '/assets/hotel-1.jpg',
    address: '123 Hotel St'
  };

  beforeEach(async () => {
    hotelsService = jasmine.createSpyObj('HotelsService', ['getHotelById']);
    router = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [HotelDetailComponent, TranslateModule.forRoot()],
      providers: [
        { provide: HotelsService, useValue: hotelsService },
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({ id: '1' })
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HotelDetailComponent);
    component = fixture.componentInstance;
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
    expect(component.loading()).toBeTrue();
    expect(component.checkInDate).toBeNull();
    expect(component.checkOutDate).toBeNull();
    expect(component.selectedGuests).toBe(1);
  });

  it('initialises guest options from translations', () => {
    hotelsService.getHotelById.and.returnValue(of(mockHotel));
    component.ngOnInit();

    const options = component.guestOptions();
    expect(options.length).toBeGreaterThan(0);
    expect(options[0].value).toBe(1);
  });

  it('normalises today for min check-in date', () => {
    const { minCheckInDate } = component;
    const expected = new Date();
    expected.setHours(0, 0, 0, 0);
    expect(minCheckInDate.getTime()).toBe(expected.getTime());
  });

  describe('hotel loading', () => {
    it('loads hotel data from service and clears loading flag', () => {
      hotelsService.getHotelById.and.returnValue(of(mockHotel));

      fixture.detectChanges();

      expect(hotelsService.getHotelById).toHaveBeenCalledWith('1');
      expect(component.hotel).toEqual(mockHotel);
      expect(component.loading()).toBeFalse();
    });

    it('sets loading to false when service errors', () => {
      hotelsService.getHotelById.and.returnValue(throwError(() => new Error('error')));

      fixture.detectChanges();

      expect(component.hotel).toBeUndefined();
      expect(component.loading()).toBeFalse();
    });
  });

  describe('date selection', () => {
    it('resets checkout and minCheckOut when check-in cleared', () => {
      component.checkOutDate = new Date();
      component.onCheckInChange(null);

      expect(component.checkInDate).toBeNull();
      expect(component.checkOutDate).toBeNull();
      expect(component.minCheckOutDate.getTime()).toBe(component.minCheckInDate.getTime());
    });

    it('sets min checkout date to selected check-in and stores valid checkout', () => {
      const checkIn = new Date('2025-05-01');
      const checkout = new Date('2025-05-10');

      const expectedCheckIn = new Date(checkIn);
      expectedCheckIn.setHours(0, 0, 0, 0);
      const expectedCheckout = new Date(checkout);
      expectedCheckout.setHours(0, 0, 0, 0);

      component.onCheckInChange(checkIn);
      component.onCheckOutChange(checkout);

      expect(component.checkInDate?.getTime()).toBe(expectedCheckIn.getTime());
      expect(component.minCheckOutDate.getTime()).toBe(expectedCheckIn.getTime());
      expect(component.checkOutDate?.getTime()).toBe(expectedCheckout.getTime());
    });

    it('drops checkout when it is before the new check-in date', () => {
      const early = new Date('2025-05-01');
      const later = new Date('2025-05-05');

      component.onCheckOutChange(early);
      component.onCheckInChange(later);

      expect(component.checkOutDate).toBeNull();
    });

    it('clears invalid checkout selection', () => {
      const checkIn = new Date('2025-05-10');
      const earlyCheckout = new Date('2025-05-05');

      component.onCheckInChange(checkIn);
      component.onCheckOutChange(earlyCheckout);

      expect(component.checkOutDate).toBeNull();
    });

    it('stores valid checkout selection', () => {
      const checkIn = new Date('2025-05-10');
      const checkout = new Date('2025-05-12');

      const expectedCheckout = new Date(checkout);
      expectedCheckout.setHours(0, 0, 0, 0);

      component.onCheckInChange(checkIn);
      component.onCheckOutChange(checkout);

      expect(component.checkOutDate?.getTime()).toBe(expectedCheckout.getTime());
    });
  });

  it('navigates back when goBack is invoked', () => {
    component.goBack();
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('shows an alert when bookNow is called', () => {
    const alertSpy = spyOn(window, 'alert');
    component.bookNow();
    expect(alertSpy).toHaveBeenCalled();
  });
});
