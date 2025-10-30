import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TranslateModule } from '@ngx-translate/core';
import { Hotel } from '../../../../services/api/models/hotel.model';

@Component({
  selector: 'app-hotel-card',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, TranslateModule],
  templateUrl: './hotel-card.component.html',
  styleUrl: './hotel-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HotelCardComponent {
  @Input() hotel?: Hotel;
  @Output() onViewDetails = new EventEmitter<string>();

  viewDetails() {
    this.onViewDetails.emit(this.hotel?.id);
  }
}
