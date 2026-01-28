/**
 * Event Stream Models
 * Defines data structures for real-time event polling and streaming
 *
 * @module EventStreamModel
 */

import { SecurityAuditEvent } from './security-audit-event.model';

/**
 * State of the event stream polling system
 * Tracks whether live mode is enabled and polling status
 *
 * @interface EventStreamState
 */
export interface EventStreamState {
  /** Whether event streaming is currently enabled */
  enabled: boolean;

  /** Current polling interval in milliseconds */
  interval: number;

  /** Buffer of recent events received from polling */
  buffer: SecurityAuditEvent[];

  /** Timestamp of the last successful poll */
  lastPollTime: Date | null;

  /** Number of consecutive polling errors (for backoff strategy) */
  consecutiveErrors: number;
}

/**
 * Configuration for the polling behavior
 * Controls adaptive polling intervals and error handling
 *
 * @interface PollConfig
 */
export interface PollConfig {
  /** Initial polling interval when starting (default: 5000ms = 5s) */
  initialInterval: number;

  /** Maximum polling interval (prevents infinite growth, default: 30000ms = 30s) */
  maxInterval: number;

  /** Multiplier for exponential backoff (default: 1.5) */
  backoffMultiplier: number;

  /** Number of errors before disabling polling (default: 3) */
  maxConsecutiveErrors: number;
}

/**
 * Default polling configuration
 *
 * @constant
 */
export const DEFAULT_POLL_CONFIG: PollConfig = {
  initialInterval: 5000, // 5 seconds
  maxInterval: 30000, // 30 seconds
  backoffMultiplier: 1.5,
  maxConsecutiveErrors: 3,
};

/**
 * Default event stream state
 *
 * @constant
 */
export const DEFAULT_EVENT_STREAM_STATE: EventStreamState = {
  enabled: false,
  interval: DEFAULT_POLL_CONFIG.initialInterval,
  buffer: [],
  lastPollTime: null,
  consecutiveErrors: 0,
};

/**
 * Result of a polling attempt
 *
 * @interface PollResult
 */
export interface PollResult {
  /** Whether the poll was successful */
  success: boolean;

  /** New events received (empty array if none) */
  events: SecurityAuditEvent[];

  /** Error message if poll failed */
  error?: string;

  /** Timestamp when poll completed */
  timestamp: Date;
}

/**
 * Options for configuring event streaming
 *
 * @interface EventStreamOptions
 */
export interface EventStreamOptions {
  /** Whether to enable streaming immediately */
  autoStart?: boolean;

  /** Custom polling configuration */
  pollConfig?: Partial<PollConfig>;

  /** Maximum number of events to keep in buffer */
  maxBufferSize?: number;

  /** Callback when new events arrive */
  onNewEvents?: (events: SecurityAuditEvent[]) => void;

  /** Callback when error occurs */
  onError?: (error: string) => void;
}

/**
 * Helper to calculate next polling interval based on activity
 *
 * @param currentInterval - Current polling interval
 * @param hasNewEvents - Whether new events were received
 * @param config - Polling configuration
 * @returns New interval value
 */
export function calculateNextInterval(
  currentInterval: number,
  hasNewEvents: boolean,
  config: PollConfig = DEFAULT_POLL_CONFIG
): number {
  if (hasNewEvents) {
    // If there are new events, poll more frequently (but not below initial)
    return Math.max(config.initialInterval, currentInterval * 0.8);
  } else {
    // If no new events, slow down polling (but not above max)
    return Math.min(config.maxInterval, currentInterval * config.backoffMultiplier);
  }
}

/**
 * Helper to determine if polling should be disabled due to errors
 *
 * @param consecutiveErrors - Number of consecutive errors
 * @param config - Polling configuration
 * @returns True if polling should be disabled
 */
export function shouldDisablePolling(
  consecutiveErrors: number,
  config: PollConfig = DEFAULT_POLL_CONFIG
): boolean {
  return consecutiveErrors >= config.maxConsecutiveErrors;
}

/**
 * Helper to truncate event buffer to maximum size
 *
 * @param buffer - Current event buffer
 * @param maxSize - Maximum buffer size
 * @returns Truncated buffer (keeps most recent events)
 */
export function truncateBuffer(buffer: SecurityAuditEvent[], maxSize: number = 100): SecurityAuditEvent[] {
  if (buffer.length <= maxSize) {
    return buffer;
  }

  // Keep only the most recent events
  return buffer.slice(-maxSize);
}

/**
 * Helper to merge new events into buffer without duplicates
 *
 * @param buffer - Current event buffer
 * @param newEvents - New events to add
 * @returns Updated buffer
 */
export function mergeEventBuffer(
  buffer: SecurityAuditEvent[],
  newEvents: SecurityAuditEvent[]
): SecurityAuditEvent[] {
  const existingIds = new Set(buffer.map((e) => e.id));
  const uniqueNewEvents = newEvents.filter((e) => !existingIds.has(e.id));

  return [...buffer, ...uniqueNewEvents];
}

/**
 * Helper to calculate time since last poll
 *
 * @param lastPollTime - Last poll timestamp
 * @returns Seconds since last poll, or null if never polled
 */
export function getTimeSinceLastPoll(lastPollTime: Date | null): number | null {
  if (!lastPollTime) {
    return null;
  }

  const now = new Date();
  return Math.floor((now.getTime() - new Date(lastPollTime).getTime()) / 1000);
}

/**
 * Helper to format polling status for display
 *
 * @param state - Event stream state
 * @returns Human-readable status message
 */
export function formatPollingStatus(state: EventStreamState): string {
  if (!state.enabled) {
    return 'Live mode disabled';
  }

  if (state.consecutiveErrors > 0) {
    return `Polling with ${state.consecutiveErrors} error(s)`;
  }

  if (state.lastPollTime) {
    const secondsAgo = getTimeSinceLastPoll(state.lastPollTime);
    return `Last updated ${secondsAgo}s ago`;
  }

  return 'Initializing...';
}
