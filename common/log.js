var log4js = require('log4js');
log4js.configure({
    appenders: {
        cheeseLogs: { type: 'file', filename: '../logs/log.log' },
        console: { type: 'console' }
    },
    categories: {
        default: { appenders: ['console', 'cheeseLogs'], level: 'info' }
    }
});


var dateFileLog = log4js.getLogger('dateFileLog');

function connect (){
    return log4js.connectLogger(dateFileLog, {level:'info', format:':method :url'})
}

module.exports = {

    logger:dateFileLog,
    connect:connect
}