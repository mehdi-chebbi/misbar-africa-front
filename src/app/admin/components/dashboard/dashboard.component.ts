import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTableModule,
    MatProgressBarModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  isLoading = false;

  // Mock statistics - replace with actual API calls when backend is ready
  stats = {
    totalUsers: 150,
    activeUsers: 142,
    newUsersThisMonth: 12,
    loginsToday: 45
  };

  // Mock recent activity - replace with actual API calls when backend is ready
  recentActivity = [
    { id: 1, user: 'john@example.com', action: 'login', timestamp: new Date('2024-01-15T10:30:00Z'), details: 'Successful login' },
    { id: 2, user: 'admin@example.com', action: 'user_created', timestamp: new Date('2024-01-15T09:15:00Z'), details: 'Created new user: jane@example.com' },
    { id: 3, user: 'jane@example.com', action: 'login', timestamp: new Date('2024-01-15T08:45:00Z'), details: 'Successful login' },
    { id: 4, user: 'admin@example.com', action: 'password_change', timestamp: new Date('2024-01-14T16:20:00Z'), details: 'Changed password for user: bob@example.com' },
    { id: 5, user: 'bob@example.com', action: 'logout', timestamp: new Date('2024-01-14T15:30:00Z'), details: 'User logged out' }
  ];

  // System health metrics
  systemHealth = {
    database: 'healthy',
    api: 'healthy',
    storage: 'healthy',
    performance: 95
  };

  constructor() { }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;

    // Simulate API call delay
    setTimeout(() => {
      this.isLoading = false;
      // When backend is ready, replace with actual API calls:
      // this.loadUserStats();
      // this.loadRecentActivity();
      // this.loadSystemHealth();
    }, 1500);
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getActionIcon(action: string): string {
    switch (action) {
      case 'login': return 'login';
      case 'logout': return 'logout';
      case 'user_created': return 'person_add';
      case 'password_change': return 'vpn_key';
      default: return 'info';
    }
  }

  getActionColor(action: string): string {
    switch (action) {
      case 'login': return 'primary';
      case 'logout': return 'accent';
      case 'user_created': return 'primary';
      case 'password_change': return 'warn';
      default: return '';
    }
  }
}