import { Component, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
})
export class Login {
  readonly showPassword = signal(false);
  readonly submitting = signal(false);
  readonly errorMessage = signal('');

  readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  constructor(private readonly auth: AuthService, private readonly router: Router) {}

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set('');
    this.auth.login(this.form.getRawValue()).subscribe({
      next: (response) => {
        if (response.user.role !== 'STUDENT') {
          this.auth.logout();
          this.errorMessage.set('This app is for student accounts only.');
          this.submitting.set(false);
          return;
        }
        void this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.errorMessage.set(error?.error?.error?.message ?? 'Unable to log in. Please try again.');
        this.submitting.set(false);
      },
    });
  }
}
