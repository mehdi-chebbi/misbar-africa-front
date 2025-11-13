import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { User } from '../../../auth/models/user.model';

interface UserWithActions extends User {
  actions?: string[];
}

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatTableModule,
    MatFormFieldModule,
    MatSelectModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatChipsModule
  ],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css']
})
export class UserListComponent implements OnInit {
  isLoading = false;
  displayedColumns: string[] = ['id', 'email', 'role', 'created_at', 'last_login', 'is_active', 'actions'];

  // Mock users - replace with actual API calls when backend is ready
  users: UserWithActions[] = [
    {
      id: 1,
      email: 'admin@example.com',
      role: 'admin',
      created_at: '2024-01-01T00:00:00Z',
      last_login: '2024-01-15T10:30:00Z',
      is_active: true
    },
    {
      id: 2,
      email: 'john.doe@example.com',
      role: 'user',
      created_at: '2024-01-02T00:00:00Z',
      last_login: '2024-01-15T09:15:00Z',
      is_active: true
    },
    {
      id: 3,
      email: 'jane.smith@example.com',
      role: 'user',
      created_at: '2024-01-03T00:00:00Z',
      last_login: '2024-01-14T16:20:00Z',
      is_active: true
    },
    {
      id: 4,
      email: 'inactive.user@example.com',
      role: 'user',
      created_at: '2024-01-04T00:00:00Z',
      last_login: '2024-01-10T08:45:00Z',
      is_active: false
    },
    {
      id: 5,
      email: 'new.user@example.com',
      role: 'user',
      created_at: '2024-01-15T00:00:00Z',
      last_login: undefined,
      is_active: true
    }
  ];

  filteredUsers = [...this.users];
  searchTerm = '';
  roleFilter = '';
  statusFilter = '';

  // Pagination
  totalUsers = this.users.length;
  pageSize = 10;
  currentPage = 0;

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;

    // Simulate API call delay
    setTimeout(() => {
      this.isLoading = false;
      this.applyFilters();
      // When backend is ready, replace with actual API call:
      // this.userService.getUsers().subscribe(users => {
      //   this.users = users;
      //   this.applyFilters();
      //   this.isLoading = false;
      // });
    }, 1000);
  }

  applyFilters(): void {
    this.filteredUsers = this.users.filter(user => {
      const matchesSearch = !this.searchTerm ||
        user.email.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesRole = !this.roleFilter || user.role === this.roleFilter;

      const matchesStatus = !this.statusFilter ||
        (this.statusFilter === 'active' && user.is_active) ||
        (this.statusFilter === 'inactive' && !user.is_active);

      return matchesSearch && matchesRole && matchesStatus;
    });

    this.totalUsers = this.filteredUsers.length;
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onRoleFilterChange(): void {
    this.applyFilters();
  }

  onStatusFilterChange(): void {
    this.applyFilters();
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'Never';

    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  toggleUserStatus(user: User): void {
    // Mock implementation - replace with actual API call when backend is ready
    user.is_active = !user.is_active;

    const message = user.is_active ? 'User activated successfully' : 'User deactivated successfully';
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });

    // When backend is ready, replace with:
    // this.userService.updateUser(user.id, { is_active: user.is_active }).subscribe({
    //   next: () => {
    //     this.snackBar.open(message, 'Close', { duration: 3000 });
    //     this.loadUsers();
    //   },
    //   error: (error) => {
    //     this.snackBar.open('Failed to update user status', 'Close', { duration: 5000 });
    //   }
    // });
  }

  deleteUser(user: User): void {
    if (confirm(`Are you sure you want to delete user ${user.email}?`)) {
      // Mock implementation - replace with actual API call when backend is ready
      const index = this.users.findIndex(u => u.id === user.id);
      if (index > -1) {
        this.users.splice(index, 1);
        this.applyFilters();
      }

      this.snackBar.open('User deleted successfully', 'Close', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });

      // When backend is ready, replace with:
      // this.userService.deleteUser(user.id).subscribe({
      //   next: () => {
      //     this.snackBar.open('User deleted successfully', 'Close', { duration: 3000 });
      //     this.loadUsers();
      //   },
      //   error: (error) => {
      //     this.snackBar.open('Failed to delete user', 'Close', { duration: 5000 });
      //   }
      // });
    }
  }

  getRoleColor(role: string): string {
    return role === 'admin' ? 'warn' : 'primary';
  }

  getStatusColor(isActive: boolean): string {
    return isActive ? 'primary' : 'accent';
  }
}