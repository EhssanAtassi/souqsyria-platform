import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MobileDeviceEntity } from '../entities/mobile-device.entity';
import { MobileOTPEntity } from '../entities/mobile-otp.entity';
import { MobileSessionEntity } from '../entities/mobile-session.entity';
import { MobileNotificationEntity } from '../entities/mobile-notification.entity';
import { User } from '../../users/entities/user.entity';

/**
 * Mobile Seeder Service
 *
 * Seeds mobile-specific test data for development and testing.
 * Includes realistic Syrian mobile numbers, device data, and notifications.
 */
@Injectable()
export class MobileSeederService {
  private readonly logger = new Logger(MobileSeederService.name);

  constructor(
    @InjectRepository(MobileDeviceEntity)
    private readonly deviceRepository: Repository<MobileDeviceEntity>,
    @InjectRepository(MobileOTPEntity)
    private readonly otpRepository: Repository<MobileOTPEntity>,
    @InjectRepository(MobileSessionEntity)
    private readonly sessionRepository: Repository<MobileSessionEntity>,
    @InjectRepository(MobileNotificationEntity)
    private readonly notificationRepository: Repository<MobileNotificationEntity>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Seed all mobile test data
   */
  async seedAll() {
    const startTime = Date.now();
    this.logger.log('🌱 Starting mobile seeding process...');

    try {
      // Clean existing data first
      await this.cleanAll(false);

      // Seed all mobile data
      const devicesResult = await this.seedDevices(false);
      const otpResult = await this.seedOTP(false);
      const sessionsResult = await this.seedSessions(false);
      const notificationsResult = await this.seedNotifications(false);

      const executionTime = (Date.now() - startTime) / 1000;
      const totalRecords =
        devicesResult.count +
        otpResult.count +
        sessionsResult.count +
        notificationsResult.count;

      const result = {
        message: 'Mobile test data seeded successfully',
        data: {
          devices: devicesResult.count,
          otpCodes: otpResult.count,
          sessions: sessionsResult.count,
          notifications: notificationsResult.count,
        },
        performance: {
          executionTime: `${executionTime}s`,
          totalRecords,
        },
      };

      this.logger.log(
        `✅ Mobile seeding completed successfully in ${executionTime}s`,
      );
      return result;
    } catch (error: unknown) {
      this.logger.error('❌ Mobile seeding failed', error);
      throw error;
    }
  }

  /**
   * Seed mobile devices
   */
  async seedDevices(logResult = true) {
    this.logger.log('📱 Seeding mobile devices...');

    // Get first 10 users for device association
    const users = await this.userRepository.find({ take: 10 });
    if (users.length === 0) {
      throw new Error('No users found. Please seed users first.');
    }

    const devices = [];

    // Create sample devices for testing
    const deviceTemplates = [
      { type: 'ios', name: 'iPhone 15 Pro', os: 'iOS 17.1' },
      { type: 'ios', name: 'iPhone 14', os: 'iOS 16.5' },
      { type: 'android', name: 'Samsung Galaxy S24', os: 'Android 14' },
      { type: 'android', name: 'Samsung Galaxy A54', os: 'Android 13' },
      { type: 'android', name: 'Xiaomi Redmi Note 13', os: 'Android 14' },
    ];

    let deviceIndex = 0;
    for (const user of users) {
      for (let i = 0; i < 1; i++) {
        // 1 device per user initially
        const template = deviceTemplates[deviceIndex % deviceTemplates.length];

        const device = this.deviceRepository.create({
          userId: user.id,
          deviceId: `device-${user.id}-${i + 1}-${Date.now()}`,
          deviceType: template.type as 'ios' | 'android',
          deviceName: template.name,
          appVersion: '1.0.0',
          osVersion: template.os,
          pushToken: `${template.type}_push_token_${user.id}_${i + 1}`,
          isActive: true,
          notificationsEnabled: true,
          lastAccessAt: new Date(),
        });

        devices.push(device);
        deviceIndex++;
      }
    }

    // Add some additional devices for variety
    const additionalDevices = [
      {
        userId: users[0].id,
        deviceId: `tablet-${users[0].id}-${Date.now()}`,
        deviceType: 'ios' as const,
        deviceName: 'iPad Pro',
        appVersion: '1.0.0',
        osVersion: 'iPadOS 17.1',
        pushToken: `ios_tablet_push_${users[0].id}`,
        isActive: true,
        notificationsEnabled: true,
        lastAccessAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
      {
        userId: users[1].id,
        deviceId: `old-device-${users[1].id}-${Date.now()}`,
        deviceType: 'android' as const,
        deviceName: 'Samsung Galaxy S20',
        appVersion: '0.9.5',
        osVersion: 'Android 12',
        pushToken: null, // No push token for old device
        isActive: false,
        notificationsEnabled: false,
        lastAccessAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      },
    ];

    additionalDevices.forEach((deviceData) => {
      devices.push(this.deviceRepository.create(deviceData));
    });

    const savedDevices = await this.deviceRepository.save(devices);

    const result = {
      message: 'Mobile devices seeded successfully',
      count: savedDevices.length,
    };

    if (logResult) {
      this.logger.log(`✅ Seeded ${savedDevices.length} mobile devices`);
    }

    return result;
  }

  /**
   * Seed OTP codes for testing
   */
  async seedOTP(logResult = true) {
    this.logger.log('🔢 Seeding OTP codes...');

    const otpCodes = [];

    // Syrian phone numbers for testing
    const syrianPhones = [
      '+963991234567', // MTN Syria
      '+963993456789', // Syriatel
      '+963988123456', // MTN Syria
      '+963994567890', // Syriatel
      '+963987654321', // MTN Syria
    ];

    syrianPhones.forEach((phone, index) => {
      const otp = this.otpRepository.create({
        phone,
        otp: String(123456 + index), // Simple OTP for testing
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
        verified: false,
        attempts: 0,
        maxAttempts: 3,
        deviceId: `test-device-${index + 1}`,
        ipAddress: `192.168.1.${100 + index}`,
      });

      otpCodes.push(otp);
    });

    // Add some expired OTPs for testing
    otpCodes.push(
      this.otpRepository.create({
        phone: '+963992222222',
        otp: '999999',
        expiresAt: new Date(Date.now() - 10 * 60 * 1000), // Expired 10 minutes ago
        verified: false,
        attempts: 0,
        deviceId: 'expired-test-device',
        ipAddress: '192.168.1.200',
      }),
    );

    const savedOTPs = await this.otpRepository.save(otpCodes);

    const result = {
      message: 'OTP codes seeded successfully',
      count: savedOTPs.length,
    };

    if (logResult) {
      this.logger.log(`✅ Seeded ${savedOTPs.length} OTP codes`);
    }

    return result;
  }

  /**
   * Seed mobile sessions
   */
  async seedSessions(logResult = true) {
    this.logger.log('📊 Seeding mobile sessions...');

    const users = await this.userRepository.find({ take: 5 });
    const devices = await this.deviceRepository.find({ take: 8 });

    if (users.length === 0 || devices.length === 0) {
      throw new Error(
        'Users or devices not found. Please seed users and devices first.',
      );
    }

    const sessions = [];

    devices.forEach((device, index) => {
      const user = users[index % users.length];

      // Active session
      if (index < 3) {
        const session = this.sessionRepository.create({
          userId: user.id,
          deviceId: device.id,
          sessionId: MobileSessionEntity.generateSessionId(),
          accessToken: `access_token_${index + 1}`,
          refreshToken: `refresh_token_${index + 1}`,
          startedAt: new Date(
            Date.now() - Math.random() * 2 * 24 * 60 * 60 * 1000,
          ), // Up to 2 days ago
          lastActivityAt: new Date(
            Date.now() - Math.random() * 2 * 60 * 60 * 1000,
          ), // Up to 2 hours ago
          isActive: true,
          ipAddress: `192.168.1.${50 + index}`,
          userAgent:
            device.deviceType === 'ios'
              ? 'SouqSyria/1.0.0 (iOS)'
              : 'SouqSyria/1.0.0 (Android)',
          appVersion: '1.0.0',
          location: index % 2 === 0 ? 'Damascus, Syria' : 'Aleppo, Syria',
          apiCallCount: Math.floor(Math.random() * 500) + 50,
          dataTransferred: Math.floor(Math.random() * 1000000) + 100000,
        });
        sessions.push(session);
      }

      // Ended sessions
      else {
        const endReasons: Array<
          'logout' | 'timeout' | 'revoked' | 'expired' | 'device_change'
        > = ['logout', 'timeout', 'revoked', 'expired'];

        const startTime = new Date(
          Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
        ); // Up to 7 days ago
        const endTime = new Date(
          startTime.getTime() + Math.random() * 24 * 60 * 60 * 1000,
        ); // Duration up to 1 day

        const session = this.sessionRepository.create({
          userId: user.id,
          deviceId: device.id,
          sessionId: MobileSessionEntity.generateSessionId(),
          accessToken: `ended_access_token_${index + 1}`,
          refreshToken: `ended_refresh_token_${index + 1}`,
          startedAt: startTime,
          endedAt: endTime,
          lastActivityAt: endTime,
          isActive: false,
          endReason: endReasons[index % endReasons.length],
          ipAddress: `192.168.1.${60 + index}`,
          userAgent:
            device.deviceType === 'ios'
              ? 'SouqSyria/0.9.0 (iOS)'
              : 'SouqSyria/0.9.0 (Android)',
          appVersion: '0.9.0',
          location: 'Damascus, Syria',
          apiCallCount: Math.floor(Math.random() * 200) + 20,
          dataTransferred: Math.floor(Math.random() * 500000) + 50000,
        });
        sessions.push(session);
      }
    });

    const savedSessions = await this.sessionRepository.save(sessions);

    const result = {
      message: 'Mobile sessions seeded successfully',
      count: savedSessions.length,
    };

    if (logResult) {
      this.logger.log(`✅ Seeded ${savedSessions.length} mobile sessions`);
    }

    return result;
  }

  /**
   * Seed mobile notifications
   */
  async seedNotifications(logResult = true) {
    this.logger.log('🔔 Seeding mobile notifications...');

    const users = await this.userRepository.find({ take: 5 });
    const devices = await this.deviceRepository.find({
      where: { isActive: true },
      take: 5,
    });

    if (users.length === 0) {
      throw new Error('Users not found. Please seed users first.');
    }

    const notifications = [];

    // Notification templates with Arabic/English content
    const notificationTemplates = [
      {
        type: 'order_update' as const,
        titleEn: 'Order Shipped',
        titleAr: 'تم شحن الطلب',
        bodyEn: 'Your order #12345 has been shipped and is on its way to you.',
        bodyAr: 'تم شحن طلبكم رقم #12345 وهو في طريقه إليكم.',
        priority: 'high' as const,
        deepLink: 'souqsyria://orders/12345',
      },
      {
        type: 'payment_confirmation' as const,
        titleEn: 'Payment Successful',
        titleAr: 'تم الدفع بنجاح',
        bodyEn:
          'Your payment of 2,750,000 SYP has been processed successfully.',
        bodyAr: 'تم معالجة دفعتكم بقيمة 2,750,000 ل.س بنجاح.',
        priority: 'high' as const,
        deepLink: 'souqsyria://payments/67890',
      },
      {
        type: 'promotion' as const,
        titleEn: '50% OFF Electronics',
        titleAr: 'خصم 50% على الإلكترونيات',
        bodyEn: 'Limited time offer! Get 50% off on all electronics. Shop now!',
        bodyAr:
          'عرض لفترة محدودة! احصل على خصم 50% على جميع الإلكترونيات. تسوق الآن!',
        priority: 'normal' as const,
        deepLink: 'souqsyria://categories/electronics',
      },
      {
        type: 'new_product' as const,
        titleEn: 'New Samsung Galaxy S24',
        titleAr: 'سامسونج جالاكسي إس 24 الجديد',
        bodyEn: 'The latest Samsung Galaxy S24 is now available. Check it out!',
        bodyAr: 'سامسونج جالاكسي إس 24 الأحدث متاح الآن. اطلع عليه!',
        priority: 'normal' as const,
        deepLink: 'souqsyria://products/samsung-galaxy-s24',
      },
      {
        type: 'stock_alert' as const,
        titleEn: 'Back in Stock',
        titleAr: 'عاد للمخزون',
        bodyEn: 'iPhone 15 Pro is back in stock! Order now before it runs out.',
        bodyAr: 'آيفون 15 برو عاد للمخزون! اطلبه الآن قبل نفاده.',
        priority: 'high' as const,
        deepLink: 'souqsyria://products/iphone-15-pro',
      },
    ];

    // Create notifications for different scenarios
    users.forEach((user, userIndex) => {
      notificationTemplates.forEach((template, templateIndex) => {
        const notificationIndex =
          userIndex * notificationTemplates.length + templateIndex;

        // Delivered notifications
        if (notificationIndex < 10) {
          const sentTime = new Date(
            Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
          );
          const deliveredTime = new Date(
            sentTime.getTime() + Math.random() * 60 * 1000,
          );
          const openedTime =
            Math.random() > 0.4
              ? new Date(deliveredTime.getTime() + Math.random() * 3600 * 1000)
              : null;

          const notification = this.notificationRepository.create({
            userId: user.id,
            deviceId: devices[userIndex % devices.length]?.id,
            type: template.type,
            titleEn: template.titleEn,
            titleAr: template.titleAr,
            bodyEn: template.bodyEn,
            bodyAr: template.bodyAr,
            deepLink: template.deepLink,
            priority: template.priority,
            status: 'delivered',
            sentAt: sentTime,
            deliveredAt: deliveredTime,
            openedAt: openedTime,
            messageId: `fcm_msg_${notificationIndex + 1}`,
            payload: {
              orderId: template.type === 'order_update' ? '12345' : undefined,
              categoryId:
                template.type === 'promotion' ? 'electronics' : undefined,
            },
          });

          notifications.push(notification);
        }

        // Pending notifications
        else if (notificationIndex < 12) {
          const notification = this.notificationRepository.create({
            userId: user.id,
            type: template.type,
            titleEn: template.titleEn,
            titleAr: template.titleAr,
            bodyEn: template.bodyEn,
            bodyAr: template.bodyAr,
            deepLink: template.deepLink,
            priority: template.priority,
            status: 'pending',
            scheduledAt: new Date(
              Date.now() + Math.random() * 24 * 60 * 60 * 1000,
            ), // Within next 24 hours
          });

          notifications.push(notification);
        }

        // Failed notifications
        else if (notificationIndex < 15) {
          const notification = this.notificationRepository.create({
            userId: user.id,
            deviceId: devices[userIndex % devices.length]?.id,
            type: template.type,
            titleEn: template.titleEn,
            titleAr: template.titleAr,
            bodyEn: template.bodyEn,
            bodyAr: template.bodyAr,
            priority: template.priority,
            status: 'failed',
            errorMessage: 'Device token invalid',
            retryCount: 2,
          });

          notifications.push(notification);
        }
      });
    });

    // Add broadcast notifications
    const broadcastNotifications = [
      {
        type: 'system_announcement' as const,
        titleEn: 'System Maintenance',
        titleAr: 'صيانة النظام',
        bodyEn:
          'System maintenance scheduled for tonight from 2:00 AM to 4:00 AM.',
        bodyAr:
          'صيانة النظام مجدولة الليلة من الساعة 2:00 صباحاً حتى 4:00 صباحاً.',
        priority: 'critical' as const,
        status: 'delivered' as const,
        sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        deliveredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 30000),
      },
      {
        type: 'marketing' as const,
        titleEn: 'Welcome to SouqSyria',
        titleAr: 'أهلاً بكم في سوق سوريا',
        bodyEn:
          'Thank you for joining SouqSyria! Discover amazing products at great prices.',
        bodyAr:
          'شكراً لانضمامكم إلى سوق سوريا! اكتشفوا منتجات رائعة بأسعار مميزة.',
        priority: 'normal' as const,
        status: 'delivered' as const,
        deepLink: 'souqsyria://home',
        sentAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        deliveredAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 15000),
      },
    ];

    broadcastNotifications.forEach((notif) => {
      notifications.push(this.notificationRepository.create(notif));
    });

    const savedNotifications =
      await this.notificationRepository.save(notifications);

    const result = {
      message: 'Mobile notifications seeded successfully',
      count: savedNotifications.length,
    };

    if (logResult) {
      this.logger.log(
        `✅ Seeded ${savedNotifications.length} mobile notifications`,
      );
    }

    return result;
  }

  /**
   * Get seeding statistics
   */
  async getStats() {
    const [deviceCount, otpCount, sessionCount, notificationCount] =
      await Promise.all([
        this.deviceRepository.count(),
        this.otpRepository.count(),
        this.sessionRepository.count(),
        this.notificationRepository.count(),
      ]);

    return {
      message: 'Mobile seeding statistics',
      data: {
        devices: deviceCount,
        otpCodes: otpCount,
        sessions: sessionCount,
        notifications: notificationCount,
        total: deviceCount + otpCount + sessionCount + notificationCount,
      },
    };
  }

  /**
   * Clean all mobile test data
   */
  async cleanAll(logResult = true) {
    if (logResult) {
      this.logger.log('🧹 Cleaning mobile test data...');
    }

    await Promise.all([
      this.notificationRepository.delete({}),
      this.sessionRepository.delete({}),
      this.otpRepository.delete({}),
      this.deviceRepository.delete({}),
    ]);

    if (logResult) {
      this.logger.log('✅ Mobile test data cleaned successfully');
    }

    return {
      message: 'Mobile test data cleaned successfully',
    };
  }
}
