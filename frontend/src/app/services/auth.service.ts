import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { AuthResponse, User } from '../models';

const TOKEN_KEY = 'pwct.token';
const USER_KEY = 'pwct.user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  currentUser = signal<User | null>(this.readUser());

  constructor(private http: HttpClient, private router: Router) {}

  login(username: string, password: string) {
    return this.http.post<AuthResponse>('/api/auth/login', { username, password }).pipe(
      tap((res) => this.store(res))
    );
  }

  register(payload: { username: string; email: string; password: string; fullName: string }) {
    return this.http.post<AuthResponse>('/api/auth/register', payload).pipe(
      tap((res) => this.store(res))
    );
  }

  logout(): void {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  token(): string | null {
    return sessionStorage.getItem(TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.token();
  }

  hasAnyRole(roles: string[]): boolean {
    const user = this.currentUser();
    return !!user && user.roles.some((role) => roles.includes(role));
  }

  homeRoute(): string {
    const user = this.currentUser();
    if (!user) {
      return '/login';
    }
    if (user.roles.includes('ADMIN')) {
      return '/admin';
    }
    if (user.roles.includes('SUPERVISOR')) {
      return '/staff';
    }
    if (user.roles.includes('CREW')) {
      return '/crew';
    }
    return '/';
  }

  private store(res: AuthResponse): void {
    sessionStorage.setItem(TOKEN_KEY, res.accessToken);
    sessionStorage.setItem(USER_KEY, JSON.stringify(res.user));
    this.currentUser.set(res.user);
  }

  private readUser(): User | null {
    const raw = sessionStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  }
}
