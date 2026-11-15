import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <div class="page auth-page">
      <p class="eyebrow">CivicWorks · Public service portal</p>
      <h1>Welcome back</h1>
      <p class="muted">Sign in to report local issues or coordinate repairs.</p>
      <mat-card>
        <mat-card-content>
          <div class="auth-card-heading"><span class="brand-mark auth-mark">PW</span><span><b>Community access</b><small>Secure sign in</small></span></div>
          <form [formGroup]="form" (ngSubmit)="submit()" class="form-stack" style="margin-top: 12px;">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Username</mat-label>
              <input matInput formControlName="username" autocomplete="username" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input matInput type="password" formControlName="password" autocomplete="current-password" />
            </mat-form-field>
            <p class="muted" *ngIf="error">{{ error }}</p>
            <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || loading">
              {{ loading ? 'Signing in...' : 'Sign in' }}
            </button>
          </form>
        </mat-card-content>
      </mat-card>
      <p>Need an account? <a routerLink="/register">Register as a citizen</a></p>
      <p><a routerLink="/forgot-password">Forgot your password?</a></p>
    </div>
  `
})
export class LoginComponent {
  loading = false;
  error = '';
  form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  submit(): void {
    this.loading = true;
    this.error = '';
    const { username, password } = this.form.getRawValue();
    this.auth.login(username, password).subscribe({
      next: () => this.router.navigateByUrl(this.auth.homeRoute()),
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Login failed';
      }
    });
  }
}
