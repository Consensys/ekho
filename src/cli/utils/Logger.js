const _ = require('lodash');
const chalk = require('chalk');

const debug = (context, message, ...optionalParams) => {
  if (process.env.DEBUG !== 'true') return;
  console.log(`${chalk.bgBlackBright.magentaBright.bold(`[${context}]`)} ${message}`, ...optionalParams);
};
const info = (context, message, ...optionalParams) => {
  console.log(`${chalk.bgBlackBright.greenBright.bold(`[${context}]`)} ${message}`, ...optionalParams);
};
const error = (context, message, ...optionalParams) => {
  console.log(`${chalk.bgBlackBright.redBright.bold(`[${context}]`)} ${message}`, ...optionalParams);
};
const logger = (context, importance, message, ...optionalParams) => {
  switch (importance) {
    case 'DEBUG':
      debug(context, message, ...optionalParams);
      break;
    case 'INFO':
      info(context, message, ...optionalParams);
      break;
    case 'ERROR':
      error(context, message, ...optionalParams);
      break;
    default:
      throw Error('Unexpecter ');
  }
};
const curriedLog = _.curry(logger);
exports.getLogger = context => {
  return {
    debug: curriedLog(context)('DEBUG'),
    info: curriedLog(context)('INFO'),
    error: curriedLog(context)('ERROR'),
  };
};
