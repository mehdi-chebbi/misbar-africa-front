import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    if (this.authService.isAuthenticated() && this.authService.isAdmin()) {
      return true;
    } else {
      // If user is not authenticated, redirect to login
      if (!this.authService.isAuthenticated()) {
        this.router.navigate(['/login']);
      } else {
        // If user is authenticated but not admin, redirect to map
        this.router.navigate(['/map']);
      }
      return false;
    }
  }
}