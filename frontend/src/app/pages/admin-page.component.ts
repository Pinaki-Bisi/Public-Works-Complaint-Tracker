import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { Department, User, Analytics, Category, OverdueComplaint } from '../models';
import { AdminService } from '../services/admin.service';
import { ComplaintService } from '../services/complaint.service';

type AdminSection = 'dashboard' | 'users' | 'departments' | 'categories' | 'reports';

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatTableModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule],
  template: `
    <div class="admin-layout">
      <aside class="admin-sidebar" aria-label="Administration options">
        <div class="sidebar-heading"><span class="sidebar-mark">CW</span><div><b>Admin tools</b><small>Workspace</small></div></div>
        <p class="sidebar-label">MANAGE</p>
        <button type="button" class="sidebar-link" [class.selected]="activeSection==='dashboard'" (click)="openSection('dashboard')"><span class="sidebar-icon">▦</span>Dashboard</button>
        <button type="button" class="sidebar-link" [class.selected]="activeSection==='users'" (click)="openSection('users')"><span class="sidebar-icon">♙</span>Users<span class="sidebar-count">{{ users.length }}</span></button>
        <button type="button" class="sidebar-link" [class.selected]="activeSection==='departments'" (click)="openSection('departments')"><span class="sidebar-icon">⌂</span>Departments<span class="sidebar-count">{{ departments.length }}</span></button>
        <button type="button" class="sidebar-link" [class.selected]="activeSection==='categories'" (click)="openSection('categories')"><span class="sidebar-icon">▤</span>Categories<span class="sidebar-count">{{ categories.length }}</span></button>
        <p class="sidebar-label sidebar-label-lower">INSIGHTS</p>
        <button type="button" class="sidebar-link" [class.selected]="activeSection==='reports'" (click)="openSection('reports')"><span class="sidebar-icon">↗</span>Reports</button>
        <div class="sidebar-note"><span class="sidebar-note-dot"></span><span>Data refreshes from your service database.</span></div>
      </aside>

      <main class="admin-main">
        <header class="admin-topline">
          <div><p class="eyebrow">CITY OPERATIONS / ADMINISTRATION</p><h1>{{ sectionTitle }}</h1><p>{{ sectionDescription }}</p></div>
          <button mat-stroked-button type="button" (click)="refreshCurrent()">Refresh data</button>
        </header>

        @if (activeSection === 'dashboard') {
          @if (analyticsError) { <div class="admin-error" role="alert">{{ analyticsError }} <button mat-button (click)="loadAnalytics()">Retry</button></div> }
          @if (analyticsLoading) { <div class="admin-loading"><span class="loading-dot"></span> Loading service analytics…</div> }
          @if (!analyticsLoading && analytics) {
            <section class="admin-metrics" aria-label="Complaint summary">
              <article class="admin-metric metric-teal"><span class="metric-symbol">#</span><p>Total complaints</p><strong>{{ analytics.total }}</strong><small>All reported issues</small></article>
              <article class="admin-metric metric-amber"><span class="metric-symbol">↗</span><p>Pending work</p><strong>{{ analytics.pending }}</strong><small>Awaiting completion</small></article>
              <article class="admin-metric metric-green"><span class="metric-symbol">✓</span><p>Resolved</p><strong>{{ analytics.resolved }}</strong><small>Resolved or closed</small></article>
              <article class="admin-metric metric-blue"><span class="metric-symbol">◷</span><p>Avg. resolution</p><strong>{{ analytics.averageResolutionHours === null ? '—' : (analytics.averageResolutionHours | number:'1.0-1') }}</strong><small>Hours to first resolution</small></article>
            </section>

            @if (analytics.total === 0) {
              <section class="analytics-empty"><span class="empty-mark">▦</span><h2>No complaint data yet</h2><p>Once citizens submit reports, department and status charts will appear here.</p></section>
            } @else {
              <section class="admin-chart-grid">
                <article class="chart-card department-chart">
                  <div class="chart-heading"><div><p class="eyebrow">WORKLOAD</p><h2>Complaints by department</h2><p>Reports routed to each public works team.</p></div><span class="chart-badge">{{ departmentStats.length }} teams</span></div>
                  @if (departmentStats.length === 0) { <div class="chart-empty">Department data is not available yet.</div> }
                  @for (item of departmentStats; track item[0]) {
                    <div class="horizontal-bar-row"><div class="bar-caption"><span>{{ item[0] }}</span><b>{{ item[1] }}</b></div><div class="horizontal-track"><span [style.width.%]="departmentPercent(item[1])"></span></div></div>
                  }
                </article>

                <article class="chart-card status-chart-card">
                  <div class="chart-heading"><div><p class="eyebrow">LIFECYCLE</p><h2>Complaint status</h2><p>Current distribution across all teams.</p></div></div>
                  <div class="status-chart-content">
                    <div class="status-donut" [style.background]="statusChartBackground" role="img" [attr.aria-label]="statusChartLabel"><div><strong>{{ analytics.total }}</strong><small>total</small></div></div>
                    <div class="status-legend">
                      @for (item of statusStats; track item.name) {
                        <div class="legend-row"><span class="legend-swatch" [style.background]="statusColor(item.name)"></span><span>{{ statusLabel(item.name) }}</span><b>{{ item.count }}</b></div>
                      }
                      @if (statusStats.length === 0) { <div class="chart-empty">Status breakdown unavailable.</div> }
                    </div>
                  </div>
                </article>

                <article class="chart-card monthly-chart-card">
                  <div class="chart-heading"><div><p class="eyebrow">TREND</p><h2>Monthly reports</h2><p>Complaint submissions by month.</p></div></div>
                  @if (analytics.monthlyTrend.length === 0) { <div class="chart-empty">Monthly trend is not available yet.</div> }
                  <div class="monthly-chart" role="img" aria-label="Monthly complaint totals">
                    @for (item of analytics.monthlyTrend; track item.month) {
                      <div class="month-column"><b>{{ item.total }}</b><span class="month-bar-track"><span class="month-bar" [style.height.%]="monthPercent(item.total)"></span></span><small>{{ item.month }}</small></div>
                    }
                  </div>
                </article>

                <article class="chart-card department-performance-card">
                  <div class="chart-heading"><div><p class="eyebrow">SERVICE DELIVERY</p><h2>Department performance</h2><p>Open work compared with resolved complaints.</p></div></div>
                  @for (item of performanceStats; track item.department) {
                    <div class="performance-line"><div class="performance-name"><b>{{ item.department }}</b><span>{{ item.resolved }} resolved · {{ item.pending }} pending</span></div><div class="performance-track"><span class="performance-resolved" [style.width.%]="performancePercent(item.resolved, item.resolved + item.pending)"></span><span class="performance-pending" [style.width.%]="100 - performancePercent(item.resolved, item.resolved + item.pending)"></span></div></div>
                  }
                  @if (performanceStats.length === 0) { <div class="chart-empty">Department performance data is not available yet.</div> }
                </article>
              </section>
            }
          }
        }

        @if (activeSection === 'users') {
          <section class="admin-section-card">
            <div class="admin-section-heading"><div><p class="eyebrow">ACCESS CONTROL</p><h2>Create a user</h2><p>Add a staff member or citizen account.</p></div></div>
            <form [formGroup]="form" (ngSubmit)="create()" class="admin-form-grid">
              <mat-form-field appearance="outline"><mat-label>Full name</mat-label><input matInput formControlName="fullName" /></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Username</mat-label><input matInput formControlName="username" /></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Email</mat-label><input matInput type="email" formControlName="email" /></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Temporary password</mat-label><input matInput type="password" formControlName="password" /></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Department</mat-label><mat-select formControlName="departmentId"><mat-option [value]="null">None</mat-option>@for (dept of departments; track dept.id) { <mat-option [value]="dept.id">{{ dept.name }}</mat-option> }</mat-select></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Roles</mat-label><mat-select formControlName="roles" multiple><mat-option value="CITIZEN">Citizen</mat-option><mat-option value="CREW">Crew</mat-option><mat-option value="SUPERVISOR">Supervisor</mat-option><mat-option value="ADMIN">Admin</mat-option></mat-select></mat-form-field>
              <p class="admin-form-error" *ngIf="error">{{ error }}</p>
              <div class="admin-form-actions"><button mat-raised-button color="primary" type="submit" [disabled]="form.invalid">Create account</button></div>
            </form>
          </section>
          <section class="admin-section-card">
            <div class="admin-section-heading"><div><p class="eyebrow">TEAM DIRECTORY</p><h2>Users <span class="inline-count">{{ users.length }}</span></h2><p>Update roles or enable and disable accounts.</p></div></div>
            <div class="data-card table-wrap"><table mat-table [dataSource]="users" class="full-width">
              <ng-container matColumnDef="username"><th mat-header-cell *matHeaderCellDef>Username</th><td mat-cell *matCellDef="let row">{{ row.username }}</td></ng-container>
              <ng-container matColumnDef="fullName"><th mat-header-cell *matHeaderCellDef>Name</th><td mat-cell *matCellDef="let row">{{ row.fullName }}</td></ng-container>
              <ng-container matColumnDef="roles"><th mat-header-cell *matHeaderCellDef>Roles</th><td mat-cell *matCellDef="let row">{{ row.roles.join(', ') }}</td></ng-container>
              <ng-container matColumnDef="department"><th mat-header-cell *matHeaderCellDef>Department</th><td mat-cell *matCellDef="let row">{{ row.departmentName || '—' }}</td></ng-container>
              <ng-container matColumnDef="enabled"><th mat-header-cell *matHeaderCellDef>Account</th><td mat-cell *matCellDef="let row"><button mat-button (click)="toggleEnabled(row)">{{ row.enabled ? 'Disable' : 'Enable' }}</button></td></ng-container>
              <ng-container matColumnDef="editRoles"><th mat-header-cell *matHeaderCellDef>Change roles</th><td mat-cell *matCellDef="let row"><mat-select multiple [ngModel]="row.roles" (ngModelChange)="updateRoles(row, $event)" [ngModelOptions]="{standalone:true}"><mat-option value="CITIZEN">Citizen</mat-option><mat-option value="CREW">Crew</mat-option><mat-option value="SUPERVISOR">Supervisor</mat-option><mat-option value="ADMIN">Admin</mat-option></mat-select></td></ng-container>
              <tr mat-header-row *matHeaderRowDef="columns"></tr><tr mat-row *matRowDef="let row; columns: columns;"></tr>
            </table>
              @if (users.length === 0) { <div class="table-empty">No user accounts found.</div> }
            </div>
          </section>
        }

        @if (activeSection === 'departments') {
          <section class="admin-section-card">
            <div class="admin-section-heading"><div><p class="eyebrow">SERVICE TEAMS</p><h2>Departments</h2><p>Organize repair work by city service area.</p></div><span class="chart-badge">{{ departments.length }} departments</span></div>
            <div class="management-grid">
              @for (department of departments; track department.id) {
                <article class="management-card"><span class="management-icon">⌂</span><div><b>{{ department.name }}</b><small>{{ department.code }}</small></div><button mat-button type="button" (click)="removeDepartment(department.id)">Remove</button></article>
              } @empty { <div class="table-empty">No departments have been configured.</div> }
            </div>
            <form [formGroup]="departmentForm" (ngSubmit)="addDepartment()" class="inline-create-form">
              <mat-form-field appearance="outline"><mat-label>Department name</mat-label><input matInput formControlName="name" /></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Code</mat-label><input matInput formControlName="code" /></mat-form-field>
              <button mat-raised-button color="primary" type="submit" [disabled]="departmentForm.invalid">Add department</button>
            </form>
          </section>
        }

        @if (activeSection === 'categories') {
          <section class="admin-section-card">
            <div class="admin-section-heading"><div><p class="eyebrow">INTAKE SETTINGS</p><h2>Complaint categories</h2><p>Categories direct each complaint to the right department.</p></div><span class="chart-badge">{{ categories.length }} categories</span></div>
            <div class="management-grid">
              @for (cat of categories; track cat.id) {
                <article class="management-card"><span class="management-icon">▤</span><div><b>{{ cat.name }}</b><small>{{ cat.departmentName }}</small></div><button mat-button type="button" (click)="removeCategory(cat.id)">Remove</button></article>
              } @empty { <div class="table-empty">No complaint categories have been configured.</div> }
            </div>
            <form [formGroup]="categoryForm" (ngSubmit)="addCategory()" class="inline-create-form">
              <mat-form-field appearance="outline"><mat-label>Category name</mat-label><input matInput formControlName="name" /></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Department</mat-label><mat-select formControlName="departmentId">@for (d of departments; track d.id) { <mat-option [value]="d.id">{{ d.name }}</mat-option> }</mat-select></mat-form-field>
              <button mat-raised-button color="primary" type="submit" [disabled]="categoryForm.invalid">Add category</button>
            </form>
          </section>
        }

        @if (activeSection === 'reports') {
          <section class="admin-section-card">
            <div class="admin-section-heading"><div><p class="eyebrow">SHAREABLE DATA</p><h2>Reports and exports</h2><p>Download complaint data for reviews and planning.</p></div></div>
            <div class="export-grid"><article class="export-card"><span class="export-icon">XLS</span><h3>Excel workbook</h3><p>Complaint rows for sorting, analysis, and follow-up.</p><button mat-stroked-button type="button" (click)="download('xlsx')">Download Excel</button></article>
              <article class="export-card"><span class="export-icon export-pdf">PDF</span><h3>PDF report</h3><p>A shareable snapshot of complaints and current status.</p><button mat-stroked-button type="button" (click)="download('pdf')">Download PDF</button></article>
              <article class="export-card"><span class="export-icon export-overdue">!</span><h3>Overdue complaints</h3><p>Unresolved reports open longer than seven days.</p><button mat-stroked-button type="button" (click)="loadOverdue()">{{ overdueLoaded ? 'Refresh overdue list' : 'View overdue list' }}</button></article>
            </div>
            @if (overdueLoaded) {
              <div class="overdue-list"><h3>Overdue work <span class="inline-count">{{ overdue.length }}</span></h3>
                @for (item of overdue; track item.ticketNo) { <div class="overdue-row"><div><b>{{ item.ticketNo }} · {{ item.title }}</b><small>{{ item.department }} · {{ item.status }} · {{ item.assignee || 'Not assigned' }}</small></div><span>{{ item.createdAt | date:'mediumDate' }}</span></div> }
                @if (overdue.length === 0) { <div class="table-empty">No overdue complaints right now.</div> }
              </div>
            }
          </section>
        }
      </main>
    </div>
  `
})
export class AdminPageComponent implements OnInit {
  activeSection: AdminSection = 'dashboard';
  users: User[] = [];
  departments: Department[] = [];
  categories: Category[] = [];
  analytics: Analytics | null = null;
  overdue: OverdueComplaint[] = [];
  overdueLoaded = false;
  analyticsLoading = true;
  analyticsError = '';
  error = '';

  readonly statusColors: Record<string, string> = {
    SUBMITTED: '#6684a8', ACKNOWLEDGED: '#47899c', ASSIGNED: '#d5a03d', IN_PROGRESS: '#e18245',
    ON_HOLD: '#9172b6', RESOLVED: '#3b9a76', CLOSED: '#1f7056', REJECTED: '#c35d58', REOPENED: '#ac79a7'
  };

  readonly columns = ['username', 'fullName', 'roles', 'department', 'enabled', 'editRoles'];
  readonly sectionMeta: Record<AdminSection, { title: string; description: string }> = {
    dashboard: { title: 'Administration', description: 'Complaint activity and department performance at a glance.' },
    users: { title: 'User management', description: 'Create accounts, manage access, and update roles.' },
    departments: { title: 'Departments', description: 'Organize work into city service teams.' },
    categories: { title: 'Categories', description: 'Route incoming reports to the right department.' },
    reports: { title: 'Reports', description: 'Export complaint data and review overdue work.' }
  };

  form = this.fb.nonNullable.group({
    fullName: ['', Validators.required], username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]], password: ['', [Validators.required, Validators.minLength(8)]],
    departmentId: this.fb.control<number | null>(null),
    roles: this.fb.nonNullable.control<string[]>(['CITIZEN'], Validators.required)
  });
  categoryForm = this.fb.nonNullable.group({ name: ['', Validators.required], departmentId: [0, Validators.required] });
  departmentForm = this.fb.nonNullable.group({ name: ['', Validators.required], code: ['', Validators.required] });

  constructor(private fb: FormBuilder, private admin: AdminService, private complaints: ComplaintService) {}

  get sectionTitle(): string { return this.sectionMeta[this.activeSection].title; }
  get sectionDescription(): string { return this.sectionMeta[this.activeSection].description; }
  get departmentStats(): Array<[string, number]> {
    return Object.entries(this.analytics?.byDepartment ?? {}).sort((a, b) => b[1] - a[1]);
  }
  get maxDepartmentCount(): number { return Math.max(1, ...this.departmentStats.map(([, count]) => count)); }
  get statusStats(): Array<{ name: string; count: number }> {
    const totals: Record<string, number> = {};
    Object.values(this.analytics?.departmentPerformance ?? {}).forEach((statusCounts) => {
      Object.entries(statusCounts).forEach(([name, count]) => totals[name] = (totals[name] ?? 0) + count);
    });
    return Object.entries(totals).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
  }
  get statusChartBackground(): string {
    const total = this.statusStats.reduce((sum, item) => sum + item.count, 0);
    if (!total) return '#e8eeee';
    let cursor = 0;
    const ranges = this.statusStats.map((item) => {
      const start = cursor;
      cursor += item.count / total * 100;
      return `${this.statusColor(item.name)} ${start}% ${cursor}%`;
    });
    return `conic-gradient(${ranges.join(',')})`;
  }
  get statusChartLabel(): string {
    return this.statusStats.map((item) => `${this.statusLabel(item.name)} ${item.count}`).join(', ');
  }
  get performanceStats(): Array<{ department: string; resolved: number; pending: number }> {
    return Object.entries(this.analytics?.departmentPerformance ?? {}).map(([department, statuses]) => ({
      department,
      resolved: (statuses['RESOLVED'] ?? 0) + (statuses['CLOSED'] ?? 0),
      pending: Object.entries(statuses).filter(([status]) => !['RESOLVED', 'CLOSED', 'REJECTED'].includes(status))
        .reduce((sum, [, count]) => sum + count, 0)
    }));
  }
  get maxMonthCount(): number { return Math.max(1, ...(this.analytics?.monthlyTrend ?? []).map((item) => item.total)); }

  ngOnInit(): void {
    this.reload();
    this.admin.departments().subscribe((items) => this.departments = items);
    this.complaints.categories().subscribe((items) => this.categories = items);
    this.loadAnalytics();
  }

  openSection(section: AdminSection): void { this.activeSection = section; }
  departmentPercent(value: number): number { return Math.max(5, value / this.maxDepartmentCount * 100); }
  monthPercent(value: number): number { return Math.max(5, value / this.maxMonthCount * 100); }
  performancePercent(resolved: number, total: number): number { return total ? resolved / total * 100 : 0; }
  statusColor(name: string): string { return this.statusColors[name] ?? '#89999d'; }
  statusLabel(name: string): string { return name.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()); }

  refreshCurrent(): void {
    if (this.activeSection === 'dashboard') this.loadAnalytics();
    if (this.activeSection === 'users') this.reload();
    if (this.activeSection === 'departments') this.admin.departments().subscribe((items) => this.departments = items);
    if (this.activeSection === 'categories') this.complaints.categories().subscribe((items) => this.categories = items);
    if (this.activeSection === 'reports' && this.overdueLoaded) this.loadOverdue();
  }

  loadAnalytics(): void {
    this.analyticsLoading = true; this.analyticsError = '';
    this.admin.analytics().subscribe({
      next: (data) => { this.analytics = data; this.analyticsLoading = false; },
      error: (err) => { this.analyticsLoading = false; this.analyticsError = err?.error?.message || 'Analytics could not be loaded. Check the backend and database connection.'; }
    });
  }

  loadOverdue(): void {
    this.admin.overdue().subscribe({ next: (items) => { this.overdue = items; this.overdueLoaded = true; } });
  }
  toggleEnabled(user: User): void { this.admin.setEnabled(user.id, !user.enabled).subscribe(() => this.reload()); }
  updateRoles(user: User, roles: string[]): void { this.admin.updateRoles(user.id, roles).subscribe(() => this.reload()); }

  addCategory(): void {
    const value = this.categoryForm.getRawValue();
    this.admin.createCategory(value.name, value.departmentId).subscribe(() => {
      this.categoryForm.reset({ name: '', departmentId: 0 });
      this.complaints.categories().subscribe((items) => this.categories = items);
    });
  }
  removeCategory(id: number): void {
    this.admin.deleteCategory(id).subscribe(() => this.complaints.categories().subscribe((items) => this.categories = items));
  }
  addDepartment(): void {
    const value = this.departmentForm.getRawValue();
    this.admin.createDepartment(value.name, value.code).subscribe(() => {
      this.departmentForm.reset({ name: '', code: '' });
      this.admin.departments().subscribe((items) => this.departments = items);
    });
  }
  removeDepartment(id: number): void {
    this.admin.deleteDepartment(id).subscribe(() => this.admin.departments().subscribe((items) => this.departments = items));
  }
  download(format: 'xlsx' | 'pdf'): void {
    this.admin.exportComplaints(format).subscribe((blob) => {
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = `complaints.${format}`; anchor.click();
      URL.revokeObjectURL(url);
    });
  }
  reload(): void { this.admin.users().subscribe((items) => this.users = items); }

  create(): void {
    this.error = '';
    const value = this.form.getRawValue();
    this.admin.createUser({ ...value, departmentId: value.departmentId, roles: value.roles }).subscribe({
      next: () => { this.form.reset({ fullName: '', username: '', email: '', password: '', departmentId: null, roles: ['CITIZEN'] }); this.reload(); },
      error: (err) => this.error = err?.error?.message || 'Create failed'
    });
  }
}
