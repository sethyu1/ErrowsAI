export default {
  command: 'oauth',
  describe: 'oauth ops',
  builder: (yargs) => yargs
  .commandDir('.', { excludes: ['cmd.mjs'] })
  .demandCommand()
  .help()
  .showHelpOnFail(true),
};