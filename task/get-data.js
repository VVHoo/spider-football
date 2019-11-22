const dayjs = require('dayjs')
const sendEmail = require('../utils/sendEmail')
const puppeteer = require('puppeteer');
const url = 'http://m.win007.com/';

// 抓取数据
let detailSpider = async (page) => {
  if (await page.$('#OuTb')) {
    const target = await page.evaluate(() => {
      let nodes = document.querySelectorAll('#OuTb td')
      let beginTime = document.querySelectorAll('.league')[0].innerHTML
      let homeName = document.querySelectorAll('#homeName > span')[0].innerText
      let guestName = document.querySelectorAll('#guestName .name')[0].innerText
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
      await calculateLine(target)
    }
    await page.close()
    await page.waitFor(500)
  } else {
    page.close()
  }
}

let calculateLine = async (info) => {
  let { score, daContent, beginTime, homeName, guestName } = info
  let totalScore = parseInt(score.split('-')[0]) + parseInt(info.score.split('-')[1])
  let line = daContent.split('/').length === 2 ? 1.5 : 2
  let midTime = dayjs(beginTime).add('55', 'minute').unix()
  if (parseFloat(daContent.split('/')[0]) - totalScore <= line) {
    sendEmail({ homeName: homeName, guestName: guestName, score: score, daContent: daContent })
  }
}
async function getData () {
  console.log('begin spider')
  const browser = await puppeteer.launch({ headless: true })
  try {
    const page = await browser.newPage()
    await page.setCookie({
      "domain": "m.win007.com",
      "expirationDate": '1574130600',
      "name": "filterType",
      "path": "/",
      "sameSite": "unspecified",
      "storeId": "0",
      "value": "0!5!123",
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
    page.close()
    // const lists = [{id:1720825, href: 'http://m.win007.com/Analy/ShiJian/1720825.htm'}, {id: 1720823 ,href: 'http://m.win007.com/Analy/ShiJian/1720823.htm'}]
    for (let i = 0; i < lists.length; i++) {
      let page = await browser.newPage()
      await page.goto(lists[i].href, {
        waitUntil: 'networkidle0'
      })
      const oddData = await page.$('#ouOdds')
      oddData ? await detailSpider(page) : await page.close()
    }
    await browser.close()
  } catch (e) {
    console.log(e)
    await browser.close()
  }
}

module.exports = getData
