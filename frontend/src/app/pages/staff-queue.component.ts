import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { Complaint } from '../models';
import { ComplaintService } from '../services/complaint.service';

@Component({
  selector: 'app-staff-queue',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, MatFormFieldModule, MatSelectModule, MatTableModule],
  template: `
    <div class="page">
      <h1>Supervisor queue</h1>
      <p class="muted">Acknowledge, assign crews, and close completed repairs.</p>
      <mat-form-field appearance="outline">
        <mat-label>Status</mat-label>
        <mat-select [(ngModel)]="status" (selectionChange)="reload()">
          <mat-option value="">All</mat-option>
          @for (s of statuses; track s) {
            <mat-option [value]="s">{{ s }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
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
          <td mat-cell *matCellDef="let row">{{ row.priority }}</td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns;"></tr>
      </table>
    </div>
  `
})
export class StaffQueueComponent implements OnInit {
  rows: Complaint[] = [];
  status = '';
  statuses = ['SUBMITTED', 'ACKNOWLEDGED', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD', 'RESOLVED', 'CLOSED', 'REJECTED', 'REOPENED'];
  columns = ['ticketNo', 'title', 'category', 'status', 'priority'];

  constructor(private complaints: ComplaintService) {}

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.complaints.list(this.status ? { status: this.status } : undefined).subscribe((rows) => (this.rows = rows));
  }
}
