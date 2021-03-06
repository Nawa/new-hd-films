'use strict';

var winston = require('winston');

function getLogger(module) {
  var path = module.filename.split('/').slice(-2).join('/');
  return new winston.Logger({
    transports: [
      new winston.transports.Console({
        colorize: true,
        //level: ENV == "development" ? 'debug' : "error",
        level: 'debug',
        label: path
      })
    ]
  });
}

module.exports = getLogger;