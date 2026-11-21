import { Component, computed, signal } from '@angular/core';
import { Nav } from '../../../../shared/nav/nav';
import { Session } from '../../../../core/models/session.models';
import { AuthService } from '../../../../core/services/auth.service';
import { ScheduleService } from '../../schedule.service';

type View = 'day' | 'week' | 'month';

interface CalendarDay {
  key: string; // YYYY-MM-DD
  weekDay: string; // Mon, Tue...
  num: number;
  isToday: boolean;
  sessions: Session[];
}

const HOUR_HEIGHT = 60; // pixels for one hour (1 minute = 1 pixel)

// Session cards get a color from their title, so the same subject keeps the same color.
const cardColors = [
  'border-blue-500/40 bg-blue-500/20 text-blue-300',
  'border-green-500/40 bg-green-500/20 text-green-300',
  'border-orange-500/40 bg-orange-500/20 text-orange-300',
  'border-purple-500/40 bg-purple-500/20 text-purple-300',
  'border-pink-500/40 bg-pink-500/20 text-pink-300',
  'border-teal-500/40 bg-teal-500/20 text-teal-300',
];

/** Formats a date as YYYY-MM-DD in local time (no timezone shift). */
function keyOf(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [Nav],
  templateUrl: './schedule.html',
})
export class Schedule {
  readonly views: View[] = ['day', 'week', 'month'];
  readonly weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  readonly hourHeight = HOUR_HEIGHT;

  readonly user;
  readonly view = signal<View>('week');
  readonly anchor = signal(addDays(new Date(), 0)); // any day inside the period being shown

  readonly sessions = signal<Session[]>([]);
  readonly upcoming = signal<Session[]>([]);
  readonly errorMessage = signal('');

  /** First and last day of the period being shown. */
  readonly range = computed(() => {
    const day = this.anchor();
    if (this.view() === 'day') {
      return { from: day, to: day };
    }
    if (this.view() === 'week') {
      const monday = addDays(day, -((day.getDay() + 6) % 7));
      return { from: monday, to: addDays(monday, 6) };
    }
    return {
      from: new Date(day.getFullYear(), day.getMonth(), 1),
      to: new Date(day.getFullYear(), day.getMonth() + 1, 0),
    };
  });

  readonly title = computed(() => {
    const { from, to } = this.range();
    if (this.view() === 'day') {
      return from.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    }
    if (this.view() === 'month') {
      return from.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    const month = from.toLocaleDateString('en-US', { month: 'long' });
    return `${month} ${from.getDate()} – ${to.getDate()}, ${to.getFullYear()}`;
  });

  /** One column per day (1 in day view, 7 in week view). */
  readonly columns = computed<CalendarDay[]>(() => {
    const { from } = this.range();
    const count = this.view() === 'day' ? 1 : 7;
    const todayKey = keyOf(new Date());

    return Array.from({ length: count }, (_, index) => {
      const date = addDays(from, index);
      const key = keyOf(date);
      return {
        key,
        weekDay: this.weekDays[(date.getDay() + 6) % 7],
        num: date.getDate(),
        isToday: key === todayKey,
        sessions: this.sessions().filter((session) => session.sessionDate.slice(0, 10) === key),
      };
    });
  });

  /** Month view: empty cells before the 1st (week starts on Monday), then every day. */
  readonly emptyCells = computed(() => Array.from({ length: (this.range().from.getDay() + 6) % 7 }));
  readonly monthDays = computed<CalendarDay[]>(() => {
    const { from, to } = this.range();
    const todayKey = keyOf(new Date());

    return Array.from({ length: to.getDate() }, (_, index) => {
      const date = addDays(from, index);
      const key = keyOf(date);
      return {
        key,
        weekDay: this.weekDays[(date.getDay() + 6) % 7],
        num: date.getDate(),
        isToday: key === todayKey,
        sessions: this.sessions().filter((session) => session.sessionDate.slice(0, 10) === key),
      };
    });
  });

  /** The time grid starts at 08:00 and grows if a session is earlier or later. */
  readonly startHour = computed(() => {
    const starts = this.sessions().map((session) => Math.floor(session.startMin / 60));
    return Math.min(8, ...starts);
  });
  readonly endHour = computed(() => {
    const ends = this.sessions().map((session) => Math.ceil(session.endMin / 60));
    return Math.max(18, ...ends);
  });
  readonly hours = computed(() =>
    Array.from({ length: this.endHour() - this.startHour() }, (_, index) => this.startHour() + index),
  );

  readonly groupLabel = computed(
    () => this.upcoming()[0]?.groups.join(', ') || this.sessions()[0]?.groups.join(', ') || '',
  );

  constructor(private readonly schedule: ScheduleService, private readonly auth: AuthService) {
    this.user = auth.user;
    this.loadPeriod();
    this.loadUpcoming();
  }

  setView(view: View): void {
    this.view.set(view);
    this.loadPeriod();
  }

  today(): void {
    this.anchor.set(new Date());
    this.loadPeriod();
  }

  previous(): void { this.move(-1); }
  next(): void { this.move(1); }

  /** Clicking a day in the month view opens that day. */
  openDay(key: string): void {
    const [year, month, day] = key.split('-').map(Number);
    this.anchor.set(new Date(year, month - 1, day));
    this.setView('day');
  }

  logout(): void { this.auth.logout(); }

  /** Distance from the top of the grid, in pixels. */
  top(session: Session): number {
    return session.startMin - this.startHour() * 60;
  }

  height(session: Session): number {
    return Math.max(session.endMin - session.startMin, 30);
  }

  colorOf(session: Session): string {
    let hash = 0;
    for (const letter of session.title) {
      hash = (hash * 31 + letter.charCodeAt(0)) % 1000;
    }
    return cardColors[hash % cardColors.length];
  }

  /** 540 -> "09:00" */
  formatTime(minutes: number): string {
    const hours = String(Math.floor(minutes / 60)).padStart(2, '0');
    const mins = String(minutes % 60).padStart(2, '0');
    return `${hours}:${mins}`;
  }

  private move(direction: number): void {
    const day = this.anchor();
    if (this.view() === 'day') {
      this.anchor.set(addDays(day, direction));
    } else if (this.view() === 'week') {
      this.anchor.set(addDays(day, 7 * direction));
    } else {
      this.anchor.set(new Date(day.getFullYear(), day.getMonth() + direction, 1));
    }
    this.loadPeriod();
  }

  private loadPeriod(): void {
    const { from, to } = this.range();

    this.schedule.calendar(keyOf(from), keyOf(to)).subscribe({
      next: (sessions) => {
        this.sessions.set(sessions);
        this.errorMessage.set('');
      },
      error: (error) => {
        this.sessions.set([]);
        this.errorMessage.set(error?.error?.error?.message ?? 'Unable to load your calendar.');
      },
    });
  }

  private loadUpcoming(): void {
    this.schedule.upcoming(5).subscribe({
      next: (sessions) => this.upcoming.set(sessions),
      error: () => this.upcoming.set([]),
    });
  }
}
