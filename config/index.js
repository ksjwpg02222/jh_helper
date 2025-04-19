const configName = process.env.CONFIG || process.argv[2] || 'dev';

let config;
switch (configName) {
  case 'dev': {
    config = require('./dev-config.js');
    break;
  }
  case 'v': {
    config = require('./vlrus-config.js');
    break;
  }
  case 'ouat': {
    config = require('./ouat-config.js');
    break;
  }
  default:
    throw new Error(`無效的 config: ${configName}`);
}

module.exports = config;