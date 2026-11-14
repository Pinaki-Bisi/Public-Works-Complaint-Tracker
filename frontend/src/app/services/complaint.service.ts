import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Category, CommentItem, Complaint, User } from '../models';

@Injectable({ providedIn: 'root' })
export class ComplaintService {
  constructor(private http: HttpClient) {}

  categories() {
    return this.http.get<Category[]>('/api/categories');
  }

  list(filters?: { status?: string; categoryId?: number; departmentId?: number }) {
    let params = new HttpParams();
    if (filters?.status) {
      params = params.set('status', filters.status);
    }
    if (filters?.categoryId) {
      params = params.set('categoryId', filters.categoryId);
    }
    if (filters?.departmentId) {
      params = params.set('departmentId', filters.departmentId);
    }
    return this.http.get<Complaint[]>('/api/complaints', { params });
  }

  get(id: number) {
    return this.http.get<Complaint>(`/api/complaints/${id}`);
  }

  create(body: { title: string; description: string; location: string; categoryId: number; priority: string }) {
    return this.http.post<Complaint>('/api/complaints', body);
  }

  updateStatus(id: number, status: string, comment?: string) {
    return this.http.patch<Complaint>(`/api/complaints/${id}/status`, { status, comment });
  }

  assign(id: number, assigneeId: number, scheduledAt?: string, comment?: string) {
    return this.http.post<Complaint>(`/api/complaints/${id}/assign`, { assigneeId, scheduledAt, comment });
  }

  comment(id: number, body: string) {
    return this.http.post<CommentItem>(`/api/complaints/${id}/comments`, { body });
  }

  crew() {
    return this.http.get<User[]>('/api/crew');
  }
}
