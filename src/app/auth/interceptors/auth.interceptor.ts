import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Skip interceptor for requests that don't need authentication
    if (this.shouldSkipInterceptor(req)) {
      return next.handle(req);
    }

    const token = this.authService.getToken();

    if (token) {
      // Clone the request and add the authorization header
      const authReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });

      return next.handle(authReq);
    }

    return next.handle(req);
  }

  private shouldSkipInterceptor(req: HttpRequest<any>): boolean {
    // Skip for external APIs and non-API requests
    const apiUrl = environment.apiUrl;
    const url = req.url;

    // Skip if the URL doesn't start with our API URL
    if (!url.startsWith(apiUrl)) {
      return true;
    }

    // Skip for public endpoints
    const publicEndpoints = [
      '/auth/login',
      '/auth/register',
      '/auth/forgot-password',
      '/auth/reset-password'
    ];

    return publicEndpoints.some(endpoint => url.includes(endpoint));
  }
}