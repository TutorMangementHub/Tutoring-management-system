import { Component } from '@angular/core';
import { AuthService } from '../../../../core/services/auth.service';

@Component({ selector: 'app-dashboard', standalone: true, templateUrl: './dashboard.html' })
export class Dashboard {
  readonly user;
  constructor(private readonly auth: AuthService) { this.user = auth.user; }
  logout(): void { this.auth.logout(); }
}
