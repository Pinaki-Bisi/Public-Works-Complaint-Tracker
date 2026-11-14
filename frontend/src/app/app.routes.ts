import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './auth.guard';
import { LoginComponent } from './pages/login.component';
import { RegisterComponent } from './pages/register.component';
import { ShellComponent } from './pages/shell.component';
import { CitizenHomeComponent } from './pages/citizen-home.component';
import { ComplaintDetailComponent } from './pages/complaint-detail.component';
import { StaffQueueComponent } from './pages/staff-queue.component';
import { CrewBoardComponent } from './pages/crew-board.component';
import { AdminPageComponent } from './pages/admin-page.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [guestGuard] },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', component: CitizenHomeComponent, canActivate: [roleGuard(['CITIZEN'])] },
      { path: 'complaints/:id', component: ComplaintDetailComponent },
      { path: 'staff', component: StaffQueueComponent, canActivate: [roleGuard(['SUPERVISOR', 'ADMIN'])] },
      { path: 'crew', component: CrewBoardComponent, canActivate: [roleGuard(['CREW', 'ADMIN'])] },
      { path: 'admin', component: AdminPageComponent, canActivate: [roleGuard(['ADMIN'])] }
    ]
  },
  { path: '**', redirectTo: '' }
];
