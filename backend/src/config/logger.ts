import pino from 'pino';
import pretty from 'pino-pretty';

const transport = pretty({
  colorize: true,
  translateTime: 'SYS:standard',
  ignore: 'pid,hostname',
});

const logger = pino(transport);

export default logger;
