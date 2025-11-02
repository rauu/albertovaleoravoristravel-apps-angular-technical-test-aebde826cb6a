import { render, screen, fireEvent } from '@testing-library/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable, of, throwError, timer } from 'rxjs';
import { map } from 'rxjs/operators';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { HotelsService } from '../../../../services/hotels.service';
import { HotelDetailComponent } from './hotel-detail.component';
import { Meta, Title } from '@angular/platform-browser';

const translations = {
  home: {
    loading: 'Loading hotels',
    back: 'Back',
    bookNow: 'Book now'
  },
  detail: {
    backToList: 'Back to list',
    pricePerNight: 'Price per night',
    checkIn: 'Check-in',
    checkOut: 'Check-out',
    guests: 'Guests',
    guest1: '1 adult',
    guest2: '2 guests',
    guest3: '3 guests',
    guest4: '4 guests',
    guest5: '5 guests',
    notFound: 'Hotel not found',
    notFoundDescription: 'Try a different search',
    exploreHotels: 'Explore hotels'
  },
  seo: {
    detailTitle: '{{ hotel }} | Detail',
    detailDescription: '{{ hotel }} description'
  }
};

const mockHotel = {
  id: '1',
  name: 'Luxury Hotel',
  rate: 4.8,
  price: 250,
  stars: 5,
  image: '/assets/hotel-1.jpg',
  address: '123 Hotel St'
};

interface SetupOptions {
  response?: Observable<any>;
}

describe('HotelDetailComponent', () => {
  async function setup(options: SetupOptions = {}) {
    const queryParams$ = new BehaviorSubject<{ id: string }>({ id: '1' });
    const hotelsService = jasmine.createSpyObj('HotelsService', ['getHotelById']);
    const response = options.response ?? of(mockHotel);
    hotelsService.getHotelById.and.returnValue(response);

    const renderResult = await render(HotelDetailComponent, {
      imports: [TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        { provide: HotelsService, useValue: hotelsService },
        { provide: Meta, useValue: { updateTag: () => {} } },
        { provide: Title, useValue: { setTitle: () => {} } },
        {
          provide: ActivatedRoute,
          useValue: {
            params: queryParams$.asObservable()
          }
        }
      ]
    });

    const translateService = renderResult.fixture.componentRef.injector.get(TranslateService);
    translateService.setTranslation('en', translations, true);
    translateService.use('en');
    renderResult.fixture.detectChanges();
    await renderResult.fixture.whenStable();

    const router = renderResult.fixture.componentRef.injector.get(Router);
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

    return {
      ...renderResult,
      hotelsService,
      router
    };
  }

  it('shows loading state before hotel data arrives', async () => {
    const pendingResponse = timer(15).pipe(map(() => mockHotel));
    await setup({ response: pendingResponse });

    expect(screen.getByRole('status')).toBeTruthy();
  });

  it('renders hotel name and price when service resolves', async () => {
    await setup();

    expect(await screen.findByRole('heading', { name: /luxury hotel/i })).toBeTruthy();
    expect(await screen.findByText(/250/)).toBeTruthy();
  });

  it('shows error section when service fails', async () => {
    await setup({ response: throwError(() => new Error('Network error')) });

    expect(await screen.findByRole('alert')).toBeTruthy();
  });

  it('navigates back to listing when back button clicked', async () => {
  const { router } = await setup();

  const [backButton] = await screen.findAllByRole('button', { name: /back/i });
  fireEvent.click(backButton);

    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('triggers booking alert when CTA clicked', async () => {
    await setup();
    const alertSpy = spyOn(window, 'alert');

    const bookButton = await screen.findByRole('button', { name: /book now/i });
    fireEvent.click(bookButton);

    expect(alertSpy).toHaveBeenCalled();
  });

  it('handles check-in and check-out logic', async () => {
    const { fixture } = await setup();
    const component = fixture.componentInstance;

    const checkIn = new Date('2025-05-01');
    const checkout = new Date('2025-05-05');

    component.onCheckInChange(checkIn);
    component.onCheckOutChange(checkout);

    expect(component.checkInDate).not.toBeNull();
    expect(component.checkOutDate).not.toBeNull();

    component.onCheckInChange(new Date('2025-05-10'));
    expect(component.checkOutDate).toBeNull();
  });
});
