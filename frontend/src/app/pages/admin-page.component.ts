import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { Department, User } from '../models';
import { AdminService } from '../services/admin.service';
import { ComplaintService } from '../services/complaint.service';
import { Category } from '../models';

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatTableModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatCardModule
  ],
  template: `
    <div class="page">
      <h1>Administration</h1>
      <mat-card>
        <mat-card-content>
          <h3>Create user</h3>
          <form [formGroup]="form" (ngSubmit)="create()" class="form-stack" style="max-width: none;">
            <mat-form-field appearance="outline"><mat-label>Full name</mat-label><input matInput formControlName="fullName" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Username</mat-label><input matInput formControlName="username" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Email</mat-label><input matInput formControlName="email" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Password</mat-label><input matInput type="password" formControlName="password" /></mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Department</mat-label>
              <mat-select formControlName="departmentId">
                <mat-option [value]="null">None</mat-option>
                @for (dept of departments; track dept.id) {
                  <mat-option [value]="dept.id">{{ dept.name }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Roles</mat-label>
              <mat-select formControlName="roles" multiple>
                <mat-option value="CITIZEN">CITIZEN</mat-option>
                <mat-option value="CREW">CREW</mat-option>
                <mat-option value="SUPERVISOR">SUPERVISOR</mat-option>
                <mat-option value="ADMIN">ADMIN</mat-option>
              </mat-select>
            </mat-form-field>
            <p class="muted" *ngIf="error">{{ error }}</p>
            <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid">Create user</button>
          </form>
        </mat-card-content>
      </mat-card>

      <h3 style="margin-top: 24px;">Users</h3>
      <table mat-table [dataSource]="users" class="full-width">
        <ng-container matColumnDef="username"><th mat-header-cell *matHeaderCellDef>Username</th><td mat-cell *matCellDef="let row">{{ row.username }}</td></ng-container>
        <ng-container matColumnDef="fullName"><th mat-header-cell *matHeaderCellDef>Name</th><td mat-cell *matCellDef="let row">{{ row.fullName }}</td></ng-container>
        <ng-container matColumnDef="roles"><th mat-header-cell *matHeaderCellDef>Roles</th><td mat-cell *matCellDef="let row">{{ row.roles.join(', ') }}</td></ng-container>
        <ng-container matColumnDef="department"><th mat-header-cell *matHeaderCellDef>Dept</th><td mat-cell *matCellDef="let row">{{ row.departmentName || '—' }}</td></ng-container>
        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns;"></tr>
      </table>

      <h3 style="margin-top: 24px;">Categories</h3>
      <ul>
        @for (cat of categories; track cat.id) {
          <li>{{ cat.name }} — {{ cat.departmentName }}</li>
        }
      </ul>
    </div>
  `
})
export class AdminPageComponent implements OnInit {
  users: User[] = [];
  departments: Department[] = [];
  categories: Category[] = [];
  columns = ['username', 'fullName', 'roles', 'department'];
  error = '';
  form = this.fb.nonNullable.group({
    fullName: ['', Validators.required],
    username: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    departmentId: this.fb.control<number | null>(null),
    roles: this.fb.nonNullable.control<string[]>(['CITIZEN'], Validators.required)
  });

  constructor(private fb: FormBuilder, private admin: AdminService, private complaints: ComplaintService) {}

  ngOnInit(): void {
    this.reload();
    this.admin.departments().subscribe((d) => (this.departments = d));
    this.complaints.categories().subscribe((c) => (this.categories = c));
  }

  reload(): void {
    this.admin.users().subscribe((u) => (this.users = u));
  }

  create(): void {
    this.error = '';
    const value = this.form.getRawValue();
    this.admin.createUser({
      username: value.username,
      email: value.email,
      password: value.password,
      fullName: value.fullName,
      departmentId: value.departmentId,
      roles: value.roles
    }).subscribe({
      next: () => {
        this.form.reset({
          fullName: '',
          username: '',
          email: '',
          password: '',
          departmentId: null,
          roles: ['CITIZEN']
        });
        this.reload();
      },
      error: (err) => (this.error = err?.error?.message || 'Create failed')
    });
  }
}
