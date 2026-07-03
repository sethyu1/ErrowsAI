import { fetch, HeadersInit, RequestInit, Response } from 'undici';
import qs from 'qs';

function resolveUrl(path: string, basePath?: string) {
  const url = new URL(path, basePath);
  return url.toString();
};

class APIError extends Error {
  status: number;
  url: string;
  method: string;
  body: any;

  constructor(
    status: number,
    url: string,
    method: string,
    body: unknown
  ) {
    const data = typeof body === 'string' ? body : JSON.stringify(body);
    const message = `${status} - ${method} ${url} - ${data}`;
    super(message);
    this.status = status;
    this.url = url;
    this.method = method;
    this.body = body;
  }
}

interface Options extends Omit<RequestInit, 'body'> {
  token?: string;
  query?: Record<string, unknown>;
  body?: unknown;
}
function getHeaders(options: Options): HeadersInit {
  return Object.assign(
    { ...options.headers },
    { 'content-type': 'application/json' },
    options.token ? { 'Authorization': `Bearer ${options.token}` } : {},
  ) as HeadersInit;
}

async function handlerBody(res: Response): Promise<string | unknown> {
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json') === false) {
    return res.text();
  }

  const body = await res.json();
  return body;
}

export async function getJSON<Res>(uri: string, options: Options = {}) {
  const { query, body: _body, ...rest } = options;
  if (query) {
    const queryString = qs.stringify(query);
    uri += (uri.includes('?') ? '&' : '?') + queryString;
  }
  const url = resolveUrl(uri);
  const res = await fetch(url, {
    ...rest,
    method: 'GET',
    headers: getHeaders(options),
  });

  const body = await handlerBody(res);

  if (res.ok === false ) {
    throw new APIError(res.status, uri, 'GET', body);
  }

  return body as Res;
}

export async function postJSON<Res = void>(uri: string, options: Options = {}) {
  const url = resolveUrl(uri);
  const res = await fetch(url, {
    ...options,
    method: 'POST',
    headers: getHeaders(options),
    body: (options.body && JSON.stringify(options.body)) as string,
  });

  const body = await handlerBody(res);

  if (res.ok === false) {
    throw new APIError(res.status, uri, 'POST', body);
  }

  return body as Res;
}