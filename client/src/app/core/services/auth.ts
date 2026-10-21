import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AnalyticsService } from './analytics';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

interface AuthResponse {
  token: string;
  user: User;
}

const TOKEN_KEY = 'wallcanva_token';
const USER_KEY = 'wallcanva_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
    private analytics = inject(AnalyticsService);
  private sessionId: string | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;

  startTracking() {
    if (!this.getToken() || this.pingTimer) return;
    this.analytics.startSession().subscribe({
      next: (r) => {
        this.sessionId = r.sessionId;
        this.pingTimer = setInterval(() => {
          if (this.sessionId) this.analytics.ping(this.sessionId).subscribe({ error: () => {} });
        }, 60000);
      },
      error: () => {},
    });
  }

  private stopTracking() {
    if (this.pingTimer) clearInterval(this.pingTimer);
    this.pingTimer = null;
    this.sessionId = null;
  }

  private _user = signal<User | null>(this.loadUser());

  user = this._user.asReadonly();
  isLoggedIn = computed(() => !!this._user());
  isAdmin = computed(() => this._user()?.role === 'admin');

  constructor() {
    if (this._user()) this.startTracking();
  }

  register(name: string, email: string, password: string) {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/register`, { name, email, password })
      .pipe(tap((res) => this.saveSession(res)));
  }

  login(email: string, password: string) {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(tap((res) => this.saveSession(res)));
  }

  logout() {
    this.stopTracking();
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private saveSession(res: AuthResponse) {
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    this._user.set(res.user);
    this.startTracking();
  }

  private loadUser(): User | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
