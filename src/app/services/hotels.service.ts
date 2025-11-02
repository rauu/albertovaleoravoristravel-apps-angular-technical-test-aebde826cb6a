import { HttpClient, HttpParams, HttpResponse, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, map } from "rxjs";
import { environment } from '../../environments/environment';
import { Hotel } from "../shared/models/hotel.model";
import { HotelsQueryParams } from "../shared/models/hotels-query-params.model";

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
}

@Injectable({ providedIn: 'root' })
export class HotelsService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getHotels(params?: HotelsQueryParams): Observable<PaginatedResponse<Hotel>> {
    let httpParams = new HttpParams();
    const limit = params?.limit || 10;
    const page = params?.page || 1;

    httpParams = httpParams.set('_limit', limit.toString());
    httpParams = httpParams.set('_page', page.toString());

    if (params?.sort) {
      const sortValue = Array.isArray(params.sort) ? params.sort.join(',') : params.sort;
      httpParams = httpParams.set('_sort', sortValue);
    }

    if (params?.name) {
      httpParams = httpParams.set('name_like', params.name);
    }

    if (params?.category) {
      httpParams = httpParams.set('category', params.category.toString());
    }

    if (params?.stars && Array.isArray(params.stars) && params.stars.length > 0) {
      params.stars.forEach((star: number) => {
        httpParams = httpParams.append('stars', star.toString());
      });
    }

    if (params?.minPrice) {
      httpParams = httpParams.set('price_gte', params.minPrice.toString());
    }

    if (params?.maxPrice) {
      httpParams = httpParams.set('price_lte', params.maxPrice.toString());
    }

    if (params?.minRating) {
      httpParams = httpParams.set('rate_gte', params.minRating.toString());
    }

    return this.http.get<Hotel[]>(`${this.apiUrl}/hotels`, {
      params: httpParams,
      observe: 'response',
      headers: new HttpHeaders({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      })
    }).pipe(
      map((response: HttpResponse<Hotel[]>) => ({
        items: response.body || [],
        total: parseInt(response.headers.get('x-total-count') || '0', 10)
      }))
    );
  }

  getHotelById(id: string): Observable<Hotel> {
    return this.http.get<Hotel>(`${this.apiUrl}/hotels/${id}`);
  }
}
