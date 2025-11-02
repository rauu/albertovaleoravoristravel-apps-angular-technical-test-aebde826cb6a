import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TranslateModule } from '@ngx-translate/core';
import { Hotel } from '../../../../../../shared/models/hotel.model';

@Component({
  selector: 'app-hotel-card',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, TranslateModule],
  templateUrl: './hotel-card.component.html',
  styleUrl: './hotel-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HotelCardComponent {
  readonly hotel = input<Hotel>();
  readonly onViewDetails = output<string>();

  viewDetails() {
    const hotelId = this.hotel()?.id;
    if (hotelId) {
      this.onViewDetails.emit(hotelId);
    }
  }
}
