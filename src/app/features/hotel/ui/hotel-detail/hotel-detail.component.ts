import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, signal, inject, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { Meta, Title } from '@angular/platform-browser';
import { Subscription, catchError, distinctUntilChanged, map, of, startWith, switchMap } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { HotelsService } from '../../../../services/hotels.service';
import { Hotel } from '../../../../shared/models/hotel.model';

@Component({
  selector: 'app-hotel-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, SelectModule, DatePickerModule, RouterLink],
  templateUrl: './hotel-detail.component.html',
  styleUrl: './hotel-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HotelDetailComponent implements OnInit, OnDestroy {
  hotel?: Hotel;

  selectedGuests = 1;
  readonly guestOptions = signal<{ label: string; value: number }[]>([]);
  checkInDate: Date | null = null;
  checkOutDate: Date | null = null;
  readonly minCheckInDate = this.normalizeDate(new Date());
  minCheckOutDate = this.minCheckInDate;
  private readonly subscriptions = new Subscription();

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly hotelsService = inject(HotelsService);
  private readonly translate = inject(TranslateService);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  private readonly hotelRequest = toSignal(
    this.route.params.pipe(
      map(params => params['id'] as string | undefined),
      distinctUntilChanged(),
      switchMap(id => {
        if (!id) {
          return of({ status: 'error' as const });
        }
        return this.hotelsService.getHotelById(id).pipe(
          map(hotel => ({ status: 'success' as const, hotel })),
          startWith({ status: 'loading' as const }),
          catchError(() => of({ status: 'error' as const }))
        );
      })
    ),
    { initialValue: { status: 'loading' as const } }
  );

  readonly loading = computed<boolean>(() => this.hotelRequest().status === 'loading');
  readonly error = computed<boolean>(() => this.hotelRequest().status === 'error');

  constructor() {
    effect(() => {
      const state = this.hotelRequest();
      if (state.status === 'success') {
        this.hotel = state.hotel;
        this.updateSeoMetadata();
      } else if (state.status === 'error') {
        this.hotel = undefined;
      }
    });
  }

  ngOnInit() {
    this.initializeGuestOptions();
    this.subscriptions.add(
      this.translate.onLangChange.subscribe(() => {
        this.initializeGuestOptions();
        if (this.hotel) {
          this.updateSeoMetadata();
        }
      })
    );
  }

  private initializeGuestOptions(): void {
    const labels = ['detail.guest1', 'detail.guest2', 'detail.guest3', 'detail.guest4', 'detail.guest5'];
    const translatedOptions = labels.map((label, index) => ({
      label: this.translate.instant(label),
      value: index + 1
    }));
    this.guestOptions.set(translatedOptions);
  }

  onCheckInChange(date: Date | null): void {
    if (!date) {
      this.checkInDate = null;
      this.minCheckOutDate = this.minCheckInDate;
      this.checkOutDate = null;
      return;
    }

    this.checkInDate = this.normalizeDate(date);
    this.minCheckOutDate = this.checkInDate;

    if (this.checkOutDate && this.checkOutDate < this.checkInDate) {
      this.checkOutDate = null;
    }
  }

  onCheckOutChange(date: Date | null): void {
    if (!date) {
      this.checkOutDate = null;
      return;
    }

    const normalizedDate = this.normalizeDate(date);
    const checkIn = this.checkInDate;
    if (checkIn && checkIn > normalizedDate) {
      this.checkOutDate = null;
      return;
    }

    this.checkOutDate = normalizedDate;
  }

  goBack() {
    this.router.navigate(['/']);
  }

  bookNow() {
    alert('Booking functionality would be implemented here');
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private normalizeDate(date: Date): Date {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  }

  private updateSeoMetadata(): void {
    if (!this.hotel) {
      return;
    }

    const locale = this.translate.currentLang === 'es' ? 'es-ES' : 'en-US';
    const formattedPrice = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(this.hotel.price);

    const title = this.translate.instant('seo.detailTitle', { hotel: this.hotel.name }) ||
      `${this.hotel.name} | Avoristech Travel`;
    const description = this.translate.instant('seo.detailDescription', {
      hotel: this.hotel.name,
      rating: this.hotel.rate,
      price: formattedPrice
    }) || `${this.hotel.name} rated ${this.hotel.rate}/5. Book now from ${formattedPrice}.`;

    this.title.setTitle(title);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:type', content: 'article' });
    this.meta.updateTag({ property: 'og:locale', content: locale.replace('-', '_') });
    if (this.hotel.image) {
      this.meta.updateTag({ property: 'og:image', content: this.hotel.image });
      this.meta.updateTag({ property: 'og:image:alt', content: this.hotel.name });
      this.meta.updateTag({ name: 'twitter:image', content: this.hotel.image });
    }
    if (typeof window !== 'undefined') {
      this.meta.updateTag({ property: 'og:url', content: window.location.href });
    }
    this.meta.updateTag({ name: 'twitter:title', content: title });
    this.meta.updateTag({ name: 'twitter:description', content: description });
  }
}
