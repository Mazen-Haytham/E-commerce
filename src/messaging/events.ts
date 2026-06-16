// Core message envelope that wraps all event payloads
// This provides traceability and idempotency handling without coupling to specific event types
export interface EventEnvelope<T = unknown> {
  eventId: string; // unique per message — use this for idempotency checks
  eventName: string; // same value as the routing key, kept for readability in logs
  occurredAt: string; // ISO timestamp of when it was published
  payload: T; // Define your specific event payload types in your service modules
}
