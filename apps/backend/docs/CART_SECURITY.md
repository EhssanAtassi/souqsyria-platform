# Cart Security System Documentation

## Overview

The SouqSyria Cart Security System is an enterprise-grade security solution that provides comprehensive protection for shopping cart operations. This system implements multi-layered security measures including rate limiting, fraud detection, and automated session management.

## 🛡️ Security Components

### 1. Rate Limiting Guard (`CartRateLimitGuard`)

**Location:** `src/cart/guards/cart-rate-limit.guard.ts`

**Purpose:** Prevents abuse by limiting the number of cart operations per user/IP within specified time windows.

**Features:**
- Redis-based sliding window algorithm
- Separate limits for authenticated vs guest users
- Progressive penalty system for repeat offenders
- Configurable rate limits per endpoint
- Graceful degradation when Redis is unavailable

**Configuration:**
```typescript
// Default Rate Limits
authenticated: { maxRequests: 100, windowSizeInSeconds: 3600 }
guest: { maxRequests: 50, windowSizeInSeconds: 3600 }
addItem: { maxRequests: 20, windowSizeInSeconds: 300 }
```

**Usage:**
```typescript
@UseGuards(CartRateLimitGuard)
@RateLimit({ maxRequests: 30, windowSizeInSeconds: 600 })
@Post('items')
async addItemToCart() { ... }
```

### 2. Security Guard (`CartSecurityGuard`)

**Location:** `src/cart/guards/cart-security.guard.ts`

**Purpose:** Detects and responds to fraudulent activities using ML-based risk assessment.

**Detection Capabilities:**
- **Velocity Analysis**: Rapid consecutive operations
- **Quantity Anomalies**: Suspiciously high quantities (>100 items)
- **Price Tampering**: Unrealistic price values (<100 or >10M SYP)
- **Device Fingerprinting**: Device consistency validation
- **Geolocation Analysis**: Location change anomalies
- **Bot Detection**: Automated traffic identification

**Risk Scoring Algorithm:**
```typescript
// Risk factors and weights
velocityViolations: weight 15
quantityAnomalies: weight 20
priceAnomalies: weight 25
deviceMismatch: weight 10
geoAnomaly: weight 15
botLikeAgent: weight 20
ipSuspicious: weight 10
userHistory: weight 10

// Risk levels
0-30: Low risk (allow)
31-70: Medium risk (log + allow)
71-90: High risk (alert + allow)
91-100: Critical risk (block)
```

### 3. Session Cleanup Service (`SessionCleanupService`)

**Location:** `src/guest-sessions/services/session-cleanup.service.ts`

**Purpose:** Automated cleanup of expired guest sessions with grace period enforcement.

**Features:**
- **Scheduled Cleanup**: Daily at 2:00 AM server time
- **Grace Period**: 37-day total retention (30 days + 7 day grace)
- **Soft Delete**: Recovery options for accidentally deleted sessions
- **Comprehensive Statistics**: Space freed, items cleaned, audit trail
- **Manual Triggers**: Admin-controlled cleanup operations

**Cleanup Rules:**
- Active sessions: 30 days of inactivity
- Grace period: Additional 7 days for recovery
- Converted sessions: Immediate cleanup after user conversion
- Audit logging: All cleanup operations logged

## 📊 Monitoring & Analytics

### Security Events

All security events are logged to the audit system with the following structure:

```typescript
{
  action: 'SECURITY_ALERT_[TYPE]',  // VELOCITY, QUANTITY, PRICE, etc.
  module: 'cart_security',
  actorId: 'user123' | null,
  actorType: 'user' | 'guest' | 'system',
  entityType: 'cart_operation',
  entityId: cartId,
  description: 'Detailed description',
  metadata: {
    riskScore: 85,
    triggeredRules: ['velocity', 'quantity'],
    userAgent: '...',
    ipAddress: '...',
  }
}
```

### Performance Metrics

**Target Performance:**
- Cart operations: <200ms response time
- Security checks: <50ms overhead
- Rate limiting: <5ms per request
- Fraud detection: <100ms per request

### Available Endpoints

**Security Statistics:**
```
GET /admin/cart/security/stats
GET /admin/guest-sessions/cleanup/stats
```

## 🚀 Deployment Guide

### Prerequisites

1. **Redis Server** (for rate limiting)
2. **MySQL Database** (for audit logs and sessions)
3. **Environment Variables**

### Environment Configuration

```bash
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# Rate Limiting Settings
CART_RATE_LIMIT_AUTHENTICATED=100
CART_RATE_LIMIT_GUEST=50
CART_RATE_LIMIT_WINDOW=3600

# Security Settings
CART_SECURITY_ENABLED=true
CART_FRAUD_DETECTION_ENABLED=true
CART_SECURITY_BLOCK_THRESHOLD=90

# Session Cleanup
SESSION_CLEANUP_ENABLED=true
SESSION_GRACE_PERIOD_DAYS=7
SESSION_LIFETIME_DAYS=30
```

### Installation Steps

1. **Install Dependencies**
   ```bash
   npm install @nestjs-modules/ioredis ioredis
   npm install @nestjs/throttler
   npm install @nestjs/schedule
   ```

2. **Database Migrations**
   ```bash
   # Run migrations for audit logs
   npm run typeorm:migration:run
   ```

3. **Start Services**
   ```bash
   # Start Redis
   redis-server

   # Start Application
   npm run start:prod
   ```

4. **Verify Installation**
   ```bash
   # Run security validation
   npm run validate:cart-security-simple
   ```

## 🧪 Testing

### Unit Tests

```bash
# Test all security guards
npm run test:cart-guards

# Test specific components
npm test -- --testPathPattern=cart-rate-limit.guard.spec.ts
npm test -- --testPathPattern=cart-security.guard.spec.ts
npm test -- --testPathPattern=session-cleanup.service.spec.ts
```

### Integration Tests

```bash
# Full integration test suite
npm run test:cart-security

# Performance testing
npm run test:cart-performance:light    # 100 users, 30s
npm run test:cart-performance:heavy    # 500 users, 60s
```

### Validation Scripts

```bash
# Simple API validation (no shell commands)
npm run validate:cart-security-simple

# Full validation with performance tests
npm run validate:cart-security
```

### Test Results Interpretation

**Unit Tests:**
- **Target Coverage:** >85%
- **Critical Tests:** Rate limiting algorithms, fraud detection logic, cleanup rules

**Integration Tests:**
- **Response Time:** <200ms for cart operations
- **Success Rate:** >95% for legitimate operations
- **Security Effectiveness:** >80% suspicious activity detection

**Performance Tests:**
- **Concurrent Users:** Support 1000+ users
- **Throughput:** >50 RPS sustained
- **Memory Usage:** <2GB for cache and processing

## 📈 Production Monitoring

### Key Metrics to Monitor

1. **Security Metrics:**
   - Rate limiting activations per hour
   - Fraud detection alerts per day
   - False positive rate (<5% target)
   - Security event volume trends

2. **Performance Metrics:**
   - Cart operation response times
   - Redis hit/miss ratios
   - Database query performance
   - Memory usage patterns

3. **Business Metrics:**
   - Cart abandonment rate changes
   - Conversion impact from security measures
   - Customer complaint volume
   - Revenue protection metrics

### Alerting Recommendations

**Critical Alerts:**
- Security system downtime
- Fraud detection false positive rate >10%
- Cart operation response time >500ms
- Redis connection failures

**Warning Alerts:**
- Unusual security event volume (+50% from baseline)
- Rate limiting activation rate >25%
- Session cleanup failures
- Performance degradation >20%

### Dashboard Queries

**Security Overview:**
```sql
SELECT
  DATE(created_at) as date,
  action,
  COUNT(*) as event_count
FROM audit_logs
WHERE module = 'cart_security'
  AND created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY DATE(created_at), action
ORDER BY date DESC;
```

**Performance Analysis:**
```sql
SELECT
  AVG(JSON_EXTRACT(metadata, '$.responseTime')) as avg_response_time,
  MAX(JSON_EXTRACT(metadata, '$.responseTime')) as max_response_time,
  COUNT(*) as total_operations
FROM audit_logs
WHERE action = 'CART_OPERATION'
  AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR);
```

## 🔧 Configuration Reference

### Rate Limiting Configuration

```typescript
interface RateLimitConfig {
  maxRequests: number;           // Max requests in window
  windowSizeInSeconds: number;   // Time window in seconds
  message?: string;             // Custom error message
}

// Per-endpoint configuration
@RateLimit({
  maxRequests: 20,
  windowSizeInSeconds: 300,
  message: 'Too many add item requests'
})
```

### Security Configuration

```typescript
interface SecurityConfig {
  enabled: boolean;
  fraudDetectionEnabled: boolean;
  blockThreshold: number;        // Risk score threshold for blocking
  logThreshold: number;          // Risk score threshold for logging
  deviceTrackingEnabled: boolean;
  geolocationEnabled: boolean;
}
```

### Session Cleanup Configuration

```typescript
interface CleanupConfig {
  enabled: boolean;
  scheduleExpression: string;    // Cron expression
  gracePerisionDays: number;     // Days before permanent deletion
  lifetimeDays: number;         // Active session lifetime
  batchSize: number;            // Sessions processed per batch
}
```

## 🚨 Troubleshooting

### Common Issues

**1. Rate Limiting Not Working**
- Check Redis connectivity: `redis-cli ping`
- Verify environment variables are set
- Check guard is properly applied to routes
- Review Redis key expiration settings

**2. Fraud Detection False Positives**
- Review risk scoring algorithm weights
- Check device fingerprint consistency
- Validate geolocation data accuracy
- Adjust detection thresholds

**3. Performance Degradation**
- Monitor Redis memory usage
- Check database query performance
- Review concurrent connection limits
- Analyze security processing overhead

**4. Session Cleanup Failures**
- Check database connection health
- Review transaction timeout settings
- Verify cleanup service permissions
- Check disk space for audit logs

### Debug Commands

```bash
# Check Redis connectivity and keys
redis-cli -h localhost -p 6379
> KEYS cart:rate_limit:*
> TTL cart:rate_limit:user:123

# Monitor database connections
SHOW PROCESSLIST;
SHOW STATUS LIKE 'Threads_connected';

# Check application logs
tail -f logs/application.log | grep -E "(SECURITY|RATE_LIMIT)"

# Validate configuration
node -e "console.log(process.env)" | grep -E "(CART_|REDIS_)"
```

### Emergency Procedures

**1. Disable Security Features:**
```bash
# Temporarily disable via environment
export CART_SECURITY_ENABLED=false
export CART_RATE_LIMIT_ENABLED=false

# Restart application
pm2 restart souqsyria-backend
```

**2. Clear Rate Limiting:**
```bash
# Clear all rate limit counters
redis-cli --scan --pattern "cart:rate_limit:*" | xargs redis-cli DEL
```

**3. Emergency Session Cleanup:**
```bash
# Manual cleanup execution
npm run seed:simple:clean sessions_expired
```

## 📚 Additional Resources

### API Documentation
- [Swagger/OpenAPI Documentation](/api/docs)
- [Cart API Reference](/docs/cart-api.md)
- [Security API Reference](/docs/security-api.md)

### Development Resources
- [Contributing Guidelines](/.github/CONTRIBUTING.md)
- [Code Style Guide](/docs/CODE_STYLE.md)
- [Testing Best Practices](/docs/TESTING.md)

### Security Best Practices
- [OWASP Top 10 Compliance](/docs/OWASP_COMPLIANCE.md)
- [Data Privacy Guidelines](/docs/PRIVACY.md)
- [Incident Response Plan](/docs/INCIDENT_RESPONSE.md)

---

**Last Updated:** January 21, 2026
**Version:** 1.0.0
**Maintainer:** SouqSyria Development Team
**Review Schedule:** Quarterly