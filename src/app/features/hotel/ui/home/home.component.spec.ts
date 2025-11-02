import { render, screen } from '@testing-library/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable, of, throwError, timer } from 'rxjs';
import { map } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { HomeComponent } from './home.component';
import { PaginatedResponse, HotelsService } from '../../../../services/hotels.service';
import { HOTEL_DEFAULT_PAGE_SIZE } from '../../utils/hotel.constants';
import { Hotel } from '../../../../shared/models/hotel.model';

interface SetupOptions {
  response$?: Observable<PaginatedResponse<Hotel>>;
  queryParams?: Record<string, unknown>;
}

const translations = {
  home: {
    loading: 'Loading hotels',
    errorLoading: 'Something went wrong',
    errorDescription: 'Try again later',
    title: 'Hotels',
    filters: 'Filters',
    hide: 'Hide filters',
    clearFilters: 'Clear filters',
    noResults: 'No hotels found',
    bookNow: 'Book now'
  },
  common: {
    retry: 'Retry'
  },
  detail: {
    backToList: 'Back'
  },
  seo: {
    homeTitle: 'Hotels overview',
    homeDescription: 'Browse hotels'
  }
};

const mockResponse: PaginatedResponse<Hotel> = {
  items: [
    { id: '1', name: 'Hotel A', price: 100, stars: 5, rate: 4.5, address: 'Addr A', image: 'img1.jpg' },
    { id: '2', name: 'Hotel B', price: 150, stars: 4, rate: 4.2, address: 'Addr B', image: 'img2.jpg' }
  ],
  total: 2
};

async function setup(options: SetupOptions = {}) {
  const hotelsService = jasmine.createSpyObj('HotelsService', ['getHotels', 'getHotelById']);
  const router = jasmine.createSpyObj('Router', ['navigate']);
  const queryParams$ = new BehaviorSubject(options.queryParams ?? {});

  hotelsService.getHotels.and.returnValue(options.response$ ?? of(mockResponse));

  const renderResult = await render(HomeComponent, {
    imports: [TranslateModule.forRoot()],
    providers: [
      { provide: HotelsService, useValue: hotelsService },
      { provide: Router, useValue: router },
      { provide: Meta, useValue: { updateTag: () => {} } },
      { provide: Title, useValue: { setTitle: () => {} } },
      {
        provide: ActivatedRoute,
        useValue: {
          queryParams: queryParams$.asObservable()
        }
      }
    ]
  });

  const translate = renderResult.fixture.componentRef.injector.get(TranslateService);
  translate.setTranslation('en', translations, true);
  translate.use('en');
  renderResult.fixture.detectChanges();
  await renderResult.fixture.whenStable();

  return { ...renderResult, hotelsService, router, queryParams$ };
}

describe('HomeComponent', () => {
  it('renders hotels from service response', async () => {
    const { hotelsService } = await setup();

    expect(hotelsService.getHotels).toHaveBeenCalledWith(jasmine.objectContaining({
      limit: HOTEL_DEFAULT_PAGE_SIZE,
      page: 1
    }));

    expect(await screen.findByRole('heading', { name: /hotels/i })).toBeTruthy();
    const cardHeadings = await screen.findAllByRole('heading', { level: 3 });
    const visibleNames = cardHeadings.map(el => el.textContent?.trim());
    expect(visibleNames).toEqual(jasmine.arrayContaining(['Hotel A', 'Hotel B']));
  });

  it('shows loading state while waiting for response', async () => {
    const delayed$ = timer(20).pipe(map(() => mockResponse));
    await setup({ response$: delayed$ });

    expect(screen.getByRole('status')).toBeTruthy();
  });

  it('displays error placeholder when service fails', async () => {
    await setup({ response$: throwError(() => new Error('Server error')) });

    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(await screen.findByText(/something went wrong/i)).toBeTruthy();
  });

  it('queues pending filters before URL update', async () => {
    const { fixture } = await setup();
    const component = fixture.componentInstance as any;

    component.onNameChange('Beach');
    component.toggleStar(4);
    component.onRatingChange(3.5);
    component.onPriceChange(400);

    expect(component.pendingFilters).toEqual(jasmine.objectContaining({
      name: 'Beach',
      stars: [4],
      rating: 3.5,
      price: 400
    }));
  });

  it('reacts to query param changes by refreshing hotels', async () => {
    const { fixture, queryParams$, hotelsService } = await setup();
    const component = fixture.componentInstance;

    hotelsService.getHotels.calls.reset();

    queryParams$.next({ name: 'Spa', stars: ['5'], rating: 4, price: 200, page: 3 });
    fixture.detectChanges();

    expect(component.nameFilter()).toBe('Spa');
    expect(component.selectedStars()).toEqual([5]);
    expect(component.ratingValue()).toBe(4);
    expect(component.priceValue()).toBe(200);
    expect(component.currentPage()).toBe(3);
    expect(hotelsService.getHotels).toHaveBeenCalledWith(jasmine.objectContaining({
      name: 'Spa',
      stars: [5],
      minRating: 4,
      maxPrice: 200,
      page: 3
    }));
  });

  it('navigates when paginator emits new page', async () => {
    const { fixture, router } = await setup();
    const component = fixture.componentInstance;

  component.onPageChange({ first: HOTEL_DEFAULT_PAGE_SIZE, rows: HOTEL_DEFAULT_PAGE_SIZE });

    expect(router.navigate).toHaveBeenCalledWith([], jasmine.objectContaining({
      queryParams: { page: 2 }
    }));
  });

  it('clears filters and removes query params', async () => {
    const { fixture, router } = await setup({ queryParams: { name: 'City', stars: ['5'] } });
    const component = fixture.componentInstance;

    component.clearFilters();

    expect(router.navigate).toHaveBeenCalledWith([], jasmine.objectContaining({
      queryParams: {}
    }));
  });

  it('reports active filters correctly', async () => {
    const { fixture, queryParams$ } = await setup();
    const component = fixture.componentInstance;

    expect(component.hasActiveFilters()).toBeFalse();

    queryParams$.next({ name: 'Spa' });
    fixture.detectChanges();

    expect(component.hasActiveFilters()).toBeTrue();
  });

  it('tracks hotels by id', async () => {
    const { fixture } = await setup();
    const component = fixture.componentInstance;
    const hotel: Hotel = { id: '123', name: 'Hotel', price: 200, stars: 4, rate: 4, address: 'Addr', image: 'img' };

    expect(component.trackByHotelId(0, hotel)).toBe('123');
  });

  it('navigates to detail when card emits event', async () => {
    const { fixture, router } = await setup();
    const component = fixture.componentInstance;

    component.viewHotelDetails('3');
    expect(router.navigate).toHaveBeenCalledWith(['/hotel', '3']);
  });
});
