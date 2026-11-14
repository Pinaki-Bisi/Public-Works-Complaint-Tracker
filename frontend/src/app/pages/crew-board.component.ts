import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { Complaint } from '../models';
import { ComplaintService } from '../services/complaint.service';

@Component({
  selector: 'app-crew-board',
  standalone: true,
  imports: [CommonModule, RouterLink, MatTableModule, MatButtonModule],
  template: `
    <div class="page">
      <h1>Assigned work</h1>
      <table mat-table [dataSource]="rows" class="full-width">
        <ng-container matColumnDef="ticketNo">
          <th mat-header-cell *matHeaderCellDef>Ticket</th>
          <td mat-cell *matCellDef="let row"><a [routerLink]="['/complaints', row.id]">{{ row.ticketNo }}</a></td>
        </ng-container>
        <ng-container matColumnDef="title">
          <th mat-header-cell *matHeaderCellDef>Title</th>
          <td mat-cell *matCellDef="let row">{{ row.title }}</td>
        </ng-container>
        <ng-container matColumnDef="location">
          <th mat-header-cell *matHeaderCellDef>Location</th>
          <td mat-cell *matCellDef="let row">{{ row.location }}</td>
        </ng-container>
        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Status</th>
          <td mat-cell *matCellDef="let row"><span class="status-chip" [ngClass]="'status-' + row.status">{{ row.status }}</span></td>
        </ng-container>
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let row">
            @if (row.status === 'ASSIGNED') {
              <button mat-stroked-button (click)="advance(row, 'IN_PROGRESS')">Start</button>
            }
            @if (row.status === 'IN_PROGRESS') {
              <button mat-stroked-button (click)="advance(row, 'RESOLVED')">Resolve</button>
            }
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns;"></tr>
      </table>
      <p *ngIf="rows.length === 0" class="muted">No assigned work orders.</p>
    </div>
  `
})
export class CrewBoardComponent implements OnInit {
  rows: Complaint[] = [];
  columns = ['ticketNo', 'title', 'location', 'status', 'actions'];

  constructor(private complaints: ComplaintService) {}

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.complaints.list().subscribe((rows) => (this.rows = rows));
  }

  advance(row: Complaint, status: string): void {
    this.complaints.updateStatus(row.id, status).subscribe(() => this.reload());
  }
}
