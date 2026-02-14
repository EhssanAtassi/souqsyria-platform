import { Routes } from '@angular/router';
import { guestGuard } from '../../shared/guards';
import { AuthLayoutComponent } from './layout/auth-layout.component';

/**
 * Authentication feature routing configuration
 *
 * @description Defines lazy-loaded routes for all authentication flows
 * wrapped inside the AuthLayoutComponent parent. The layout provides a
 * minimal header (logo + language toggle) and gradient background, while
 * the main commerce header is hidden on these routes via AppComponent.
 *
 * @swagger
 * components:
 *   schemas:
 *     AuthRoutes:
 *       type: object
 *       description: Authentication feature route definitions with auth layout wrapper
 */
export const authRoutes: Routes = [
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
      },
      {
        path: 'login',
        loadComponent: () =>
          import('./components/login/login.component').then(m => m.LoginComponent),
        canActivate: [guestGuard],
        title: 'Sign In - SouqSyria | تسجيل الدخول'
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./components/register/register.component').then(m => m.RegisterComponent),
        canActivate: [guestGuard],
        title: 'Create Account - SouqSyria | إنشاء حساب'
      },
      {
        path: 'verify-otp',
        loadComponent: () =>
          import('./components/otp-verification/otp-verification.component').then(m => m.OtpVerificationComponent),
        title: 'Verify Email - SouqSyria | تحقق من البريد'
      },
      {
        path: 'forgot-password',
        loadComponent: () =>
          import('./components/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
        canActivate: [guestGuard],
        title: 'Forgot Password - SouqSyria | نسيت كلمة المرور'
      },
      {
        path: 'reset-password',
        loadComponent: () =>
          import('./components/reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
        title: 'Reset Password - SouqSyria | إعادة تعيين كلمة المرور'
      },
      {
        path: 'callback/:provider',
        loadComponent: () =>
          import('./components/oauth-callback/oauth-callback.component').then(m => m.OAuthCallbackComponent),
        title: 'Logging In - SouqSyria | تسجيل الدخول'
      }
    ]
  }
];
