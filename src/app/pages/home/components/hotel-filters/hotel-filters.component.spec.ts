import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { HotelFiltersComponent } from './hotel-filters.component';

describe('HotelFiltersComponent', () => {
  let fixture: ComponentFixture<HotelFiltersComponent>;
  let component: HotelFiltersComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HotelFiltersComponent, TranslateModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(HotelFiltersComponent);
    component = fixture.componentInstance;
  });

  it('creates the component with default values', () => {
    expect(component).toBeTruthy();
    expect(component.nameFilter).toBe('');
    expect(component.selectedStars).toEqual([]);
    expect(component.ratingValue).toBe(0);
    expect(component.priceValue).toBe(1000);
    expect(component.starsOptions).toEqual([1, 2, 3, 4, 5]);
  });

  it('emits name changes', () => {
    const emitSpy = spyOn(component.onNameChangeOutput, 'emit');
    component.onNameChange('Hotel A');
    expect(emitSpy).toHaveBeenCalledWith('Hotel A');
  });

  it('emits star toggle events', () => {
    const emitSpy = spyOn(component.onStarToggleOutput, 'emit');
    component.toggleStar(4);
    expect(emitSpy).toHaveBeenCalledWith(4);
  });

  it('emits rating changes when value is provided', () => {
    const emitSpy = spyOn(component.onRatingChangeOutput, 'emit');
    component.onRatingChange(3.5);
    expect(emitSpy).toHaveBeenCalledWith(3.5);
  });

  it('does not emit rating changes when value is undefined', () => {
    const emitSpy = spyOn(component.onRatingChangeOutput, 'emit');
    component.onRatingChange(undefined);
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('emits price changes when value is provided', () => {
    const emitSpy = spyOn(component.onPriceChangeOutput, 'emit');
    component.onPriceChange(500);
    expect(emitSpy).toHaveBeenCalledWith(500);
  });

  it('does not emit price changes when value is undefined', () => {
    const emitSpy = spyOn(component.onPriceChangeOutput, 'emit');
    component.onPriceChange(undefined);
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('emits clear event', () => {
    const emitSpy = spyOn(component.onClearFiltersOutput, 'emit');
    component.clearFilters();
    expect(emitSpy).toHaveBeenCalled();
  });

  it('returns star selection state', () => {
    component.selectedStars = [1, 3, 5];
    expect(component.isStarChecked(3)).toBeTrue();
    expect(component.isStarChecked(2)).toBeFalse();
  });

  it('uses star value for trackBy', () => {
    expect(component.trackByStar(0, 4)).toBe(4);
  });
});
