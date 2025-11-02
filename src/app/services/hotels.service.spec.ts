import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HotelsService, PaginatedResponse } from './hotels.service';
import { environment } from '../../environments/environment';

describe('HotelsService', () => {
  let service: HotelsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [HotelsService]
    });
    service = TestBed.inject(HotelsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getHotels', () => {
    it('should fetch hotels with default pagination', () => {
      const mockHotels = [
        { id: '1', name: 'Hotel A', price: 100, stars: 5, rate: 4.5, address: 'Address A', image: 'image1.jpg' },
        { id: '2', name: 'Hotel B', price: 150, stars: 4, rate: 4.2, address: 'Address B', image: 'image2.jpg' }
      ];

      service.getHotels().subscribe((result: PaginatedResponse<any>) => {
        expect(result.items.length).toBe(2);
        expect(result.total).toBe(2);
        expect(result.items[0].name).toBe('Hotel A');
      });

      const req = httpMock.expectOne(req =>
        req.url.includes(`${environment.apiUrl}/hotels`)
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('_limit')).toBe('10');
      expect(req.request.params.get('_page')).toBe('1');

      req.flush(mockHotels, { headers: { 'x-total-count': '2' } });
    });

    it('should fetch hotels with name filter', () => {
      const mockHotels = [
        { id: '1', name: 'Hotel Spain', price: 100, stars: 5, rate: 4.5, address: 'Madrid', image: 'img.jpg' }
      ];

      service.getHotels({ name: 'Spain', page: 1, limit: 10 }).subscribe((result) => {
        expect(result.items.length).toBe(1);
        expect(result.items[0].name).toContain('Spain');
      });

      const req = httpMock.expectOne(req =>
        req.url.includes(`${environment.apiUrl}/hotels`) &&
        req.params.get('name_like') === 'Spain'
      );
      req.flush(mockHotels, { headers: { 'x-total-count': '1' } });
    });

    it('should fetch hotels with price range filter', () => {
      const mockHotels = [
        { id: '1', name: 'Budget Hotel', price: 50, stars: 2, rate: 3.5, address: 'Street A', image: 'img.jpg' }
      ];

      service.getHotels({ minPrice: 50, maxPrice: 100, page: 1, limit: 10 }).subscribe((result) => {
        expect(result.items[0].price).toBeLessThanOrEqual(100);
        expect(result.items[0].price).toBeGreaterThanOrEqual(50);
      });

      const req = httpMock.expectOne(req =>
        req.url.includes(`${environment.apiUrl}/hotels`) &&
        req.params.get('price_gte') === '50' &&
        req.params.get('price_lte') === '100'
      );
      req.flush(mockHotels, { headers: { 'x-total-count': '1' } });
    });

    it('should fetch hotels with stars filter', () => {
      const mockHotels = [
        { id: '1', name: 'Premium Hotel', price: 200, stars: 5, rate: 4.8, address: 'City Center', image: 'img.jpg' }
      ];

      service.getHotels({ stars: [5], page: 1, limit: 10 }).subscribe((result) => {
        expect(result.items[0].stars).toBe(5);
      });

      const req = httpMock.expectOne(req =>
        req.url.includes(`${environment.apiUrl}/hotels`) &&
        req.params.get('stars') === '5'
      );
      req.flush(mockHotels, { headers: { 'x-total-count': '1' } });
    });

    it('should handle pagination correctly', () => {
      const mockHotels = [
        { id: '11', name: 'Hotel 11', price: 100, stars: 3, rate: 3.5, address: 'Addr', image: 'img.jpg' }
      ];

      service.getHotels({ page: 2, limit: 10 }).subscribe((result) => {
        expect(result.items.length).toBe(1);
      });

      const req = httpMock.expectOne(req =>
        req.url.includes(`${environment.apiUrl}/hotels`) &&
        req.params.get('_page') === '2' &&
        req.params.get('_limit') === '10'
      );
      req.flush(mockHotels, { headers: { 'x-total-count': '100' } });
    });

    it('should return empty array on error', () => {
      service.getHotels().subscribe((result) => {
        expect(result.items).toEqual([]);
        expect(result.total).toBe(0);
      });

      const req = httpMock.expectOne(req =>
        req.url.includes(`${environment.apiUrl}/hotels`)
      );
      req.flush(null);
    });
  });

  describe('getHotelById', () => {
    it('should fetch a single hotel by id', () => {
      const mockHotel = {
        id: '1',
        name: 'Hotel Test',
        price: 150,
        stars: 4,
        rate: 4.3,
        address: 'Test Address',
        image: 'test-img.jpg'
      };

      service.getHotelById('1').subscribe((result) => {
        expect(result.id).toBe('1');
        expect(result.name).toBe('Hotel Test');
        expect(result.price).toBe(150);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/hotels/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockHotel);
    });

    it('should handle 404 error for non-existent hotel', () => {
      service.getHotelById('999').subscribe(
        () => fail('should have failed with 404 error'),
        (error) => {
          expect(error.status).toBe(404);
        }
      );

      const req = httpMock.expectOne(`${environment.apiUrl}/hotels/999`);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });
});
