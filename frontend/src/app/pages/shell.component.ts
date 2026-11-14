import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatToolbarModule, MatButtonModule],
  template: `
    <div class="app-shell">
      <mat-toolbar color="primary">
        <span class="toolbar-title">PWCT</span>
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
        <span style="flex: 1 1 auto;"></span>
        <span>{{ auth.currentUser()?.fullName }}</span>
        <button mat-button (click)="auth.logout()">Sign out</button>
      </mat-toolbar>
      <router-outlet />
    </div>
  `
})
export class ShellComponent {
  constructor(public auth: AuthService) {}
}
