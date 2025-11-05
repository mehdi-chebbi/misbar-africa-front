import { Routes } from '@angular/router';
import { MapComponent } from './pages/map/map.component';
import { AuthGuard } from './auth/guards/auth.guard';
import { AdminGuard } from './auth/guards/admin.guard';

export const routes: Routes = [
  // Redirect the empty path to /map, or remove this if you want a separate home page
  { path: '', redirectTo: 'map', pathMatch: 'full' },

  // Authentication pages (public)
  {
    path: 'login',
    loadComponent: () => import('./auth/components/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./auth/components/register/register.component').then(m => m.RegisterComponent)
  },

  // Your full‑screen map page (public but with restricted features for guests)
  { path: 'map', component: MapComponent },

  // About page (public)
  { path: 'about', loadComponent: () => import('./pages/about/about.component').then(m => m.AboutComponent) },

  // Protected routes
  {
    path: 'profile',
    loadComponent: () => import('./auth/components/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [AuthGuard]
  },

  // Admin routes (admin only)
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes').then(m => m.ADMIN_ROUTES),
    canActivate: [AuthGuard, AdminGuard]
  },

  // Wildcard route (optional): redirect any unknown URL back to /map
  { path: '**', redirectTo: 'map' }
];
