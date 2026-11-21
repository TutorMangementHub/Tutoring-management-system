import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './nav.html',
})
export class Nav {
  readonly user;

  constructor(private readonly auth: AuthService) {
    this.user = auth.user;
  }

  logout(): void {
    this.auth.logout();
  }
}
