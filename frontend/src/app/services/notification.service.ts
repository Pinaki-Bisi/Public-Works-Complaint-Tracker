import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NotificationItem } from '../models';
import { interval } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  items = signal<NotificationItem[]>([]);
  constructor(private http: HttpClient) {
    interval(30_000).subscribe(() => this.load());
  }
  load(): void { this.http.get<NotificationItem[]>('/api/notifications').subscribe((items) => this.items.set(items)); }
  markRead(id: number): void {
    this.http.patch<NotificationItem>(`/api/notifications/${id}/read`, {}).subscribe((changed) =>
      this.items.update((items) => items.map((item) => item.id === id ? changed : item)));
  }
}
