import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/login.component').then((m) => m.LoginComponent), canActivate: [guestGuard] },
  { path: 'register', loadComponent: () => import('./pages/register.component').then((m) => m.RegisterComponent), canActivate: [guestGuard] },
  { path: 'forgot-password', loadComponent: () => import('./pages/forgot-password.component').then((m) => m.ForgotPasswordComponent), canActivate: [guestGuard] },
  {
    path: '',
    loadComponent: () => import('./pages/shell.component').then((m) => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      { path: '', loadComponent: () => import('./pages/citizen-home.component').then((m) => m.CitizenHomeComponent), canActivate: [roleGuard(['CITIZEN'])] },
      { path: 'complaints/:id', loadComponent: () => import('./pages/complaint-detail.component').then((m) => m.ComplaintDetailComponent) },
      { path: 'staff', loadComponent: () => import('./pages/staff-queue.component').then((m) => m.StaffQueueComponent), canActivate: [roleGuard(['SUPERVISOR', 'ADMIN'])] },
      { path: 'crew', loadComponent: () => import('./pages/crew-board.component').then((m) => m.CrewBoardComponent), canActivate: [roleGuard(['CREW', 'ADMIN'])] },
      { path: 'admin', loadComponent: () => import('./pages/admin-page.component').then((m) => m.AdminPageComponent), canActivate: [roleGuard(['ADMIN'])] }
    ]
  },
  { path: '**', redirectTo: '' }
];
