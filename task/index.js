const schedule = require('node-schedule')
const getData = require('./get-data')
async function startTask () {
  const rule = new schedule.RecurrenceRule();
  rule.second = [0, 20, 40]; // 每隔 10 秒执行一次
  schedule.scheduleJob(rule, async () => {
    getData()
  })
}

module.exports = startTask
