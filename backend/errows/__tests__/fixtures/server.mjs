import fs from 'node:fs';
import { vi, expect } from 'vitest';
import http from 'node:http';
import { waitingExpectToBeTrue } from '../lib/utils.mjs';

export function getServerAddress(server) {
  const { address, port } = server.address();
  return `http://${address}:${port}`;
}

function closeServer(server) {
  return new Promise(
    (resolve, reject) => server.close( err => err ? reject(err) : resolve())
  );
}

async function mockJSONServer(
  { apiRequest },
) {
  const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const headers = req.headers;
        const promise = apiRequest(JSON.parse(body), { headers });

        promise.then(
          (result) => {
            body = '';
            if (typeof result === 'string') {
              res.writeHead(200, { 'Content-Type': 'text/plain' });
              res.end(result);
              return;
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result));
          },
          (error) => {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            body = '';
            res.end(JSON.stringify({ error: error.message }));
          }
        );
      } catch (error) {
        console.error(error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        body = '';
        res.end(JSON.stringify({ error: error.message }));
      }
    });
  });

  await new Promise(
    (resolve, reject) => server.listen(
      0, '127.0.0.1',
      err => err ? reject(err) : resolve()
    )
  );

  return server;
}


export async function setupMockJSONServer() {
  const apiRequest = vi.fn();
  let resolveRequest = null;

  apiRequest.mockReturnValue(new Promise((resolve) => {
    resolveRequest = resolve;
  }));

  const server = await mockJSONServer({ apiRequest });
  const endpoint = getServerAddress(server);

  return {
    endpoint,
    close() {
      return closeServer(server);
    },
    apiRequest,
    tryToCheckRequestCalled(count = 3) {
      return waitingExpectToBeTrue(
        () => apiRequest,
        (req) => {
          expect(req).toBeCalledTimes(1);
        },
        count
      );
    },
    async resolveRequest(...args) {
      resolveRequest(...args);
      // waiting mock ai server to process
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  };
}

export async function setupStreamServer() {
  const apiRequest = vi.fn();
  let resolveRequest = null;

  apiRequest.mockReturnValue(new Promise((resolve) => {
    resolveRequest = resolve;
  }));

  const server = http.createServer((req, res) => {
    req.pipe(fs.createWriteStream('/dev/null'));
    req.on('end', () => {
      try {
        const promise = apiRequest();

        promise.then(
          (stream) => {
            res.writeHead(200, { 'Content-Type': 'application/x-ndjson' });
            stream.pipe(res);
          },
          (error) => {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: error.message }));
          }
        );
      } catch (error) {
        console.error(error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
  });

  await new Promise(
    (resolve, reject) => server.listen(
      0, '127.0.0.1',
      err => err ? reject(err) : resolve()
    )
  );

  const endpoint = getServerAddress(server);

  return {
    endpoint,
    close() {
      return closeServer(server);
    },
    apiRequest,
    tryToCheckRequestCalled(count = 3) {
      return waitingExpectToBeTrue(
        () => apiRequest,
        (req) => {
          expect(req).toBeCalledTimes(1);
        },
        count
      );
    },
    async resolveRequest(...args) {
      resolveRequest(...args);
      // waiting mock ai server to process
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  };
}