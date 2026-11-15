import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Complaint } from '../models';
import { ComplaintService } from '../services/complaint.service';

@Component({
  selector: 'app-staff-queue',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, MatFormFieldModule, MatSelectModule, MatTableModule, MatInputModule, MatButtonModule],
  template: `
    <div class="page">
      <div class="page-heading"><div><p class="eyebrow">Operations</p><h1>Supervisor queue</h1><p>Review reports, prioritize repairs, and coordinate field crews.</p></div>
        <span class="role-tag">{{ total }} records</span></div>
      <div class="filter-panel">
        <mat-form-field appearance="outline"><mat-label>Search ticket, title, location</mat-label>
          <input matInput [(ngModel)]="query" (keyup.enter)="page=0;reload()" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Priority</mat-label>
          <mat-select [(ngModel)]="priority" (selectionChange)="page=0;reload()">
            <mat-option value="">All</mat-option><mat-option value="LOW">Low</mat-option>
            <mat-option value="MEDIUM">Medium</mat-option><mat-option value="HIGH">High</mat-option><mat-option value="URGENT">Urgent</mat-option>
          </mat-select></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Sort by</mat-label><mat-select [(ngModel)]="sort" (selectionChange)="reload()">
          <mat-option value="createdAt,desc">Newest</mat-option><mat-option value="createdAt,asc">Oldest</mat-option>
          <mat-option value="priority,desc">Priority</mat-option><mat-option value="status,asc">Status</mat-option>
        </mat-select></mat-form-field>
        <button mat-button (click)="page=0;reload()">Search</button>
        <mat-form-field appearance="outline"><mat-label>From date</mat-label><input matInput type="date" [(ngModel)]="fromDate" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>To date</mat-label><input matInput type="date" [(ngModel)]="toDate" /></mat-form-field>
      </div>
      <mat-form-field appearance="outline">
        <mat-label>Status</mat-label>
        <mat-select [(ngModel)]="status" (selectionChange)="reload()">
          <mat-option value="">All</mat-option>
          @for (s of statuses; track s) {
            <mat-option [value]="s">{{ s }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
      <div class="data-card table-wrap">
      <table mat-table [dataSource]="rows" class="full-width">
        <ng-container matColumnDef="ticketNo">
          <th mat-header-cell *matHeaderCellDef>Ticket</th>
          <td mat-cell *matCellDef="let row"><a [routerLink]="['/complaints', row.id]">{{ row.ticketNo }}</a></td>
        </ng-container>
        <ng-container matColumnDef="title">
          <th mat-header-cell *matHeaderCellDef>Title</th>
          <td mat-cell *matCellDef="let row">{{ row.title }}</td>
        </ng-container>
        <ng-container matColumnDef="category">
          <th mat-header-cell *matHeaderCellDef>Category</th>
          <td mat-cell *matCellDef="let row">{{ row.category.name }}</td>
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
      <div *ngIf="rows.length===0" class="empty-state"><span class="empty-mark">⌕</span><h3>No matching complaints</h3><p>Try changing the search or filter values.</p></div>
      <div class="pagination-bar">
        <button mat-button [disabled]="page===0" (click)="page=page-1;reload()">Previous</button>
        <span>{{ total }} complaints · page {{ page + 1 }}</span>
        <button mat-button [disabled]="(page+1)*size>=total" (click)="page=page+1;reload()">Next</button>
      </div>
      </div>
    </div>
  `
})
export class StaffQueueComponent implements OnInit {
  rows: Complaint[] = [];
  status = '';
  query = '';
  priority = '';
  page = 0;
  size = 20;
  total = 0;
  fromDate = '';
  toDate = '';
  sort = 'createdAt,desc';
  statuses = ['SUBMITTED', 'ACKNOWLEDGED', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD', 'RESOLVED', 'CLOSED', 'REJECTED', 'REOPENED'];
  columns = ['ticketNo', 'title', 'category', 'status', 'priority'];

  constructor(private complaints: ComplaintService) {}

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.complaints.list({ status: this.status || undefined, q: this.query || undefined,
      priority: this.priority || undefined, page: this.page, size: this.size,
      sort: this.sort,
      fromDate: this.fromDate ? new Date(`${this.fromDate}T00:00:00Z`).toISOString() : undefined,
      toDate: this.toDate ? new Date(new Date(`${this.toDate}T00:00:00Z`).getTime() + 86400000).toISOString() : undefined })
      .subscribe((result) => { this.rows = result.content; this.total = result.totalElements; });
  }
}
