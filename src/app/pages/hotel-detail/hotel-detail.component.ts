import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { HotelsService } from '../../services/api/hotels.service';
import { Hotel } from '../../services/api/models/hotel.model';
import { Meta, Title } from '@angular/platform-browser';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-hotel-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, SelectModule, DatePickerModule],
  templateUrl: './hotel-detail.component.html',
  styleUrl: './hotel-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HotelDetailComponent implements OnInit, OnDestroy {
  hotel?: Hotel;
  loading = signal<boolean>(true);

  selectedGuests = 1;
  readonly guestOptions = signal<{ label: string; value: number }[]>([]);
  checkInDate: Date | null = null;
  checkOutDate: Date | null = null;
  readonly minCheckInDate = this.normalizeDate(new Date());
  minCheckOutDate = this.minCheckInDate;
  private readonly subscriptions = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private hotelsService: HotelsService,
    private translate: TranslateService,
    private title: Title,
    private meta: Meta
  ) {}

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
    this.subscriptions.add(
      this.route.params.subscribe(params => {
        const id = params['id'];
        if (id) {
          this.loadHotel(id);
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

  loadHotel(id: string) {
    this.loading.set(true);
    this.hotelsService.getHotelById(id).subscribe({
      next: (hotel) => {
        this.hotel = hotel;
        this.loading.set(false);
        this.updateSeoMetadata();
      },
      error: () => {
        this.loading.set(false);
      }
    });
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
