import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SliderModule } from 'primeng/slider';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-hotel-filters',
  standalone: true,
  imports: [CommonModule, FormsModule, SliderModule, TranslateModule],
  templateUrl: './hotel-filters.component.html',
  styleUrl: './hotel-filters.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HotelFiltersComponent {
  readonly nameFilter = input<string>('');
  readonly selectedStars = input<number[]>([]);
  readonly ratingValue = input<number>(0);
  readonly priceValue = input<number>(1000);
  readonly starsOptions = input<number[]>([1, 2, 3, 4, 5]);

  readonly onNameChangeOutput = output<string>();
  readonly onStarToggleOutput = output<number>();
  readonly onRatingChangeOutput = output<number>();
  readonly onPriceChangeOutput = output<number>();
  readonly onClearFiltersOutput = output<void>();

  onNameChange(value: string) {
    this.onNameChangeOutput.emit(value);
  }

  toggleStar(star: number) {
    this.onStarToggleOutput.emit(star);
  }

  onRatingChange(value: number | undefined) {
    if (value !== undefined) {
      this.onRatingChangeOutput.emit(value);
    }
  }

  onPriceChange(value: number | undefined) {
    if (value !== undefined) {
      this.onPriceChangeOutput.emit(value);
    }
  }

  clearFilters() {
    this.onClearFiltersOutput.emit();
  }

  isStarChecked(star: number): boolean {
    return this.selectedStars().includes(star);
  }

  trackByStar(index: number, star: number): number {
    return star;
  }
}
