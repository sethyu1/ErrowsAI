/**
 * Optional sink for logging LLM request bodies (set by errows console debug).
 * Called with (type, payload) before sending the HTTP request.
 */
type Sink = (type: string, payload: unknown) => void;
let sink: Sink | null = null;

export function setLLMDebugSink(fn: Sink | null): void {
  sink = fn;
}

export function getLLMDebugSink(): Sink | null {
  return sink;
}

export function pushLLMDebugPayload(type: string, payload: unknown): void {
  if (sink) sink(type, payload);
}
