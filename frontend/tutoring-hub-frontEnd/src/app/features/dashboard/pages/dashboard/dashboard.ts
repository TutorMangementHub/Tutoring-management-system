import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({ selector: 'app-dashboard', standalone: true, imports: [RouterLink], templateUrl: './dashboard.html' })
export class Dashboard {
  readonly user;
  constructor(private readonly auth: AuthService) { this.user = auth.user; }
  logout(): void { this.auth.logout(); }
}
