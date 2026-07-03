import { test as baseTest, vi } from 'vitest';
import { ServiceBroker } from 'moleculer';
import path from 'node:path';
import config from 'config';
import _ from 'lodash';
import { bootstrap, migrate, removeScope } from '../../scripts/index.mjs';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

export const test = baseTest.extend({
  // eslint-disable-next-line no-empty-pattern
  scope: [({}, use) => use(config.scope), { scope: 'file' }],
  schema: [
    async ({ scope }, use) => {
      vi.spyOn(config, 'scope', 'get').mockReturnValue(scope);
      await use(scope);
    },
    { scope: 'file' }
  ],
  services: [
    ['api'],
    { scope: 'file' }
  ],
  broker: [
    async ({ schema, services }, use) => {
      const broker = new ServiceBroker(config.broker);

      for (const nameOrSetting of services) {
        if (typeof nameOrSetting === 'string') {
          const servicePath = path.resolve(
            __dirname, '..', '..', 'services', `${nameOrSetting}.service.mjs`
          );
          const { default: service } = await import(servicePath);
          broker.createService(service);
          continue;
        }
        broker.createService(nameOrSetting);
      }

      await bootstrap({ schema });
      await migrate({ schema });
      await broker.start();

      await use(broker);

      await removeScope({ schema });
      await broker.stop();
    },
    { scope: 'file' }
  ],
  apiService: [
    async ({ broker }, use) => {
      const service = broker.getLocalService('api');
      service.routes.forEach(
        route => route.opts.autoAliases
          && service.regenerateAutoAliases(route)
      );

      await use(service);
    },
    { scope: 'file' }
  ],
  server: [
    async ({ apiService }, use) => {
      await use(apiService.server);
    },
    { scope: 'file' }
  ]
});