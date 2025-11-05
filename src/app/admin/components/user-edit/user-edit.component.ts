import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { User } from '../../../auth/models/user.model';

@Component({
  selector: 'app-user-edit',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './user-edit.component.html',
  styleUrls: ['./user-edit.component.css']
})
export class UserEditComponent implements OnInit {
  isLoading = false;
  userId: number | null = null;
  user: User | null = null;

  // Mock data - replace with actual API call when backend is ready
  mockUsers: User[] = [
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
    }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.userId = parseInt(id, 10);
      this.loadUser();
    } else {
      this.router.navigate(['/admin/users']);
    }
  }

  loadUser(): void {
    this.isLoading = true;

    // Mock implementation - replace with actual API call when backend is ready
    setTimeout(() => {
      const foundUser = this.mockUsers.find(u => u.id === this.userId);
      if (foundUser) {
        this.user = { ...foundUser };
      } else {
        this.snackBar.open('User not found', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
        this.router.navigate(['/admin/users']);
      }
      this.isLoading = false;

      // When backend is ready, replace with:
      // this.userService.getUser(this.userId).subscribe({
      //   next: (user) => {
      //     this.user = user;
      //     this.isLoading = false;
      //   },
      //   error: () => {
      //     this.snackBar.open('User not found', 'Close', { duration: 3000 });
      //     this.router.navigate(['/admin/users']);
      //     this.isLoading = false;
      //   }
      // });
    }, 1000);
  }

  saveUser(): void {
    if (!this.user) return;

    this.isLoading = true;

    // Mock implementation - replace with actual API call when backend is ready
    setTimeout(() => {
      this.isLoading = false;
      this.snackBar.open('User updated successfully', 'Close', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
      this.router.navigate(['/admin/users']);

      // When backend is ready, replace with:
      // this.userService.updateUser(this.user.id, {
      //   email: this.user.email,
      //   role: this.user.role,
      //   is_active: this.user.is_active
      // }).subscribe({
      //   next: () => {
      //     this.isLoading = false;
      //     this.snackBar.open('User updated successfully', 'Close', { duration: 3000 });
      //     this.router.navigate(['/admin/users']);
      //   },
      //   error: () => {
      //     this.isLoading = false;
      //     this.snackBar.open('Failed to update user', 'Close', { duration: 5000 });
      //   }
      // });
    }, 1500);
  }

  cancel(): void {
    this.router.navigate(['/admin/users']);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}