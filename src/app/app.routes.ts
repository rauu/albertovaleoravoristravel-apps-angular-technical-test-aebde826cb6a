import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/hotel/ui/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'hotel/:id',
    loadComponent: () => import('./features/hotel/ui/hotel-detail/hotel-detail.component').then(m => m.HotelDetailComponent)
  },
  {
    path: 'hotel',
    pathMatch: 'full',
    redirectTo: ''
  },
  {
    path: '**',
    redirectTo: ''
  }
];
