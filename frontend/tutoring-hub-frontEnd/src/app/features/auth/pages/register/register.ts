import { Component, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { Grade, Group } from '../../../../core/models/auth.models';

@Component({ selector: 'app-register', standalone: true, imports: [ReactiveFormsModule, RouterLink], templateUrl: './register.html' })
export class Register implements OnInit {
  readonly showPassword = signal(false);
  readonly submitting = signal(false);
  readonly errorMessage = signal('');
  readonly grades = signal<Grade[]>([]);
  readonly groups = signal<Group[]>([]);
  readonly form = new FormGroup({
    fullName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(8)] }),
    confirmPassword: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    gradeId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    groupId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  constructor(private readonly auth: AuthService, private readonly router: Router) {}

  groupMatchesGrade(group: Group): boolean {
    const gradeId = typeof group.gradeId === 'string' ? group.gradeId : group.gradeId._id;
    return gradeId === this.form.controls.gradeId.value;
  }

  ngOnInit(): void {
    this.auth.grades().subscribe({ next: (grades) => this.grades.set(grades), error: () => this.errorMessage.set('Unable to load grades.') });
    this.auth.groups().subscribe({ next: (groups) => this.groups.set(groups), error: () => this.errorMessage.set('Unable to load groups.') });
    this.form.controls.gradeId.valueChanges.subscribe(() => this.form.controls.groupId.setValue(''));
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    if (this.form.controls.password.value !== this.form.controls.confirmPassword.value) {
      this.errorMessage.set('Passwords do not match.');
      return;
    }
    this.submitting.set(true);
    this.errorMessage.set('');
    const { confirmPassword: _confirmPassword, ...payload } = this.form.getRawValue();
    this.auth.register(payload).subscribe({
      next: () => void this.router.navigate(['/dashboard']),
      error: (error) => { this.errorMessage.set(error?.error?.error?.message ?? 'Unable to create your account. Please try again.'); this.submitting.set(false); },
    });
  }
}
