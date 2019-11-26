const path = require('path')
const fs = require('fs')

let writeFile = (fileName, data, stringify = true) => {
  const filePath = path.resolve(__dirname, '../data', fileName)
  if (stringify) {
    fs.writeFileSync(filePath, JSON.stringify(data))
  } else {
    fs.writeFileSync(filePath, data)
  }
}

module.exports = writeFile
