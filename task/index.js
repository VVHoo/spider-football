const schedule = require('node-schedule')
const getData = require('./get-data')
const config = require('../config')
async function startTask () {
  schedule.scheduleJob(config.TRIGGER_TIME, async () => {
    getData()
  })
}

module.exports = startTask
