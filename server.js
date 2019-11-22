const Koa = require('koa')
const app = new Koa()
const task = require('./task')


app.listen(3000, async () => {
  task()
})
