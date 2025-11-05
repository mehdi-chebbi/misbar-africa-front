import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { User, AuthResponse, LoginRequest, RegisterRequest, ApiResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'current_user';

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.initializeAuth();
  }

  private initializeAuth(): void {
    const token = this.getToken();
    const user = this.getUser();

    if (token && user) {
      this.currentUserSubject.next(user);
      this.isAuthenticatedSubject.next(true);
    }
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    // Mock implementation - replace with actual API call when backend is ready
    return new Observable(observer => {
      setTimeout(() => {
        if (credentials.email === 'admin@example.com' && credentials.password === 'admin123') {
          const adminUser: User = {
            id: 1,
            email: 'admin@example.com',
            role: 'admin',
            created_at: new Date().toISOString(),
            last_login: new Date().toISOString(),
            is_active: true
          };

          const response: AuthResponse = {
            success: true,
            message: 'Login successful',
            data: {
              user: adminUser,
              token: 'mock-jwt-token-admin'
            }
          };

          this.handleAuthResponse(response);
          observer.next(response);
          observer.complete();
        } else if (credentials.email === 'user@example.com' && credentials.password === 'user123') {
          const regularUser: User = {
            id: 2,
            email: 'user@example.com',
            role: 'user',
            created_at: new Date().toISOString(),
            last_login: new Date().toISOString(),
            is_active: true
          };

          const response: AuthResponse = {
            success: true,
            message: 'Login successful',
            data: {
              user: regularUser,
              token: 'mock-jwt-token-user'
            }
          };

          this.handleAuthResponse(response);
          observer.next(response);
          observer.complete();
        } else {
          observer.error({
            success: false,
            message: 'Invalid credentials'
          });
        }
      }, 1000);
    });

    // When backend is ready, replace with:
    // return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, credentials);
  }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    // Mock implementation - replace with actual API call when backend is ready
    return new Observable(observer => {
      setTimeout(() => {
        const newUser: User = {
          id: Math.floor(Math.random() * 1000),
          email: userData.email,
          role: 'user',
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString(),
          is_active: true
        };

        const response: AuthResponse = {
          success: true,
          message: 'Registration successful',
          data: {
            user: newUser,
            token: 'mock-jwt-token-new-user'
          }
        };

        this.handleAuthResponse(response);
        observer.next(response);
        observer.complete();
      }, 1000);
    });

    // When backend is ready, replace with:
    // return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, userData);
  }

  logout(): void {
    // Clear local storage
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);

    // Update subjects
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);

    // Navigate to login page
    this.router.navigate(['/login']);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'admin';
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private getUser(): User | null {
    const userData = localStorage.getItem(this.USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  private handleAuthResponse(response: AuthResponse): void {
    if (response.success && response.data) {
      const { user, token } = response.data;

      // Store in localStorage
      localStorage.setItem(this.TOKEN_KEY, token);
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));

      // Update subjects
      this.currentUserSubject.next(user);
      this.isAuthenticatedSubject.next(true);
    }
  }

  // Mock method for demo purposes - remove when backend is implemented
  forgotPassword(email: string): Observable<ApiResponse> {
    return new Observable(observer => {
      setTimeout(() => {
        observer.next({
          success: true,
          message: 'Password reset link sent to your email'
        });
        observer.complete();
      }, 1000);
    });
  }

  // Mock method for demo purposes - remove when backend is implemented
  updatePassword(currentPassword: string, newPassword: string): Observable<ApiResponse> {
    return new Observable(observer => {
      setTimeout(() => {
        observer.next({
          success: true,
          message: 'Password updated successfully'
        });
        observer.complete();
      }, 1000);
    });
  }
}