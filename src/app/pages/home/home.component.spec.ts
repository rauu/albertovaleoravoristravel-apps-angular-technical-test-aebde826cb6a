import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HotelsService, PaginatedResponse } from '../../services/api/hotels.service';
import { Hotel } from '../../services/api/models/hotel.model';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let hotelsService: jasmine.SpyObj<HotelsService>;

  beforeEach(async () => {
    const hotelsServiceSpy = jasmine.createSpyObj('HotelsService', [
      'getHotels',
      'getHotelById'
    ]);

    await TestBed.configureTestingModule({
      imports: [HomeComponent, TranslateModule.forRoot()],
      providers: [
        { provide: HotelsService, useValue: hotelsServiceSpy }
      ]
    }).compileComponents();

    hotelsService = TestBed.inject(HotelsService) as jasmine.SpyObj<HotelsService>;
    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('loadHotels', () => {
    it('should load hotels on init', fakeAsync(() => {
      const mockHotels: PaginatedResponse<any> = {
        items: [
          { id: '1', name: 'Hotel A', price: 100, stars: 5, rate: 4.5, address: 'Addr A', image: 'img1.jpg' },
          { id: '2', name: 'Hotel B', price: 150, stars: 4, rate: 4.2, address: 'Addr B', image: 'img2.jpg' }
        ],
        total: 2
      };

      hotelsService.getHotels.and.returnValue(of(mockHotels));

      fixture.detectChanges();

      tick();

      expect(component.hotels().length).toBe(2);
      expect(component.totalRecords()).toBe(2);
      expect(component.loading()).toBe(false);
      expect(hotelsService.getHotels).toHaveBeenCalled();
    }));
  });

  describe('Filtering', () => {
    beforeEach(() => {
      const mockHotels: PaginatedResponse<any> = { items: [], total: 0 };
      hotelsService.getHotels.and.returnValue(of(mockHotels));
    });

    it('should filter hotels by name with debounce', fakeAsync(() => {
      component.onNameChange('Spain');
      expect(component.nameFilter()).toBe('Spain');

      tick(500);

      expect(hotelsService.getHotels).toHaveBeenCalledWith(
        jasmine.objectContaining({
          name: 'Spain'
        })
      );
    }));

    it('should not trigger filter before debounce time', fakeAsync(() => {
      component.onNameChange('Test');
      tick(250);

      expect(hotelsService.getHotels).not.toHaveBeenCalled();
    }));

    it('should toggle star selection', () => {
      expect(component.selectedStars().length).toBe(0);

      component.toggleStar(5);
      expect(component.selectedStars()).toContain(5);

      component.toggleStar(5);
      expect(component.selectedStars()).not.toContain(5);
    });

    it('should allow multiple star selections', () => {
      component.toggleStar(3);
      component.toggleStar(4);
      component.toggleStar(5);

      expect(component.selectedStars().length).toBe(3);
      expect(component.selectedStars()).toContain(3);
      expect(component.selectedStars()).toContain(4);
      expect(component.selectedStars()).toContain(5);
    });

    it('should toggle multiple stars', fakeAsync(() => {
      component.toggleStar(4);
      component.toggleStar(5);

      expect(component.selectedStars()).toContain(4);
      expect(component.selectedStars()).toContain(5);
    }));

    it('should update rating filter', fakeAsync(() => {
      component.onRatingChange(3.5);
      expect(component.ratingValue()).toBe(3.5);

      tick(500);

      expect(hotelsService.getHotels).toHaveBeenCalledWith(
        jasmine.objectContaining({
          minRating: 3.5
        })
      );
    }));

    it('should update price filter', fakeAsync(() => {
      component.onPriceChange(500);
      expect(component.priceValue()).toBe(500);

      tick(500);

      expect(hotelsService.getHotels).toHaveBeenCalledWith(
        jasmine.objectContaining({
          minPrice: 50,
          maxPrice: 500
        })
      );
    }));
  });

  describe('Pagination', () => {
    beforeEach(() => {
      const mockHotels: PaginatedResponse<any> = {
        items: [
          { id: '1', name: 'Hotel A', price: 100, stars: 5, rate: 4.5, address: 'Addr', image: 'img.jpg' }
        ],
        total: 100
      };
      hotelsService.getHotels.and.returnValue(of(mockHotels));
    });

    it('should handle page change', fakeAsync(() => {
      component.onPageChange({ first: 0, rows: 10 });
      expect(component.currentPage()).toBe(1);

      tick();

      expect(hotelsService.getHotels).toHaveBeenCalledWith(
        jasmine.objectContaining({
          page: 1
        })
      );
    }));

    it('should reset to first page when filters change', fakeAsync(() => {
      component.currentPage.set(5);
      component.onNameChange('Barcelona');

      tick(500);

      expect(component.currentPage()).toBe(1);
    }));
  });

  describe('UI Controls', () => {
    it('should toggle filter visibility', () => {
      expect(component.showFilters()).toBe(false);

      component.toggleFilters();
      expect(component.showFilters()).toBe(true);

      component.toggleFilters();
      expect(component.showFilters()).toBe(false);
    });

    it('should clear all filters', fakeAsync(() => {
      component.nameFilter.set('Test');
      component.toggleStar(5);
      component.ratingValue.set(3);
      component.priceValue.set(500);
      component.currentPage.set(2);

      const mockHotels: PaginatedResponse<any> = { items: [], total: 0 };
      hotelsService.getHotels.and.returnValue(of(mockHotels));

      component.clearFilters();

      expect(component.nameFilter()).toBe('');
      expect(component.selectedStars()).toEqual([]);
      expect(component.ratingValue()).toBe(0);
      expect(component.priceValue()).toBe(1000);
      expect(component.currentPage()).toBe(1);

      tick(500);

      expect(hotelsService.getHotels).toHaveBeenCalled();
    }));
  });

  describe('TrackBy Functions', () => {
    it('should track hotels by id', () => {
      const hotel1: Hotel = { id: '1', name: 'Hotel A', image: '', address: '', stars: 5, rate: 4.5, price: 100 };
      const hotel2: Hotel = { id: '2', name: 'Hotel B', image: '', address: '', stars: 4, rate: 4.0, price: 150 };

      expect(component.trackByHotelId(0, hotel1)).toBe('1');
      expect(component.trackByHotelId(1, hotel2)).toBe('2');
    });
  });

  describe('Navigation', () => {
    it('should have viewHotelDetails method', () => {
      expect(typeof component.viewHotelDetails).toBe('function');
    });
  });
});
