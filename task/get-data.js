const dayjs = require('dayjs')
const sendEmail = require('../utils/sendEmail')
const saveData = require('../utils/saveDataToFile')
const readData = require('../utils/readFileData')
const fs = require('fs')
const puppeteer = require('puppeteer');
const url = 'http://m.win007.com/';
// let matchedData = {}

// 抓取数据
let detailSpider = async (page, id) => {
  if (await page.$('#OuTb')) {
    const target = await page.evaluate(() => {
      let nodes = document.querySelectorAll('#OuTb td')
      let beginTime = document.querySelectorAll('.league')[0].innerHTML
      let homeName = document.querySelectorAll('#homeName > marquee').length ? document.querySelectorAll('#homeName > marquee').innerText : document.querySelectorAll('#homeName > span')[0].innerText
      let guestName = document.querySelectorAll('#guestName > marquee').length ? document.querySelectorAll('#guestName > marquee').innerText : document.querySelectorAll('#guestName .name')[0].innerText
      const timeText = `${new Date().getFullYear()}-${beginTime.replace(/&nbsp;/ig, ',').split(',')[1]}`;
      let info = {}
      for (let i in nodes) {
        if (nodes[i].innerHTML === '中') {
          info = {
            score: nodes[i].nextSibling.textContent,
            daContent: nodes[i].parentNode.lastChild.childNodes[1].textContent,
            beginTime: timeText,
            homeName: homeName,
            guestName: guestName
          }
        }
      }
      return info
    })
    if (target.score) {
      calculateLine(target, id)
    }
    await page.close()
    await page.waitFor(500)
  } else {
    await page.close()
  }
}

let calculateLine = (info, id) => {
  let { score, daContent, beginTime, homeName, guestName } = info
  let totalScore = parseInt(score.split('-')[0]) + parseInt(info.score.split('-')[1])
  let line = daContent.split('/').length === 2 ? 1.5 : 2
  let midTime = dayjs(beginTime).add('60', 'minute').unix()
  if (parseFloat(daContent.split('/')[0]) - totalScore >= line && midTime >= dayjs().unix()) {
    // matchedData[id] = { homeName: homeName, guestName: guestName, score: score, daContent: daContent }
    sendEmail({ homeName: homeName, guestName: guestName, score: score, daContent: daContent })
  }
}

let filterSaveData = (datas) => {
  let fileName = `${dayjs().year()}-${dayjs().month() + 1}-${dayjs().date()}.json`
  if (fs.existsSync(`/data/${fileName}.json`)) {
    // 对象属性访问最快
    readData(fileName, (games) => {
      let filterData = games
      for (let key in datas) {
        if (games[key]) {
          if (datas[key]['score'] !== filterData[key]['score']) {
            filterData[key]['score'] = datas[key]['score']
          }
          if (datas[key]['daContent'] !== filterData[key]['daContent']) {
            filterData[key]['daContent'] = datas[key]['daContent']
          }
        }
      }
      saveData(fileName, filterData)
    })
  } else {
    saveData(fileName, datas)
  }
}
async function getData () {
  puppeteer.launch({ args: ['--disable-gpu', '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] }).then(async browser => {
    try {
      const getCookiePage = await browser.newPage()
      await getCookiePage.goto(url, {
        waitUntil: 'networkidle0'
      });
      await getCookiePage.click('.more2 > div:last-child')
      await getCookiePage.click('#ul_filter li:nth-child(2)')
      await getCookiePage.click('#selectAllBtn')
      await getCookiePage.click('#filterBar > .btn')
      const cookies = await getCookiePage.cookies()
      const filterType = cookies.filter(item => item.name === 'filterType')[0].value
      await getCookiePage.close()
      const page = await browser.newPage()
      await page.setCookie({
        "domain": "m.win007.com",
        "expirationDate": '1574130600',
        "name": "filterType",
        "path": "/",
        "sameSite": "unspecified",
        "storeId": "0",
        "value": filterType,
        "id": '3'
      })
      await page.goto(url, {
        waitUntil: 'networkidle0'
      });
      await page.waitForSelector('.MList .match')
      const lists = await page.evaluate(() => {
        let itemList = document.querySelectorAll('.MList .match')
        let hrefArr = []
        for (let i = 0; i < itemList.length; i++) {
          let id = itemList[i].id.split('_')[1]
          hrefArr.push({
            id: id,
            href: `http://m.win007.com/Analy/ShiJian/${id}.htm`
          })
        }
        return hrefArr
      })
      await page.close()
      for (let i = 0; i < lists.length; i++) {
        let page = await browser.newPage()
        let id = lists[i].id
        await page.goto(lists[i].href, {
          waitUntil: 'networkidle0'
        })
        const oddData = await page.$('#ouOdds')
        oddData ? await detailSpider(page, id) : await page.close()
      }
      // 保存符合条件的数据
      // if (Object.keys(matchedData).length) {
      //   filterSaveData(matchedData)
      // }
      await browser.close()
    } catch (e) {
      console.log(e)
    }
  })
}

module.exports = getData
