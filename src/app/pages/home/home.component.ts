import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, signal, effect, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PaginatorModule } from 'primeng/paginator';
import { HotelsService, PaginatedResponse } from '../../services/api/hotels.service';
import { HotelsQueryParams } from '../../models/hotels-query-params.model';
import { HotelCardComponent } from './components/hotel-card/hotel-card.component';
import { HotelFiltersComponent } from './components/hotel-filters/hotel-filters.component';
import { debounceTime, Subject, Subscription, switchMap, catchError, of, startWith, map } from 'rxjs';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { Hotel } from '../../services/api/models/hotel.model';
import { Meta, Title } from '@angular/platform-browser';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, TranslateModule, PaginatorModule, HotelCardComponent, HotelFiltersComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnInit, OnDestroy {
  private readonly hotelsService = inject(HotelsService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly translate = inject(TranslateService);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  readonly showFilters = signal<boolean>(false);
  readonly pageSize = 10;
  readonly starsOptions = [1, 2, 3, 4, 5];

  private readonly filterSubject = new Subject<void>();
  private readonly subscriptions = new Subscription();
  private pendingFilters: any = {};

  // Read filters from URL queryParams
  private readonly queryParams = toSignal(this.route.queryParams, { initialValue: {} as Params });

  // Derived signals from URL state
  readonly nameFilter = computed(() => {
    const params = this.queryParams();
    return (params['name'] as string) || '';
  });

  readonly selectedStars = computed(() => {
    const params = this.queryParams();
    const stars = params['stars'];
    if (!stars) return [];
    return Array.isArray(stars) ? stars.map(Number) : [Number(stars)];
  });

  readonly ratingValue = computed(() => {
    const params = this.queryParams();
    return Number(params['rating']) || 0;
  });

  readonly priceValue = computed(() => {
    const params = this.queryParams();
    return Number(params['price']) || 1000;
  });

  readonly currentPage = computed(() => {
    const params = this.queryParams();
    return Number(params['page']) || 1;
  });

  // Build query params for API from URL state
  private readonly apiQueryParams = computed<HotelsQueryParams>(() => ({
    page: this.currentPage(),
    limit: this.pageSize,
    name: this.nameFilter() || undefined,
    stars: this.selectedStars().length > 0 ? this.selectedStars() : undefined,
    minRating: this.ratingValue() > 0 ? this.ratingValue() : undefined,
    maxPrice: this.priceValue() < 1000 ? this.priceValue() : undefined
  }));

  // Convert apiQueryParams signal to observable for reactive HTTP calls
  private readonly apiQueryParams$ = toObservable(this.apiQueryParams);

  // Reactive HTTP call that responds to URL changes
  private readonly hotelsState = toSignal(
    this.apiQueryParams$.pipe(
      switchMap(params =>
        this.hotelsService.getHotels(params).pipe(
          map(response => ({ status: 'success' as const, response })),
          startWith({ status: 'loading' as const }),
          catchError(() => of({ status: 'error' as const }))
        )
      )
    ),
    { initialValue: { status: 'loading' as const } }
  );

  // Computed values from state
  readonly hotels = computed<Hotel[]>(() => {
    const state = this.hotelsState();
    return state && state.status === 'success' ? state.response.items : [];
  });

  readonly totalRecords = computed<number>(() => {
    const state = this.hotelsState();
    return state && state.status === 'success' ? state.response.total : 0;
  });

  readonly loading = computed<boolean>(() => {
    const state = this.hotelsState();
    return state?.status === 'loading';
  });

  readonly error = computed<boolean>(() => {
    const state = this.hotelsState();
    return state?.status === 'error';
  });

  constructor() {
    this.subscriptions.add(
      this.filterSubject.pipe(debounceTime(500)).subscribe(() => {
        // Apply pending filters to URL after debounce
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {
            ...this.pendingFilters,
            page: undefined // Reset page when filters change
          },
          queryParamsHandling: 'merge'
        });
        this.pendingFilters = {}; // Clear pending filters
      })
    );

    this.subscriptions.add(this.translate.onLangChange.subscribe(() => this.updateSeoMetadata()));
  }

  ngOnInit() {
    this.updateSeoMetadata();
  }

  onNameChange(value: string) {
    // Store value temporarily and trigger debounced update
    this.pendingFilters.name = value || undefined;
    this.filterSubject.next();
  }

  toggleStar(star: number) {
    const stars = this.selectedStars();
    const newStars = stars.includes(star) ? stars.filter(s => s !== star) : [...stars, star];

    this.pendingFilters.stars = newStars.length > 0 ? newStars : undefined;
    this.filterSubject.next();
  }

  onRatingChange(value: number) {
    this.pendingFilters.rating = value > 0 ? value : undefined;
    this.filterSubject.next();
  }

  onPriceChange(value: number) {
    this.pendingFilters.price = value < 1000 ? value : undefined;
    this.filterSubject.next();
  }

  onPageChange(event: any) {
    const pageNumber = Math.floor(event.first / event.rows) + 1;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: pageNumber > 1 ? pageNumber : undefined },
      queryParamsHandling: 'merge'
    });
  }

  toggleFilters() {
    this.showFilters.update(value => !value);
  }

  retryLoad() {
    // Trigger reload by updating URL (forces new API call)
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: this.queryParams(),
      queryParamsHandling: 'merge'
    });
  }

  clearFilters() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {}
    });
  }

  trackByHotelId(index: number, hotel: Hotel): string {
    return hotel.id;
  }

  hasActiveFilters(): boolean {
    return this.nameFilter() !== '' || this.selectedStars().length > 0 || this.ratingValue() > 0 || this.priceValue() < 1000;
  }

  getTotalPages(): number {
    return Math.ceil(this.totalRecords() / this.pageSize);
  }

  viewHotelDetails(hotelId: string) {
    this.router.navigate(['/hotel', hotelId]);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.filterSubject.complete();
  }

  private updateSeoMetadata(): void {
    const pageTitle = this.translate.instant('seo.homeTitle') || 'Avoristech Travel | Hotels';
    const description = this.translate.instant('seo.homeDescription') ||
      'Browse and compare hotels with Avoristech Travel.';

    this.title.setTitle(pageTitle);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: pageTitle });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:image', content: '/assets/logo.png' });
    this.meta.updateTag({ name: 'twitter:title', content: pageTitle });
    this.meta.updateTag({ name: 'twitter:description', content: description });
  }
}
