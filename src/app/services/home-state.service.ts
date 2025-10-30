import { Injectable, signal } from '@angular/core';

export interface HomeState {
  nameFilter: string;
  selectedStars: number[];
  ratingValue: number;
  priceValue: number;
  currentPage: number;
}

@Injectable({ providedIn: 'root' })
export class HomeStateService {
  private homeState = signal<HomeState>({
    nameFilter: '',
    selectedStars: [],
    ratingValue: 0,
    priceValue: 1000,
    currentPage: 1
  });

  saveState(state: HomeState): void {
    this.homeState.set(state);
  }

  getState(): HomeState {
    return this.homeState();
  }

  getStateSignal() {
    return this.homeState;
  }

  resetState(): void {
    this.homeState.set({
      nameFilter: '',
      selectedStars: [],
      ratingValue: 0,
      priceValue: 1000,
      currentPage: 1
    });
  }
}
