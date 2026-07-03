/**
 * Common types for Errows API
 */

export * from './user';
export * from './character';
export * from './session';
export * from './post';
export * from './media'
export * from './member';
export * from './payment';
export * from './ops';
export * from './task';

export interface AUTH_HEADER {
  Authorization: `Bearer ${string}`;
}

interface JSON_HEADER {
  'Content-Type': 'application/json';
}

export interface HTTP_REQUEST<
  headers = Record<string, string>,
  BODY = unknown
> {
  headers: headers;
  body: BODY;
}

export interface ERROWS_AUTH_REQ
  extends HTTP_REQUEST<AUTH_HEADER> {}

export interface ERROWS_AUTH_JSON_REQ<BODY>
  extends HTTP_REQUEST<AUTH_HEADER & JSON_HEADER, BODY> {}

export type ERROWS_BODY_JSON<DATA = void> = {
  code: number;
  message: string;
  data: DATA
}

export type FIELD_VALIDATION_ERROR = {
 type: string,
 message: string
 field: string //eg. "body.email",
}

interface HTTP_RESPONSE<
  status extends number,
  body = unknown,
  headers = Record<string, string>
> {
  status: status;
  headers: headers;
  body: body;
}

export type ERROWS_RESPONSE<DATA = unknown, status extends number = 200> =
| HTTP_RESPONSE<200, ERROWS_BODY_JSON<DATA>, JSON_HEADER>
| HTTP_RESPONSE<400, ERROWS_BODY_JSON<FIELD_VALIDATION_ERROR[]>, JSON_HEADER>
| HTTP_RESPONSE<401, ERROWS_BODY_JSON, JSON_HEADER>
| HTTP_RESPONSE<403, ERROWS_BODY_JSON, JSON_HEADER>
| HTTP_RESPONSE<status, ERROWS_BODY_JSON<DATA>, JSON_HEADER>

export type HTTP_204_RES = HTTP_RESPONSE<204, void>;

export type SSE_EVENT<
  event extends string = string,
  data = unknown
> = `event: ${event}\ndata: ${string}\n\n`;

export type HTTPS_SSE_RES<event_data extends SSE_EVENT> = HTTP_RESPONSE<
  200,
  event_data,
  { 'Content-Type': 'text/event-stream' }
>;

export interface PAGINATION<DATA = unknown> {
  count: number; // 总数量
  data: DATA[]; // 数据列表
}