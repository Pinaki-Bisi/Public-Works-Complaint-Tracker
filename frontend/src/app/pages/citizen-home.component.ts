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
      <section class="hero-panel">
        <p class="eyebrow">Community service desk</p>
        <h1>Let’s make our streets better.</h1>
        <p>Report a local issue and follow its progress from the first review through repair.</p>
        <div class="hero-actions"><button mat-raised-button type="button" (click)="scrollToForm()">Report an issue</button></div>
      </section>

      <section class="metrics-grid">
        <mat-card class="metric-card" style="--metric-tint:#e3f2ef"><mat-card-content><span class="metric-icon">#</span><div class="metric-label">Reports submitted</div><div class="metric-value">{{ tickets.length }}</div></mat-card-content></mat-card>
        <mat-card class="metric-card" style="--metric-tint:#fff2d7"><mat-card-content><span class="metric-icon">↗</span><div class="metric-label">Being worked on</div><div class="metric-value">{{ activeCount }}</div></mat-card-content></mat-card>
        <mat-card class="metric-card" style="--metric-tint:#e3f2e8"><mat-card-content><span class="metric-icon">✓</span><div class="metric-label">Completed</div><div class="metric-value">{{ completedCount }}</div></mat-card-content></mat-card>
      </section>

      <section class="content-grid" id="complaint-form">
      <mat-card class="surface-card">
        <mat-card-content>
          <p class="eyebrow">New report</p><h2 style="margin:5px 0 18px">Tell us what needs attention</h2>
          <form [formGroup]="form" (ngSubmit)="submit()" class="complaint-form-grid">
            <mat-form-field appearance="outline" class="form-wide">
              <mat-label>Title</mat-label>
              <input matInput formControlName="title" placeholder="e.g. Pothole near the park entrance" />
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
            <mat-form-field appearance="outline" class="form-wide">
              <mat-label>Location</mat-label>
              <input matInput formControlName="location" placeholder="Street, landmark, or intersection" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="form-wide">
              <mat-label>Description</mat-label>
              <textarea matInput rows="4" formControlName="description" placeholder="Share details that may help the repair team."></textarea>
            </mat-form-field>
            <p class="muted" *ngIf="error">{{ error }}</p>
            <div class="form-actions form-wide"><button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || loading">{{ loading ? 'Sending report…' : 'Submit report' }}</button><span class="muted">We’ll add it to your ticket list.</span></div>
          </form>
        </mat-card-content>
      </mat-card>

      <aside class="info-panel">
        <p class="eyebrow">What happens next</p><h3>Your report has a clear path</h3>
        <div class="process-step"><span class="step-number">01</span><span><b>Review</b><br><span class="muted">A supervisor checks the details.</span></span></div>
        <div class="process-step"><span class="step-number">02</span><span><b>Assignment</b><br><span class="muted">The right department schedules a crew.</span></span></div>
        <div class="process-step"><span class="step-number">03</span><span><b>Repair</b><br><span class="muted">Track updates until the work is complete.</span></span></div>
      </aside>
      </section>

      <div class="section-heading"><div><p class="eyebrow">Your activity</p><h2>My reports</h2><p>Updates from your neighborhood.</p></div></div>
      <div class="data-card table-wrap">
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
          <td mat-cell *matCellDef="let row"><span class="priority-tag" [ngClass]="'priority-' + row.priority">{{ row.priority }}</span></td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns;"></tr>
      </table>
      <div *ngIf="tickets.length === 0" class="empty-state"><span class="empty-mark">+</span><h3>No reports yet</h3><p>When you submit an issue, you’ll be able to track it here.</p></div>
      </div>
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

  get activeCount(): number { return this.tickets.filter((ticket) => !['RESOLVED', 'CLOSED', 'REJECTED'].includes(ticket.status)).length; }
  get completedCount(): number { return this.tickets.filter((ticket) => ['RESOLVED', 'CLOSED'].includes(ticket.status)).length; }

  scrollToForm(): void { document.getElementById('complaint-form')?.scrollIntoView({ behavior: 'smooth' }); }

  ngOnInit(): void {
    this.complaints.categories().subscribe((cats) => (this.categories = cats));
    this.reload();
  }

  reload(): void {
    this.complaints.list({ size: 50 }).subscribe((result) => (this.tickets = result.content));
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
