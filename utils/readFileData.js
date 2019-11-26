const path = require('path')
const fs = require('fs')

function readData (fileName, cb) {
  if (fileName.split('.')[1] !== 'json') {
    cb()
    return
  }
  const filePath = path.resolve(__dirname, '../data', fileName)
  const data = JSON.parse(fs.readFileSync(filePath))
  cb(data)
}
module.exports = readData
