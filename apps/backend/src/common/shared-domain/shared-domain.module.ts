/**
 * @file shared-domain.module.ts
 * @description Shared Domain Module - Breaks circular dependencies between transaction modules
 *
 * ARCHITECTURE PATTERN:
 * This module provides:
 * 1. Shared interfaces and DTOs for cross-module communication
 * 2. Event-based communication via NestJS EventEmitter2
 * 3. Common transaction types without module coupling
 *
 * MODULES DECOUPLED:
 * - Orders ↔ Payment ↔ Refund cycle
 * - Products ↔ Stock ↔ Pricing cycle
 *
 * @author SouqSyria Development Team
 * @since 2026-01-21
 * @version 1.0.0
 */

import { Global, Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

// Shared Services
import { TransactionEventService } from './services/transaction-event.service';
import { DomainEventPublisher } from './services/domain-event-publisher.service';

/**
 * SharedDomainModule
 * @description Global module providing shared interfaces and event-driven communication
 *
 * @example
 * // In any module that needs to emit events:
 * constructor(private readonly transactionEvents: TransactionEventService) {}
 *
 * async processPayment() {
 *   await this.transactionEvents.emitPaymentCompleted({ orderId, amount });
 * }
 */
@Global()
@Module({
  imports: [
    // Event Emitter for decoupled cross-module communication
    EventEmitterModule.forRoot({
      // Use wildcard for flexible event listening
      wildcard: true,
      // Delimiter for namespaced events (e.g., 'order.created', 'payment.completed')
      delimiter: '.',
      // Allow new listeners after max listeners reached
      newListener: false,
      // Remove listeners on cleanup
      removeListener: false,
      // Max listeners per event (prevents memory leaks)
      maxListeners: 20,
      // Emit warnings when exceeding limits
      verboseMemoryLeak: true,
      // Ignore errors in listeners (production resilience)
      ignoreErrors: false,
    }),
  ],
  providers: [
    TransactionEventService,
    DomainEventPublisher,
  ],
  exports: [
    EventEmitterModule,
    TransactionEventService,
    DomainEventPublisher,
  ],
})
export class SharedDomainModule {}
