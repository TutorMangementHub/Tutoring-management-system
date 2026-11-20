import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Session } from '../../core/models/session.models';

@Injectable({ providedIn: 'root' })
export class ScheduleService {
  constructor(private readonly http: HttpClient) {}

  /** Sessions of my group between two days (YYYY-MM-DD). */
  calendar(from: string, to: string): Observable<Session[]> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get<Session[]>(`${environment.apiUrl}/api/sessions/mine`, { params });
  }

  /** My group's next sessions. */
  upcoming(limit = 5): Observable<Session[]> {
    const params = new HttpParams().set('limit', limit);
    return this.http.get<Session[]>(`${environment.apiUrl}/api/sessions/mine/upcoming`, { params });
  }
}
