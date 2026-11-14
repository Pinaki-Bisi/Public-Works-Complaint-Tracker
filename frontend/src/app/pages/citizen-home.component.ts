import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { Category, Complaint } from '../models';
import { ComplaintService } from '../services/complaint.service';

@Component({
  selector: 'app-citizen-home',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink, MatCardModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatTableModule
  ],
  template: `
    <div class="page">
      <h1>File a complaint</h1>
      <p class="muted">Report potholes, streetlights, leaks, and other public infrastructure issues.</p>
      <mat-card>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="submit()" class="form-stack" style="max-width: none; margin-top: 8px;">
            <mat-form-field appearance="outline">
              <mat-label>Title</mat-label>
              <input matInput formControlName="title" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Category</mat-label>
              <mat-select formControlName="categoryId">
                @for (cat of categories; track cat.id) {
                  <mat-option [value]="cat.id">{{ cat.name }} ({{ cat.departmentName }})</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Priority</mat-label>
              <mat-select formControlName="priority">
                <mat-option value="LOW">Low</mat-option>
                <mat-option value="MEDIUM">Medium</mat-option>
                <mat-option value="HIGH">High</mat-option>
                <mat-option value="URGENT">Urgent</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Location</mat-label>
              <input matInput formControlName="location" placeholder="Street, landmark, or intersection" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Description</mat-label>
              <textarea matInput rows="4" formControlName="description"></textarea>
            </mat-form-field>
            <p class="muted" *ngIf="error">{{ error }}</p>
            <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || loading">Submit complaint</button>
          </form>
        </mat-card-content>
      </mat-card>

      <h2 style="margin-top: 32px;">My tickets</h2>
      <table mat-table [dataSource]="tickets" class="full-width">
        <ng-container matColumnDef="ticketNo">
          <th mat-header-cell *matHeaderCellDef>Ticket</th>
          <td mat-cell *matCellDef="let row"><a [routerLink]="['/complaints', row.id]">{{ row.ticketNo }}</a></td>
        </ng-container>
        <ng-container matColumnDef="title">
          <th mat-header-cell *matHeaderCellDef>Title</th>
          <td mat-cell *matCellDef="let row">{{ row.title }}</td>
        </ng-container>
        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Status</th>
          <td mat-cell *matCellDef="let row"><span class="status-chip" [ngClass]="'status-' + row.status">{{ row.status }}</span></td>
        </ng-container>
        <ng-container matColumnDef="priority">
          <th mat-header-cell *matHeaderCellDef>Priority</th>
          <td mat-cell *matCellDef="let row">{{ row.priority }}</td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns;"></tr>
      </table>
      <p *ngIf="tickets.length === 0" class="muted">No complaints yet.</p>
    </div>
  `
})
export class CitizenHomeComponent implements OnInit {
  categories: Category[] = [];
  tickets: Complaint[] = [];
  columns = ['ticketNo', 'title', 'status', 'priority'];
  loading = false;
  error = '';
  form = this.fb.group({
    title: ['', Validators.required],
    categoryId: this.fb.control<number | null>(null, Validators.required),
    priority: ['MEDIUM', Validators.required],
    location: ['', Validators.required],
    description: ['']
  });

  constructor(private fb: FormBuilder, private complaints: ComplaintService) {}

  ngOnInit(): void {
    this.complaints.categories().subscribe((cats) => (this.categories = cats));
    this.reload();
  }

  reload(): void {
    this.complaints.list().subscribe((rows) => (this.tickets = rows));
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }
    this.loading = true;
    this.error = '';
    const value = this.form.getRawValue();
    this.complaints.create({
      title: value.title ?? '',
      description: value.description ?? '',
      location: value.location ?? '',
      categoryId: Number(value.categoryId),
      priority: value.priority ?? 'MEDIUM'
    }).subscribe({
      next: () => {
        this.loading = false;
        this.form.reset({ title: '', categoryId: null, priority: 'MEDIUM', location: '', description: '' });
        this.reload();
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Could not submit';
      }
    });
  }
}
