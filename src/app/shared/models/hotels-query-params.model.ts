export interface HotelsQueryParams {
  page?: number;
  limit?: number;
  sort?: string | string[];
  name?: string;
  category?: number;
  stars?: number | number[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
}
