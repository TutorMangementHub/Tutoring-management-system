import { Component, computed, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Nav } from '../../../../shared/nav/nav';
import { AuthService } from '../../../../core/services/auth.service';
import { Session } from '../../../../core/models/session.models';
import { ScheduleService } from '../../../schedule/schedule.service';

interface CalendarDay {
  date: Date;
  iso: string;
  day: number;
  outsideMonth: boolean;
  hasSession: boolean;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, Nav],
  templateUrl: './home.html',
})
export class Home implements OnInit {
  readonly nextSession = signal<Session | null>(null);
  readonly month = signal(this.startOfMonth(new Date()));
  readonly sessions = signal<Session[]>([]);

  readonly monthLabel = computed(() => {
    const date = this.month();
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  });

  readonly days = computed<CalendarDay[]>(() => {
    const month = this.month();
    const year = month.getUTCFullYear();
    const monthIndex = month.getUTCMonth();

    const first = new Date(Date.UTC(year, monthIndex, 1));
    const offset = (first.getUTCDay() + 6) % 7; // Monday first
    const start = new Date(Date.UTC(year, monthIndex, 1 - offset));

    const planned = new Set(this.sessions().map((session) => session.sessionDate.slice(0, 10)));

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate() + index));
      const iso = date.toISOString().slice(0, 10);
      return {
        date,
        iso,
        day: date.getUTCDate(),
        outsideMonth: date.getUTCMonth() !== monthIndex,
        hasSession: planned.has(iso),
      };
    });
  });

  constructor(
    private readonly schedule: ScheduleService,
    private readonly auth: AuthService,
  ) {}

  ngOnInit(): void {
    this.schedule.upcoming(1).subscribe({
      next: (sessions) => this.nextSession.set(sessions[0] ?? null),
      error: () => this.nextSession.set(null),
    });
    this.loadMonth(this.month());
  }

  /** Human-readable time for a real session, e.g. "Tomorrow, 17:00 - 18:00". */
  relativeLabel(session: Session): string {
    const start = this.formatTime(session.startMin);
    const end = this.formatTime(session.endMin);
    const date = new Date(session.sessionDate);
    const today = this.startOfDay(new Date());
    const target = this.startOfDay(date);
    const diff = Math.round((target.getTime() - today.getTime()) / 86_400_000);
    const label = diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : this.weekday(date);
    return `${label}, ${start} - ${end}`;
  }

  fullDate(session: Session): string {
    return new Date(session.sessionDate).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    });
  }

  dayClass(day: CalendarDay): string {
    const base = 'flex h-12 items-center justify-center rounded-lg text-sm';
    if (day.hasSession) return `${base} bg-[#1677ff] font-semibold text-white`;
    return `${base} ${day.outsideMonth ? 'bg-transparent text-slate-600' : 'bg-[#242427] text-slate-200'}`;
  }

  changeMonth(offset: number): void {
    const current = this.month();
    this.loadMonth(new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + offset, 1)));
  }

  logout(): void {
    this.auth.logout();
  }

  private loadMonth(month: Date): void {
    this.month.set(month);
    const grid = this.days();
    const from = grid[0].iso;
    const to = grid[grid.length - 1].iso;
    this.schedule.calendar(from, to).subscribe({
      next: (sessions) => this.sessions.set(sessions),
      error: () => this.sessions.set([]),
    });
  }

  private formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60).toString().padStart(2, '0');
    const mins = (minutes % 60).toString().padStart(2, '0');
    return `${hours}:${mins}`;
  }

  private weekday(date: Date): string {
    return date.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
  }

  private startOfMonth(date: Date): Date {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  }

  private startOfDay(date: Date): Date {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  }
}
