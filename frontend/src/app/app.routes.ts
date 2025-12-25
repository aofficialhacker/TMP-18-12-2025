import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
    canActivate: [guestGuard],
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard],
  },
  {
    path: 'categories',
    loadComponent: () => import('./features/categories/categories.component').then(m => m.CategoriesComponent),
    canActivate: [authGuard],
  },
  {
    path: 'features',
    loadComponent: () => import('./features/features/features.component').then(m => m.FeaturesComponent),
    canActivate: [authGuard],
  },
  {
    path: 'companies',
    loadComponent: () => import('./features/companies/companies.component').then(m => m.CompaniesComponent),
    canActivate: [authGuard],
  },
  {
    path: 'plans',
    loadComponent: () => import('./features/plans/plans.component').then(m => m.PlansComponent),
    canActivate: [authGuard],
  },

  /* 🔥 REAL QUOTE COMPARISON PAGE */
  {
  path: 'quote-comparison',
  loadComponent: () =>
    import('./modules/quote-comparison/pages/quote-comparison-page/quote-comparison-page.component')
      .then(m => m.QuoteComparisonPageComponent),
  canActivate: [authGuard],
  },
  {
    path: 'extraction/upload',
    loadComponent: () => import('./features/extraction/upload/upload.component').then(m => m.UploadComponent),
    canActivate: [authGuard],
  },
  {
    path: 'extraction/verify',
    loadComponent: () => import('./features/extraction/verify/verify.component').then(m => m.VerifyComponent),
    canActivate: [authGuard],
  },
  {
    path: 'extraction/prompts',
    loadComponent: () => import('./features/extraction/prompts/extraction-prompts.component').then(m => m.ExtractionPromptsComponent),
    canActivate: [authGuard],
  },

  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
