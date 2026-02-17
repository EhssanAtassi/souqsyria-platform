import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

/**
 * EmailService - Handles sending emails using Nodemailer with SMTP
 * Supports:
 * - Email verification (OTP)
 * - Password reset
 * - Bilingual templates (Arabic RTL + English)
 * - HTML formatted emails with SouqSyria branding
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;

  /**
   * Initialize Nodemailer transporter with SMTP configuration
   * Uses environment variables for SMTP server details
   */
  constructor(private readonly configService: ConfigService) {
    // Configure SMTP transporter
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpPort = this.configService.get<number>('SMTP_PORT');
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASS');

    // Check if SMTP is configured
    if (!smtpHost || !smtpUser || !smtpPass) {
      this.logger.warn(
        '⚠️ SMTP not configured. Emails will be logged to console instead of being sent.',
      );
      this.transporter = null;
    } else {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort || 587,
        secure: this.configService.get<boolean>('SMTP_SECURE', false), // true for 465, false for other ports
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      this.logger.log(`📧 Email service initialized with SMTP: ${smtpHost}`);
    }
  }

  /**
   * Send password reset email with reset token
   */
  async sendPasswordResetEmail(
    email: string,
    resetToken: string,
  ): Promise<void> {
    this.logger.log(`📧 Sending password reset email to: ${email}`);

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:4200';
    const resetUrl = `${frontendUrl}/auth/reset-password?token=${resetToken}`;

    // If no transporter configured, log to console (development mode)
    if (!this.transporter) {
      console.log('=== PASSWORD RESET EMAIL (DEV MODE) ===');
      console.log(`To: ${email}`);
      console.log(`Subject: SouqSyria - Password Reset Request`);
      console.log(`Reset URL: ${resetUrl}`);
      console.log(`Token: ${resetToken}`);
      console.log(`Expires: 1 hour`);
      console.log('========================================');
      return;
    }

    try {
      const mailOptions = {
        from: `"SouqSyria - سوق سوريا" <${this.configService.get('SMTP_FROM') || this.configService.get('SMTP_USER')}>`,
        to: email,
        subject: 'SouqSyria - Password Reset / إعادة تعيين كلمة المرور',
        html: this.getPasswordResetTemplate(resetUrl),
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`✅ Password reset email sent successfully to: ${email}`);
    } catch (error: unknown) {
      this.logger.error(
        `❌ Failed to send password reset email to: ${email}`,
        (error as Error).message,
      );
      throw error;
    }
  }

  /**
   * Send profile updated confirmation email
   * Notifies the user that their profile was successfully updated
   *
   * @param email - User email address
   * @param firstName - User's first name for personalization
   */
  async sendProfileUpdatedEmail(
    email: string,
    firstName: string,
  ): Promise<void> {
    this.logger.log(`📧 Sending profile updated confirmation to: ${email}`);

    const updateDate = new Date().toLocaleString('en-US', {
      dateStyle: 'long',
      timeStyle: 'short',
    });

    // If no transporter configured, log to console (development mode)
    if (!this.transporter) {
      console.log('=== PROFILE UPDATED CONFIRMATION (DEV MODE) ===');
      console.log(`To: ${email}`);
      console.log(`Subject: SouqSyria - Profile Updated`);
      console.log(`Updated at: ${updateDate}`);
      console.log(`User: ${firstName}`);
      console.log('================================================');
      return;
    }

    try {
      const mailOptions = {
        from: `"SouqSyria - سوق سوريا" <${this.configService.get('SMTP_FROM') || this.configService.get('SMTP_USER')}>`,
        to: email,
        subject: 'SouqSyria - Profile Updated / تم تحديث الملف الشخصي',
        html: this.getProfileUpdatedTemplate(firstName, updateDate),
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(
        `✅ Profile updated confirmation sent successfully to: ${email}`,
      );
    } catch (error: unknown) {
      this.logger.error(
        `❌ Failed to send profile updated email to: ${email}`,
        (error as Error).message,
      );
      throw error;
    }
  }

  /**
   * Send password changed confirmation email
   * Notifies the user that their password was successfully changed
   *
   * @param email - User email address
   */
  async sendPasswordChangedEmail(email: string): Promise<void> {
    this.logger.log(`📧 Sending password changed confirmation to: ${email}`);

    const changeDate = new Date().toLocaleString('en-US', {
      dateStyle: 'long',
      timeStyle: 'short',
    });

    // If no transporter configured, log to console (development mode)
    if (!this.transporter) {
      console.log('=== PASSWORD CHANGED CONFIRMATION (DEV MODE) ===');
      console.log(`To: ${email}`);
      console.log(`Subject: SouqSyria - Password Changed`);
      console.log(`Changed at: ${changeDate}`);
      console.log('================================================');
      return;
    }

    try {
      const mailOptions = {
        from: `"SouqSyria - سوق سوريا" <${this.configService.get('SMTP_FROM') || this.configService.get('SMTP_USER')}>`,
        to: email,
        subject: 'SouqSyria - Password Changed / تم تغيير كلمة المرور',
        html: this.getPasswordChangedTemplate(changeDate),
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(
        `✅ Password changed confirmation sent successfully to: ${email}`,
      );
    } catch (error: unknown) {
      this.logger.error(
        `❌ Failed to send password changed email to: ${email}`,
        (error as Error).message,
      );
      throw error;
    }
  }

  /**
   * Send email verification with OTP code
   */
  async sendVerificationEmail(email: string, otpCode: string): Promise<void> {
    this.logger.log(`📧 Sending verification email to: ${email}`);

    // If no transporter configured, log to console (development mode)
    if (!this.transporter) {
      console.log('=== VERIFICATION EMAIL (DEV MODE) ===');
      console.log(`To: ${email}`);
      console.log(`Subject: SouqSyria - Verify Your Email`);
      console.log(`OTP Code: ${otpCode}`);
      console.log(`Expires: 10 minutes`);
      console.log('=====================================');
      return;
    }

    try {
      const mailOptions = {
        from: `"SouqSyria - سوق سوريا" <${this.configService.get('SMTP_FROM') || this.configService.get('SMTP_USER')}>`,
        to: email,
        subject: 'SouqSyria - Verify Your Email / تأكيد بريدك الإلكتروني',
        html: this.getVerificationEmailTemplate(otpCode),
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`✅ Verification email sent successfully to: ${email}`);
    } catch (error: unknown) {
      this.logger.error(
        `❌ Failed to send verification email to: ${email}`,
        (error as Error).message,
      );
      throw error;
    }
  }

  /**
   * Send account lockout notification email
   *
   * @description Alerts the user that their account has been locked due to
   * repeated failed login attempts. Includes the IP address that triggered
   * the lockout, the lockout duration, and a link to reset their password.
   * Uses bilingual HTML template (Arabic RTL + English).
   *
   * @param email - User email address
   * @param lockoutMinutes - Duration of the lockout in minutes
   * @param ipAddress - IP address that triggered the lockout
   */
  async sendAccountLockoutEmail(
    email: string,
    lockoutMinutes: number,
    ipAddress: string,
  ): Promise<void> {
    this.logger.log(`Sending account lockout email to: ${email}`);

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:4200';
    const resetUrl = `${frontendUrl}/auth/forgot-password`;

    // If no transporter configured, log to console (development mode)
    if (!this.transporter) {
      console.log('=== ACCOUNT LOCKOUT EMAIL (DEV MODE) ===');
      console.log(`To: ${email}`);
      console.log(`Subject: SouqSyria - Account Locked`);
      console.log(`IP Address: ${ipAddress}`);
      console.log(`Lockout Duration: ${lockoutMinutes} minutes`);
      console.log(`Reset URL: ${resetUrl}`);
      console.log('=========================================');
      return;
    }

    try {
      const mailOptions = {
        from: `"SouqSyria - سوق سوريا" <${this.configService.get('SMTP_FROM') || this.configService.get('SMTP_USER')}>`,
        to: email,
        subject: 'SouqSyria - Account Locked / تم قفل الحساب',
        html: this.getAccountLockoutTemplate(
          lockoutMinutes,
          ipAddress,
          resetUrl,
        ),
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Account lockout email sent successfully to: ${email}`);
    } catch (error: unknown) {
      this.logger.error(
        `Failed to send account lockout email to: ${email}`,
        (error as Error).message,
      );
      // Do not throw — lockout email is non-critical (fire-and-forget)
    }
  }

  /**
   * 🎨 EMAIL TEMPLATES
   * Beautiful bilingual HTML templates for emails
   */

  /**
   * Verification email template (OTP code)
   * Supports Arabic RTL + English
   */
  private getVerificationEmailTemplate(otpCode: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #988561 0%, #7a6b4f 100%); color: #ffffff; padding: 30px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { padding: 30px 20px; }
    .otp-code { background: #f8f6f3; border: 2px solid #988561; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
    .otp-code h2 { color: #988561; font-size: 36px; letter-spacing: 8px; margin: 10px 0; font-weight: bold; }
    .arabic { direction: rtl; font-family: 'Arial', 'Segoe UI', 'Tahoma', sans-serif; }
    .footer { background: #f8f6f3; color: #666; padding: 20px; text-align: center; font-size: 12px; border-top: 1px solid #e0e0e0; }
    .button { display: inline-block; background: #988561; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
    .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>سوق سوريا - SouqSyria</h1>
    </div>

    <!-- Arabic Section -->
    <div class="content arabic">
      <h2 style="color: #988561;">مرحباً بك في سوق سوريا! 🎉</h2>
      <p>شكراً لتسجيلك معنا. لإتمام عملية التسجيل، يرجى استخدام رمز التحقق التالي:</p>

      <div class="otp-code">
        <p style="margin: 0; color: #666; font-size: 14px;">رمز التحقق الخاص بك</p>
        <h2>${otpCode}</h2>
        <p style="margin: 0; color: #666; font-size: 12px;">صالح لمدة 10 دقائق</p>
      </div>

      <div class="warning">
        <strong>⚠️ تنبيه أمني:</strong>
        <p style="margin: 5px 0 0 0;">لا تشارك هذا الرمز مع أي شخص. فريق سوق سوريا لن يطلب منك هذا الرمز أبداً.</p>
      </div>

      <p style="margin-top: 20px;">إذا لم تقم بإنشاء حساب، يرجى تجاهل هذه الرسالة.</p>
    </div>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

    <!-- English Section -->
    <div class="content">
      <h2 style="color: #988561;">Welcome to SouqSyria! 🎉</h2>
      <p>Thank you for registering with us. To complete your registration, please use the following verification code:</p>

      <div class="otp-code">
        <p style="margin: 0; color: #666; font-size: 14px;">Your Verification Code</p>
        <h2>${otpCode}</h2>
        <p style="margin: 0; color: #666; font-size: 12px;">Valid for 10 minutes</p>
      </div>

      <div class="warning">
        <strong>⚠️ Security Warning:</strong>
        <p style="margin: 5px 0 0 0;">Never share this code with anyone. SouqSyria team will never ask for this code.</p>
      </div>

      <p style="margin-top: 20px;">If you didn't create an account, please ignore this email.</p>
    </div>

    <div class="footer">
      <p>© 2026 SouqSyria - سوق سوريا. All rights reserved.</p>
      <p>This is an automated email. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Account lockout email template
   * Bilingual (Arabic RTL + English) alert when account is locked
   */
  private getAccountLockoutTemplate(
    lockoutMinutes: number,
    ipAddress: string,
    resetUrl: string,
  ): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #c62828 0%, #b71c1c 100%); color: #ffffff; padding: 30px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { padding: 30px 20px; }
    .arabic { direction: rtl; font-family: 'Arial', 'Segoe UI', 'Tahoma', sans-serif; }
    .footer { background: #f8f6f3; color: #666; padding: 20px; text-align: center; font-size: 12px; border-top: 1px solid #e0e0e0; }
    .button { display: inline-block; background: #988561; color: #ffffff !important; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 0; font-weight: bold; }
    .alert-box { background: #ffebee; border-left: 4px solid #c62828; padding: 15px; margin: 15px 0; border-radius: 4px; }
    .info-box { background: #f5f5f5; padding: 12px; margin: 10px 0; border-radius: 4px; font-family: monospace; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>سوق سوريا - SouqSyria</h1>
    </div>

    <!-- Arabic Section -->
    <div class="content arabic">
      <h2 style="color: #c62828;">تنبيه أمني: تم قفل الحساب 🔒</h2>
      <div class="alert-box">
        <strong>تم قفل حسابك مؤقتاً</strong> بسبب محاولات تسجيل دخول فاشلة متعددة.
      </div>
      <p><strong>عنوان IP المسبب:</strong></p>
      <div class="info-box">${ipAddress}</div>
      <p><strong>مدة القفل:</strong> ${lockoutMinutes} دقيقة</p>
      <p>إذا لم تكن أنت من حاول تسجيل الدخول، نوصي بإعادة تعيين كلمة المرور فوراً:</p>
      <div style="text-align: center; margin: 25px 0;">
        <a href="${resetUrl}" class="button">إعادة تعيين كلمة المرور</a>
      </div>
    </div>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

    <!-- English Section -->
    <div class="content">
      <h2 style="color: #c62828;">Security Alert: Account Locked 🔒</h2>
      <div class="alert-box">
        <strong>Your account has been temporarily locked</strong> due to multiple failed login attempts.
      </div>
      <p><strong>IP Address that triggered lockout:</strong></p>
      <div class="info-box">${ipAddress}</div>
      <p><strong>Lockout duration:</strong> ${lockoutMinutes} minutes</p>
      <p>If this wasn't you, we recommend resetting your password immediately:</p>
      <div style="text-align: center; margin: 25px 0;">
        <a href="${resetUrl}" class="button">Reset Password</a>
      </div>
    </div>

    <div class="footer">
      <p>&copy; 2026 SouqSyria - سوق سوريا. All rights reserved.</p>
      <p>This is an automated security alert. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Password reset email template
   * Supports Arabic RTL + English
   */
  private getPasswordResetTemplate(resetUrl: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #988561 0%, #7a6b4f 100%); color: #ffffff; padding: 30px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { padding: 30px 20px; }
    .arabic { direction: rtl; font-family: 'Arial', 'Segoe UI', 'Tahoma', sans-serif; }
    .footer { background: #f8f6f3; color: #666; padding: 20px; text-align: center; font-size: 12px; border-top: 1px solid #e0e0e0; }
    .button { display: inline-block; background: #988561; color: #ffffff !important; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 0; font-weight: bold; }
    .button:hover { background: #7a6b4f; }
    .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>سوق سوريا - SouqSyria</h1>
    </div>

    <!-- Arabic Section -->
    <div class="content arabic">
      <h2 style="color: #988561;">طلب إعادة تعيين كلمة المرور 🔒</h2>
      <p>تلقينا طلباً لإعادة تعيين كلمة مرور حسابك في سوق سوريا.</p>
      <p>اضغط على الزر أدناه لإنشاء كلمة مرور جديدة:</p>

      <div style="text-align: center; margin: 25px 0;">
        <a href="${resetUrl}" class="button">إعادة تعيين كلمة المرور</a>
      </div>

      <div class="warning">
        <strong>⚠️ تنبيه أمني:</strong>
        <p style="margin: 5px 0 0 0;">هذا الرابط صالح لمدة ساعة واحدة فقط. إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذه الرسالة وحسابك سيبقى آمناً.</p>
      </div>

      <p style="margin-top: 20px; font-size: 12px; color: #666;">إذا لم يعمل الزر، انسخ الرابط التالي والصقه في المتصفح:<br><a href="${resetUrl}" style="color: #988561; word-break: break-all;">${resetUrl}</a></p>
    </div>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

    <!-- English Section -->
    <div class="content">
      <h2 style="color: #988561;">Password Reset Request 🔒</h2>
      <p>We received a request to reset the password for your SouqSyria account.</p>
      <p>Click the button below to create a new password:</p>

      <div style="text-align: center; margin: 25px 0;">
        <a href="${resetUrl}" class="button">Reset Password</a>
      </div>

      <div class="warning">
        <strong>⚠️ Security Warning:</strong>
        <p style="margin: 5px 0 0 0;">This link is valid for 1 hour only. If you didn't request a password reset, please ignore this email and your account will remain secure.</p>
      </div>

      <p style="margin-top: 20px; font-size: 12px; color: #666;">If the button doesn't work, copy and paste this link into your browser:<br><a href="${resetUrl}" style="color: #988561; word-break: break-all;">${resetUrl}</a></p>
    </div>

    <div class="footer">
      <p>© 2026 SouqSyria - سوق سوريا. All rights reserved.</p>
      <p>This is an automated email. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Profile updated confirmation email template
   * Supports Arabic RTL + English
   * Notifies user of profile changes
   */
  private getProfileUpdatedTemplate(
    firstName: string,
    updateDate: string,
  ): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #988561 0%, #7a6b4f 100%); color: #ffffff; padding: 30px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { padding: 30px 20px; }
    .arabic { direction: rtl; font-family: 'Arial', 'Segoe UI', 'Tahoma', sans-serif; }
    .footer { background: #f8f6f3; color: #666; padding: 20px; text-align: center; font-size: 12px; border-top: 1px solid #e0e0e0; }
    .success-box { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .success-box h3 { color: #155724; margin: 0 0 10px 0; }
    .info-box { background: #f8f6f3; border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; margin: 15px 0; }
    .info-row { display: flex; justify-content: space-between; margin: 8px 0; }
    .info-label { color: #666; font-weight: bold; }
    .info-value { color: #333; }
    .button { display: inline-block; background: #988561; color: #ffffff !important; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 0; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>سوق سوريا - SouqSyria</h1>
    </div>

    <!-- Arabic Section -->
    <div class="content arabic">
      <h2 style="color: #988561;">مرحباً ${firstName}! 👋</h2>
      <div class="success-box">
        <h3>✅ تم تحديث ملفك الشخصي بنجاح</h3>
        <p style="margin: 0;">تم تحديث معلومات حسابك في سوق سوريا بنجاح.</p>
      </div>

      <div class="info-box">
        <div class="info-row">
          <span class="info-label">تاريخ التحديث:</span>
          <span class="info-value">${updateDate}</span>
        </div>
        <div class="info-row">
          <span class="info-label">الإجراء:</span>
          <span class="info-value">تحديث الملف الشخصي</span>
        </div>
        <div class="info-row">
          <span class="info-label">الحالة:</span>
          <span class="info-value" style="color: #28a745; font-weight: bold;">مكتمل</span>
        </div>
      </div>

      <p>إذا لم تقم بإجراء هذا التغيير، يرجى تغيير كلمة المرور فوراً والتواصل مع فريق الدعم.</p>
    </div>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

    <!-- English Section -->
    <div class="content">
      <h2 style="color: #988561;">Hello ${firstName}! 👋</h2>
      <div class="success-box">
        <h3>✅ Profile Successfully Updated</h3>
        <p style="margin: 0;">Your SouqSyria account information has been updated successfully.</p>
      </div>

      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Update Date:</span>
          <span class="info-value">${updateDate}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Action:</span>
          <span class="info-value">Profile Update</span>
        </div>
        <div class="info-row">
          <span class="info-label">Status:</span>
          <span class="info-value" style="color: #28a745; font-weight: bold;">Completed</span>
        </div>
      </div>

      <p>If you didn't make this change, please change your password immediately and contact our support team.</p>
    </div>

    <div class="footer">
      <p>© 2026 SouqSyria - سوق سوريا. All rights reserved.</p>
      <p>This is an automated notification. Please do not reply to this email.</p>
      <p style="margin-top: 10px;">
        <strong>Need Help?</strong><br>
        Contact our support team at support@souqsyria.com
      </p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Password changed confirmation email template
   * Supports Arabic RTL + English
   * Notifies user of password change and provides security warning
   */
  private getPasswordChangedTemplate(changeDate: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #988561 0%, #7a6b4f 100%); color: #ffffff; padding: 30px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { padding: 30px 20px; }
    .arabic { direction: rtl; font-family: 'Arial', 'Segoe UI', 'Tahoma', sans-serif; }
    .footer { background: #f8f6f3; color: #666; padding: 20px; text-align: center; font-size: 12px; border-top: 1px solid #e0e0e0; }
    .success-box { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .success-box h3 { color: #155724; margin: 0 0 10px 0; }
    .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .info-box { background: #f8f6f3; border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; margin: 15px 0; }
    .info-row { display: flex; justify-content: space-between; margin: 8px 0; }
    .info-label { color: #666; font-weight: bold; }
    .info-value { color: #333; }
    .button { display: inline-block; background: #988561; color: #ffffff !important; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 0; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>سوق سوريا - SouqSyria</h1>
    </div>

    <!-- Arabic Section -->
    <div class="content arabic">
      <div class="success-box">
        <h3>✅ تم تغيير كلمة المرور بنجاح</h3>
        <p style="margin: 0;">تم تحديث كلمة مرور حسابك في سوق سوريا بنجاح.</p>
      </div>

      <h2 style="color: #988561;">تفاصيل التغيير</h2>

      <div class="info-box">
        <div class="info-row">
          <span class="info-label">تاريخ التغيير:</span>
          <span class="info-value">${changeDate}</span>
        </div>
        <div class="info-row">
          <span class="info-label">الإجراء:</span>
          <span class="info-value">تغيير كلمة المرور</span>
        </div>
        <div class="info-row">
          <span class="info-label">الحالة:</span>
          <span class="info-value" style="color: #28a745; font-weight: bold;">مكتمل</span>
        </div>
      </div>

      <div class="warning">
        <strong>⚠️ تنبيه أمني مهم:</strong>
        <p style="margin: 10px 0 0 0;">
          <strong>إذا لم تقم بإجراء هذا التغيير:</strong><br>
          - حسابك قد يكون معرضاً للخطر<br>
          - قم بتغيير كلمة المرور فوراً<br>
          - تواصل مع فريق الدعم على الفور<br>
          - تحقق من نشاط حسابك الأخير
        </p>
      </div>

      <p style="margin-top: 25px; color: #666; font-size: 14px;">
        <strong>ملاحظة:</strong> تم تسجيل خروجك من جميع الأجهزة الأخرى لأسباب أمنية. ستحتاج إلى تسجيل الدخول مرة أخرى باستخدام كلمة المرور الجديدة.
      </p>
    </div>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

    <!-- English Section -->
    <div class="content">
      <div class="success-box">
        <h3>✅ Password Successfully Changed</h3>
        <p style="margin: 0;">Your SouqSyria account password has been updated successfully.</p>
      </div>

      <h2 style="color: #988561;">Change Details</h2>

      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Change Date:</span>
          <span class="info-value">${changeDate}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Action:</span>
          <span class="info-value">Password Change</span>
        </div>
        <div class="info-row">
          <span class="info-label">Status:</span>
          <span class="info-value" style="color: #28a745; font-weight: bold;">Completed</span>
        </div>
      </div>

      <div class="warning">
        <strong>⚠️ Important Security Warning:</strong>
        <p style="margin: 10px 0 0 0;">
          <strong>If you didn't make this change:</strong><br>
          - Your account may be compromised<br>
          - Change your password immediately<br>
          - Contact our support team right away<br>
          - Review your recent account activity
        </p>
      </div>

      <p style="margin-top: 25px; color: #666; font-size: 14px;">
        <strong>Note:</strong> You have been logged out of all other devices for security reasons. You will need to log in again using your new password.
      </p>
    </div>

    <div class="footer">
      <p>© 2026 SouqSyria - سوق سوريا. All rights reserved.</p>
      <p>This is an automated security notification. Please do not reply to this email.</p>
      <p style="margin-top: 10px;">
        <strong>Need Help?</strong><br>
        Contact our support team at support@souqsyria.com
      </p>
    </div>
  </div>
</body>
</html>
    `;
  }
}
