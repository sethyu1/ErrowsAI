import { fetch } from 'undici';
import qs from 'qs';
import { EventSourceParserStream } from 'eventsource-parser/stream';
import Stream from 'node:stream';

function resolveUrl(server, path) {
  const { address, port } = server.address();
  const url = new URL(path, `http://${address}:${port}`);
  return url.toString();
};

class APIError extends Error {
  constructor(status, url, method, body) {
    const data = typeof body === 'string' ? body : JSON.stringify(body);
    const message = `${status} - ${method} ${url} - ${data}`;
    super(message);
    this.status = status;
    this.url = url;
    this.method = method;
    this.body = body;
  }
}

function getHeaders(options) {
  return Object.assign(
    { ...options.headers },
    { 'content-type': 'application/json' },
    options.token ? { 'Authorization': `Bearer ${options.token}` } : {},
  );
}

async function handlerBody(res) {
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json') === false) {
    return res.text();
  }

  const body = await res.json();
  return body;
}

export async function getJSON(server, path, options = {}) {
  const { query } = options;
  if (query) {
    const queryString = qs.stringify(query);
    path += (path.includes('?') ? '&' : '?') + queryString;
  }
  const url = resolveUrl(server, path);
  const res = await fetch(url, {
    ...options,
    method: 'GET',
    headers: getHeaders(options),
  });

  const body = await handlerBody(res);

  if (res.ok === false ) {
    throw new APIError(res.status, path, 'GET', body);
  }

  return body.data;
}

export async function postJSON(server, path, options = {}) {
  const url = resolveUrl(server, path);
  const res = await fetch(url, {
    ...options,
    method: 'POST',
    headers: getHeaders(options),
    body: options.body && JSON.stringify(options.body),
  });

  const body = await handlerBody(res);

  if (res.ok === false) {
    throw new APIError(res.status, path, 'POST', body);
  }

  return body.data;
}

export async function putJSON(server, path, options = {}) {
  const url = resolveUrl(server, path);
  const res = await fetch(url, {
    ...options,
    method: 'PUT',
    headers: getHeaders(options),
    body: options.body && JSON.stringify(options.body),
  });

  const body = await handlerBody(res);
  if (res.ok === false) {
    throw new APIError(res.status, path, 'PUT', body);
  }

  return body.data;
}

export async function deleteJSON(server, path, options = {}) {
  const url = resolveUrl(server, path);
  const res = await fetch(url, {
    ...options,
    method: 'DELETE',
    headers: getHeaders(options),
  });

  const body = await handlerBody(res);
  if (res.ok === false) {
    throw new APIError(res.status, path, 'DELETE', body);
  }

  return body.data;
}

async function postStream(server, path, options = {}) {
  const header = Object.assign(
    { ...options.headers },
    options.token ? { 'Authorization': `Bearer ${options.token}` } : {},
  );

  const url = resolveUrl(server, path);
  const res = await fetch(url, {
    method: 'POST',
    headers: header,
    body: options.body,
    duplex: 'half',
  });

  if (res.ok === false) {
    const body = await handlerBody(res);
    throw new APIError(res.status, path, 'POST', body);
  }

  return res;
}

export async function postStreamJSON(server, path, options = {}) {
  const res = await postStream(server, path, options);
  const body = await handlerBody(res);
  return body.data;
}

export async function postStreamSSE(server, path, options = {}) {
  const res = await postStream(server, path, options);

  const reader = res.body
  // eslint-disable-next-line n/no-unsupported-features/node-builtins
  .pipeThrough(new TextDecoderStream())
  .pipeThrough(new EventSourceParserStream())
  .getReader();

  return Stream.Readable.from((async function* iter() {
    do {
      const { done, value } = await reader.read();
      if (done) { break; }
      yield value;
    } while (true);
  })());
}