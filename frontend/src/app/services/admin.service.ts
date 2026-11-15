import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Analytics, Department, OverdueComplaint, User } from '../models';

@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private http: HttpClient) {}

  users() {
    return this.http.get<User[]>('/api/admin/users');
  }

  departments() {
    return this.http.get<Department[]>('/api/admin/departments');
  }
  createDepartment(name: string, code: string) { return this.http.post<Department>('/api/admin/departments', { name, code }); }
  deleteDepartment(id: number) { return this.http.delete(`/api/admin/departments/${id}`); }

  createUser(body: {
    username: string;
    email: string;
    password: string;
    fullName: string;
    departmentId: number | null;
    roles: string[];
  }) {
    return this.http.post<User>('/api/admin/users', body);
  }

  updateRoles(id: number, roles: string[]) {
    return this.http.patch<User>(`/api/admin/users/${id}/roles`, { roles });
  }

  analytics() { return this.http.get<Analytics>('/api/admin/analytics'); }
  overdue() { return this.http.get<OverdueComplaint[]>('/api/admin/reports/overdue'); }
  setEnabled(id: number, enabled: boolean) { return this.http.patch<User>(`/api/admin/users/${id}/enabled`, { enabled }); }
  createCategory(name: string, departmentId: number) { return this.http.post('/api/admin/categories', { name, departmentId }); }
  deleteCategory(id: number) { return this.http.delete(`/api/admin/categories/${id}`); }
  exportComplaints(format: 'xlsx' | 'pdf') {
    return this.http.get(`/api/admin/reports/complaints?format=${format}`, { responseType: 'blob' });
  }
}
