const winston = require('winston')

const path = require('path')
const pastaLog = path.resolve(__dirname, '../logs')

const logLevels = {
    critical: 0,
    error: 1,
    warning: 2,
    connection: 3,
    desconnection: 4,
    info: 5,
    trace: 6,
}

const serverLogger = winston.createLogger({
    levels: logLevels,
    level: process.env.LOG_LEVEL,
    format: winston.format.combine(winston.format.timestamp({format: 'DD-MM-YYYY hh:mm:ss A'}), winston.format.json()),
    transports: [new winston.transports.File({ filename: path.join(pastaLog, 'server.log') })],
    defaultMeta: { service: "server-service" }
})

const clientLogger = winston.createLogger({
    levels: logLevels,
    level: process.env.LOG_LEVEL,
    format: winston.format.combine(winston.format.timestamp({format: 'DD-MM-YYYY hh:mm:ss A'}), winston.format.json()),
    transports: [
        new winston.transports.File({ filename: path.join(pastaLog, 'client.log') })
    ],
    defaultMeta: { service: "client-service" }
})

module.exports = {
    serverLogger,
    clientLogger
}