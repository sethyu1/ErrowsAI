import { parse } from 'date-fns';

export const builder = {
  data_dir: {
    type: 'string',
    demandOption: true,
    describe: 'Path to v1 data directory'
  }
};

export function convert2PositiveInt(str) {
  if (str === '') {
    return 0;
  }

  const val = parseInt(str, 10);
  if (isNaN(val)) {
    throw new Error(`Failed to convert to int: ${str}`);
  }
  return Math.max(val, 0);
}

export function formatDate(str) {
  if (str === "") {
    return new Date();
  }

  return parse(str, 'yyyy-MM-dd HH:mm:ss', new Date());
}