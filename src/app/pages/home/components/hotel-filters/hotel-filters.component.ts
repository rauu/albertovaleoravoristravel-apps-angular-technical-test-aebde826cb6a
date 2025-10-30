import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter } from '@angular/core';
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
  @Input() nameFilter: string = '';
  @Input() selectedStars: number[] = [];
  @Input() ratingValue: number = 0;
  @Input() priceValue: number = 1000;
  @Input() starsOptions: number[] = [1, 2, 3, 4, 5];

  @Output() onNameChangeOutput = new EventEmitter<string>();
  @Output() onStarToggleOutput = new EventEmitter<number>();
  @Output() onRatingChangeOutput = new EventEmitter<number>();
  @Output() onPriceChangeOutput = new EventEmitter<number>();
  @Output() onClearFiltersOutput = new EventEmitter<void>();

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
    return this.selectedStars.includes(star);
  }

  trackByStar(index: number, star: number): number {
    return star;
  }
}
