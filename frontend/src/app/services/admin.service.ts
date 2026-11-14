import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Department, User } from '../models';

@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private http: HttpClient) {}

  users() {
    return this.http.get<User[]>('/api/admin/users');
  }

  departments() {
    return this.http.get<Department[]>('/api/admin/departments');
  }

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
}
