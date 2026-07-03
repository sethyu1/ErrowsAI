import os from 'node:os';
import path from 'node:path';
import { Pool } from 'pg';
import { default as config } from 'config';
import { actions as roleActions } from './libs/roles.mjs';
import { actions as supportActions } from './libs/supports.mjs';
import {
  actions as configurationActions
} from './libs/configurations.mjs';
import {
  methods as opsEvents,
  actions as opsActions
} from './libs/ops.mjs';
import { opsActions as giftActions } from './libs/gifts.mjs';
import { ensureDir } from './libs/utils.mjs';
import { opsActions as pixelOpsActions } from './libs/pixel.mjs';


export default {
  name: 'ops',
  settings: {
    rest: '/',
    $noVersionPrefix: true
  },

  actions: {
    ...opsActions,
    ...roleActions,
    ...supportActions,
    ...configurationActions,
    ...giftActions,
    ...pixelOpsActions
  },

  methods: {
    ...opsEvents
  },

  async started() {
    this.temp_dir = path.join(os.tmpdir(), 'errows_ops_temp');
    await ensureDir(this.temp_dir);
    this.assets_dir = path.resolve(config.assets.uploadPath, 'assets');
    await ensureDir(this.assets_dir);
    this.pool = new Pool(config.pg);
  },

  async stopped() {
    await this.pool.end();
  }
};