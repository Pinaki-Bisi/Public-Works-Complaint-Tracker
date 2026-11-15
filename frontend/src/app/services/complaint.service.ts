import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Attachment, Category, CommentItem, Complaint, User } from '../models';

export interface ComplaintPage {
  content: Complaint[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

@Injectable({ providedIn: 'root' })
export class ComplaintService {
  constructor(private http: HttpClient) {}

  categories() {
    return this.http.get<Category[]>('/api/categories');
  }

  list(filters?: { status?: string; categoryId?: number; departmentId?: number; priority?: string; q?: string;
    page?: number; size?: number; sort?: string; fromDate?: string; toDate?: string }) {
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
    for (const key of ['priority', 'q', 'fromDate', 'toDate', 'sort'] as const) {
      const value = filters?.[key];
      if (value) params = params.set(key, value);
    }
    params = params.set('page', filters?.page ?? 0).set('size', filters?.size ?? 20);
    return this.http.get<ComplaintPage>('/api/complaints', { params });
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

  attachments(id: number) { return this.http.get<Attachment[]>(`/api/complaints/${id}/attachments`); }
  uploadAttachment(id: number, file: File) {
    const body = new FormData(); body.append('file', file);
    return this.http.post<Attachment>(`/api/complaints/${id}/attachments`, body);
  }
  attachmentContent(id: number, attachmentId: number) {
    return this.http.get(`/api/complaints/${id}/attachments/${attachmentId}/content`, { responseType: 'blob' });
  }
}
