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
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <div class="page" style="max-width: 480px; padding-top: 56px;">
      <h1>Citizen registration</h1>
      <mat-card>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="submit()" class="form-stack" style="margin-top: 12px;">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Full name</mat-label>
              <input matInput formControlName="fullName" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Username</mat-label>
              <input matInput formControlName="username" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input matInput type="password" formControlName="password" />
            </mat-form-field>
            <p class="muted" *ngIf="error">{{ error }}</p>
            <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || loading">Create account</button>
          </form>
        </mat-card-content>
      </mat-card>
      <p><a routerLink="/login">Back to sign in</a></p>
    </div>
  `
})
export class RegisterComponent {
  loading = false;
  error = '';
  form = this.fb.nonNullable.group({
    fullName: ['', Validators.required],
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  submit(): void {
    this.loading = true;
    this.error = '';
    this.auth.register(this.form.getRawValue()).subscribe({
      next: () => this.router.navigateByUrl('/'),
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Registration failed';
      }
    });
  }
}
