import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isSubmitting = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const { email, password } = this.loginForm.value;

    // TODO: Replace with actual API endpoint
    // Example: this.http.post('/api/auth/login', { email, password })
    //   .subscribe({
    //     next: (response) => {
    //       // Handle successful login
    //       this.router.navigate(['/dashboard']);
    //     },
    //     error: (error) => {
    //       this.errorMessage = error.error?.message || 'Login failed. Please try again.';
    //       this.isSubmitting = false;
    //     }
    //   });

    // Simulated login for demonstration
    setTimeout(() => {
      console.log('Login attempt:', { email, password });
      // In production, replace this with actual API call
      this.isSubmitting = false;
      // Uncomment below for actual navigation
      // this.router.navigate(['/dashboard/clinician']);
    }, 1000);
  }

  onForgotPassword(event: Event): void {
    event.preventDefault();
    // TODO: Implement forgot password functionality
    console.log('Forgot password clicked');
    // Example: this.router.navigate(['/auth/forgot-password']);
  }

  onSignUp(event: Event): void {
    event.preventDefault();
    // TODO: Implement sign up navigation
    console.log('Sign up clicked');
    // Example: this.router.navigate(['/auth/register']);
  }
}

