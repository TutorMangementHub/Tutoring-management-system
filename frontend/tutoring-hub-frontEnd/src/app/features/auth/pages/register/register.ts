import { Component, OnInit, signal } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { Grade, Group } from '../../../../core/models/auth.models';

type FieldName = 'fullName' | 'email' | 'gradeId' | 'groupId' | 'password' | 'confirmPassword';

function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;
  return password && confirmPassword && password !== confirmPassword ? { passwordMismatch: true } : null;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
})
export class Register implements OnInit {
  readonly showPassword = signal(false);
  readonly submitting = signal(false);
  readonly submitAttempted = signal(false);
  readonly errorMessage = signal('');
  readonly grades = signal<Grade[]>([]);
  readonly groups = signal<Group[]>([]);

  private readonly fieldLabels: Record<FieldName, string> = {
    fullName: 'Full name',
    email: 'Email',
    gradeId: 'Grade',
    groupId: 'Group',
    password: 'Password',
    confirmPassword: 'Confirm password',
  };

  readonly form = new FormGroup(
    {
      fullName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
      password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(8)] }),
      confirmPassword: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      gradeId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      groupId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    },
    [passwordMatchValidator],
  );

  constructor(private readonly auth: AuthService, private readonly router: Router) {}

  groupMatchesGrade(group: Group): boolean {
    const gradeId = typeof group.gradeId === 'string' ? group.gradeId : group.gradeId._id;
    return gradeId === this.form.controls.gradeId.value;
  }

  fieldError(name: FieldName): string {
    const control = this.form.controls[name];
    if (!control.touched && !this.submitAttempted()) return '';

    if (name === 'confirmPassword' && this.form.hasError('passwordMismatch')) {
      return 'Passwords do not match.';
    }
    if (control.hasError('required')) return `${this.fieldLabels[name]} is required.`;
    if (control.hasError('email')) return 'Enter a valid email address.';
    if (control.hasError('minlength')) return 'Use at least 8 characters.';
    return '';
  }

  ngOnInit(): void {
    this.auth.grades().subscribe({
      next: (grades) => this.grades.set(grades),
      error: () => this.errorMessage.set('Unable to load grades.'),
    });
    this.auth.groups().subscribe({
      next: (groups) => this.groups.set(groups),
      error: () => this.errorMessage.set('Unable to load groups.'),
    });
    this.form.controls.gradeId.valueChanges.subscribe(() => this.form.controls.groupId.setValue(''));
    this.form.valueChanges.subscribe(() => this.errorMessage.set(''));
  }

  submit(): void {
    this.submitAttempted.set(true);
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      this.errorMessage.set('Please complete the highlighted fields.');
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set('');
    const { confirmPassword: _confirmPassword, ...payload } = this.form.getRawValue();
    this.auth.register(payload).subscribe({
      next: () => void this.router.navigate(['/']),
      error: (error) => {
        this.errorMessage.set(error?.error?.error?.message ?? error?.error?.message ?? 'Unable to create your account. Please try again.');
        this.submitting.set(false);
      },
    });
  }
}
