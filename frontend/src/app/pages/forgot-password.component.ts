import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-forgot-password', standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `<div class="page auth-page"><p class="eyebrow">Account access</p><h1>Password reset</h1><mat-card><mat-card-content>
    <form [formGroup]="requestForm" (ngSubmit)="request()" class="form-stack">
      <mat-form-field appearance="outline"><mat-label>Account email</mat-label><input matInput type="email" formControlName="email" /></mat-form-field>
      <button mat-raised-button type="submit" [disabled]="requestForm.invalid">Send reset token</button>
    </form><p *ngIf="message">{{ message }}</p>
    <form [formGroup]="resetForm" (ngSubmit)="reset()" class="form-stack" style="margin-top:24px">
      <mat-form-field appearance="outline"><mat-label>One-time token</mat-label><input matInput formControlName="token" /></mat-form-field>
      <mat-form-field appearance="outline"><mat-label>New password</mat-label><input matInput type="password" formControlName="password" /></mat-form-field>
      <button mat-raised-button color="primary" type="submit" [disabled]="resetForm.invalid">Set new password</button>
    </form><p class="muted" *ngIf="error">{{ error }}</p>
  </mat-card-content></mat-card><p><a routerLink="/login">Back to sign in</a></p></div>`
})
export class ForgotPasswordComponent {
  message = ''; error = '';
  requestForm = this.fb.nonNullable.group({ email: ['', [Validators.required, Validators.email]] });
  resetForm = this.fb.nonNullable.group({ token: ['', Validators.required], password: ['', [Validators.required, Validators.minLength(8)]] });
  constructor(private fb: FormBuilder, private auth: AuthService) {}
  request(): void { this.error = ''; this.auth.forgotPassword(this.requestForm.getRawValue().email).subscribe({
    next: (r) => this.message = r.message, error: (e) => this.error = e?.error?.message || 'Could not request reset'
  }); }
  reset(): void { this.error = ''; const value = this.resetForm.getRawValue(); this.auth.resetPassword(value.token, value.password).subscribe({
    next: () => this.message = 'Password changed. You can sign in now.', error: (e) => this.error = e?.error?.message || 'Reset failed'
  }); }
}
