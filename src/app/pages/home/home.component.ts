import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PaginatorModule } from 'primeng/paginator';
import { HotelsService } from '../../services/api/hotels.service';
import { HotelsQueryParams } from '../../models/hotels-query-params.model';
import { HotelCardComponent } from './components/hotel-card/hotel-card.component';
import { HotelFiltersComponent } from './components/hotel-filters/hotel-filters.component';
import { HomeStateService } from '../../services/home-state.service';
import { debounceTime, Subject, Subscription } from 'rxjs';
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
  hotels = signal<Hotel[]>([]);
  totalRecords = signal<number>(0);
  loading = signal<boolean>(false);
  showFilters = signal<boolean>(false);
  nameFilter = signal<string>('');
  selectedStars = signal<number[]>([]);
  ratingValue = signal<number>(0);
  priceValue = signal<number>(1000);
  currentPage = signal<number>(1);

  pageSize = 10;
  starsOptions = [1, 2, 3, 4, 5];

  private filterSubject = new Subject<void>();
  private readonly subscriptions = new Subscription();

  constructor(
    private hotelsService: HotelsService,
    private router: Router,
    private homeStateService: HomeStateService,
    private translate: TranslateService,
    private title: Title,
    private meta: Meta
  ) {
    this.subscriptions.add(
      this.filterSubject.pipe(debounceTime(500)).subscribe(() => {
        this.currentPage.set(1);
        this.loadHotels();
      })
    );

  this.subscriptions.add(this.translate.onLangChange.subscribe(() => this.updateSeoMetadata()));

    effect(() => {
      this.homeStateService.saveState({
        nameFilter: this.nameFilter(),
        selectedStars: this.selectedStars(),
        ratingValue: this.ratingValue(),
        priceValue: this.priceValue(),
        currentPage: this.currentPage()
      });
    });
  }

  ngOnInit() {
    const savedState = this.homeStateService.getState();
    this.nameFilter.set(savedState.nameFilter);
    this.selectedStars.set(savedState.selectedStars);
    this.ratingValue.set(savedState.ratingValue);
    this.priceValue.set(savedState.priceValue);
    this.currentPage.set(savedState.currentPage);
    this.loadHotels();
    this.updateSeoMetadata();
  }

  loadHotels() {
    this.loading.set(true);

    const params: HotelsQueryParams = {
      page: this.currentPage(),
      limit: this.pageSize,
      name: this.nameFilter() || undefined,
      stars: this.selectedStars().length > 0 ? this.selectedStars() : undefined,
      minRating: this.ratingValue() > 0 ? this.ratingValue() : undefined,
      minPrice: this.priceValue() < 1000 ? 50 : undefined,
      maxPrice: this.priceValue()
    };

    this.hotelsService.getHotels(params).subscribe({
      next: (response) => {
        this.hotels.set(response.items);
        this.totalRecords.set(response.total);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  onNameChange(value: string) {
    this.nameFilter.set(value);
    this.filterSubject.next();
  }

  toggleStar(star: number) {
    const stars = this.selectedStars();
    this.selectedStars.set(stars.includes(star) ? stars.filter(s => s !== star) : [...stars, star]);
    this.filterSubject.next();
  }

  onRatingChange(value: number) {
    this.ratingValue.set(value);
    this.filterSubject.next();
  }

  onPriceChange(value: number) {
    this.priceValue.set(value);
    this.filterSubject.next();
  }

  onPageChange(event: any) {
    const pageNumber = Math.floor(event.first / event.rows) + 1;
    this.currentPage.set(pageNumber);
    this.loadHotels();
  }

  toggleFilters() {
    this.showFilters.update(value => !value);
  }

  clearFilters() {
    this.nameFilter.set('');
    this.selectedStars.set([]);
    this.ratingValue.set(0);
    this.priceValue.set(1000);
    this.currentPage.set(1);
    this.filterSubject.next();
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
