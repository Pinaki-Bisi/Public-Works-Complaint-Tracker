import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, MatToolbarModule, MatButtonModule, MatMenuModule, MatBadgeModule],
  template: `
    <div class="app-shell">
      <mat-toolbar class="app-toolbar">
        <div class="brand-lockup">
          <span class="brand-mark">PW</span>
          <span><span class="brand-name">CivicWorks</span><span class="brand-caption">Public service portal</span></span>
        </div>
        <nav class="main-nav" aria-label="Main navigation">
          @if (auth.hasAnyRole(['CITIZEN'])) {
            <a mat-button routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">My complaints</a>
          }
          @if (auth.hasAnyRole(['SUPERVISOR', 'ADMIN'])) {
            <a mat-button routerLink="/staff" routerLinkActive="active">Staff queue</a>
          }
          @if (auth.hasAnyRole(['CREW', 'ADMIN'])) {
            <a mat-button routerLink="/crew" routerLinkActive="active">Crew board</a>
          }
          @if (auth.hasAnyRole(['ADMIN'])) {
            <a mat-button routerLink="/admin" routerLinkActive="active">Admin</a>
          }
        </nav>
        <span class="toolbar-spacer"></span>
        <button class="toolbar-action" mat-button [matMenuTriggerFor]="noticeMenu" [matBadge]="unread" [matBadgeHidden]="unread===0">Notifications</button>
        <mat-menu #noticeMenu="matMenu">
          @for (notice of notifications.items(); track notice.id) {
            <button mat-menu-item (click)="openNotice(notice.id, notice.complaintId)">
              <span>{{ notice.message }}</span>@if (!notice.readAt) { <b> · New</b> }
            </button>
          } @empty { <button mat-menu-item disabled>No notifications</button> }
        </mat-menu>
        <span class="user-name">{{ auth.currentUser()?.fullName }}</span>
        <button class="toolbar-action" mat-button (click)="auth.logout()">Sign out</button>
      </mat-toolbar>
      <router-outlet />
    </div>
  `
})
export class ShellComponent {
  constructor(public auth: AuthService, public notifications: NotificationService, private router: Router) {
    notifications.load();
  }
  get unread(): number { return this.notifications.items().filter((item) => !item.readAt).length; }
  openNotice(id: number, complaintId: number | null): void {
    this.notifications.markRead(id);
    if (complaintId) this.router.navigate(['/complaints', complaintId]);
  }
}
