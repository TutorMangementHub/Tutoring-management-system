import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuthResponse,
  AuthUser,
  Grade,
  Group,
  LoginPayload,
  RegisterPayload,
} from '../models/auth.models';

const tokenKey = 'tutoring_hub_token';
const userKey = 'tutoring_hub_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly user = signal<AuthUser | null>(this.readUser());

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
  ) {}

  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/api/auth/login`, payload)
      .pipe(tap((response) => this.saveSession(response)));
  }

  register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/api/auth/register`, payload)
      .pipe(tap((response) => this.saveSession(response)));
  }

  grades(): Observable<Grade[]> { return this.http.get<Grade[]>(`${environment.apiUrl}/api/grades`); }
  groups(): Observable<Group[]> { return this.http.get<Group[]>(`${environment.apiUrl}/api/groups`); }

  logout(): void {
    localStorage.removeItem(tokenKey);
    localStorage.removeItem(userKey);
    this.user.set(null);
    void this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(tokenKey);
  }

  private saveSession(response: AuthResponse): void {
    localStorage.setItem(tokenKey, response.token);
    localStorage.setItem(userKey, JSON.stringify(response.user));
    this.user.set(response.user);
  }

  private readUser(): AuthUser | null {
    const stored = localStorage.getItem(userKey);
    if (!stored) return null;

    try {
      return JSON.parse(stored) as AuthUser;
    } catch {
      localStorage.removeItem(userKey);
      return null;
    }
  }
}
