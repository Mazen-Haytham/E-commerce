// Core message envelope that wraps all event payloads
// This provides traceability and idempotency handling without coupling to specific event types
export interface EventEnvelope<T = unknown> {
  eventId: string; // unique per message — use this for idempotency checks
  eventType: string; // domain event name, e.g. "OrderCreated"
  occurredAt: string; // ISO timestamp of when the event occurred
  payload: T; // Define your specific event payload types in your service modules
}
