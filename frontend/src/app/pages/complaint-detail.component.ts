import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { Complaint, User } from '../models';
import { ComplaintService } from '../services/complaint.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-complaint-detail',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatSelectModule
  ],
  template: `
    <div class="page" *ngIf="complaint as c">
      <p class="muted">{{ c.ticketNo }}</p>
      <h1>{{ c.title }}</h1>
      <p><span class="status-chip" [ngClass]="'status-' + c.status">{{ c.status }}</span> · {{ c.priority }} · {{ c.category.name }}</p>
      <p>{{ c.description }}</p>
      <p class="muted">{{ c.location }} · filed by {{ c.createdByName }}</p>
      <p *ngIf="c.workOrder" class="muted">Assigned to {{ c.workOrder.assigneeName }} ({{ c.workOrder.status }})</p>

      @if (canStaff) {
        <mat-card style="margin: 16px 0;">
          <mat-card-content>
            <h3>Workflow</h3>
            @if (auth.hasAnyRole(['SUPERVISOR', 'ADMIN'])) {
              <form [formGroup]="assignForm" (ngSubmit)="assign()" class="form-stack" style="max-width: none;">
                <mat-form-field appearance="outline">
                  <mat-label>Assign crew</mat-label>
                  <mat-select formControlName="assigneeId">
                    @for (member of crew; track member.id) {
                      <mat-option [value]="member.id">{{ member.fullName }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
                <button mat-stroked-button type="submit">Assign</button>
              </form>
            }
            <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px;">
              @for (status of nextActions; track status) {
                <button mat-raised-button color="primary" type="button" (click)="setStatus(status)">{{ status }}</button>
              }
            </div>
          </mat-card-content>
        </mat-card>
      }

      <h3>Timeline</h3>
      <ul>
        @for (item of c.history; track item.id) {
          <li>{{ item.createdAt | date:'short' }} — {{ item.actorName }}: {{ item.oldStatus || '—' }} → {{ item.newStatus }}
            <span *ngIf="item.comment"> ({{ item.comment }})</span>
          </li>
        }
      </ul>

      <h3>Comments</h3>
      @for (item of c.comments; track item.id) {
        <p><strong>{{ item.authorName }}</strong> <span class="muted">{{ item.createdAt | date:'short' }}</span><br />{{ item.body }}</p>
      }
      <form [formGroup]="commentForm" (ngSubmit)="addComment()" class="form-stack">
        <mat-form-field appearance="outline">
          <mat-label>Add a note</mat-label>
          <textarea matInput formControlName="body" rows="3"></textarea>
        </mat-form-field>
        <button mat-stroked-button type="submit" [disabled]="commentForm.invalid">Post comment</button>
      </form>
    </div>
  `
})
export class ComplaintDetailComponent implements OnInit {
  complaint: Complaint | null = null;
  crew: User[] = [];
  commentForm = this.fb.nonNullable.group({ body: ['', Validators.required] });
  assignForm = this.fb.nonNullable.group({ assigneeId: [0, Validators.required] });

  constructor(
    private route: ActivatedRoute,
    private complaints: ComplaintService,
    public auth: AuthService,
    private fb: FormBuilder
  ) {}

  get canStaff(): boolean {
    return this.auth.hasAnyRole(['SUPERVISOR', 'ADMIN', 'CREW']);
  }

  get nextActions(): string[] {
    const status = this.complaint?.status;
    if (!status) {
      return [];
    }
    const isCrew = this.auth.hasAnyRole(['CREW']) && !this.auth.hasAnyRole(['SUPERVISOR', 'ADMIN']);
    const map: Record<string, string[]> = {
      SUBMITTED: ['ACKNOWLEDGED', 'REJECTED'],
      ACKNOWLEDGED: [],
      ASSIGNED: ['IN_PROGRESS'],
      IN_PROGRESS: ['ON_HOLD', 'RESOLVED'],
      ON_HOLD: ['IN_PROGRESS'],
      RESOLVED: ['CLOSED'],
      CLOSED: ['REOPENED'],
      REOPENED: [],
      REJECTED: []
    };
    const allowed = map[status] || [];
    if (isCrew) {
      return allowed.filter((s) => ['IN_PROGRESS', 'ON_HOLD', 'RESOLVED'].includes(s));
    }
    return allowed;
  }

  ngOnInit(): void {
    this.load();
    if (this.auth.hasAnyRole(['SUPERVISOR', 'ADMIN'])) {
      this.complaints.crew().subscribe((crew) => (this.crew = crew));
    }
  }

  load(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.complaints.get(id).subscribe((c) => (this.complaint = c));
  }

  addComment(): void {
    if (!this.complaint) {
      return;
    }
    this.complaints.comment(this.complaint.id, this.commentForm.getRawValue().body).subscribe(() => {
      this.commentForm.reset({ body: '' });
      this.load();
    });
  }

  setStatus(status: string): void {
    if (!this.complaint) {
      return;
    }
    this.complaints.updateStatus(this.complaint.id, status).subscribe((c) => (this.complaint = c));
  }

  assign(): void {
    if (!this.complaint) {
      return;
    }
    this.complaints.assign(this.complaint.id, Number(this.assignForm.getRawValue().assigneeId)).subscribe((c) => (this.complaint = c));
  }
}
