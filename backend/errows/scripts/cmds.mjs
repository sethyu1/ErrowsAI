import bootstrap from './bootstrap.mjs';
import migration from './migration/cmds.mjs';
import character from './character/cmds.mjs';
import payment from './payment/cmds.mjs';
import oauth from './oauth/cmds.mjs';
import user from './user/cmds.mjs';
import v1 from './v1/cmds.mjs';
import ops from './ops/cmds.mjs';

const commands = [
  bootstrap,
  migration,
  character,
  payment,
  oauth,
  user,
  v1,
  ops
];

export default commands;