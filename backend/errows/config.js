import config from 'config';

const { broker, metrics } = config;
export default Object.assign({}, broker, { metrics });