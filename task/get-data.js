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
  if (parseFloat(daContent.split('/')[0]) - totalScore >= line && midTime >= dayjs().unix()) {
    sendEmail({ homeName: homeName, guestName: guestName, score: score, daContent: daContent })
  }
}
async function getData () {
  console.log('begin spider')
  puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] }).then(async browser => {
    try {
      const page = await browser.newPage()
      await page.setCookie({
        "domain": "m.win007.com",
        "expirationDate": '1574130600',
        "name": "filterType",
        "path": "/",
        "sameSite": "unspecified",
        "storeId": "0",
        "value": "0!31!8!11!60!60!60!60!37!9!9!12!12!12!12!12!12!12!12!5!10!17!17!17!17!17!17!17!17!17!17!7!6!6!119!137!30!70!273!279!279!279!292!292!292!415!415!140!40!33!693!1416!1416!1416!1416!203!203!203!203!203!203!203!203!203!1421!573!573!573!138!128!128!128!128!128!121!121!165!221!221!221!221!129!290!290!170!124!358!358!358!217!135!130!133!131!240!240!240!240!240!315!321!321!740!740!740!332!332!332!332!341!354!354!391!450!450!450!469!533!613!745!423!41!587!587!722!722!950!950!950!950!950!950!950!950!950!677!677!837!837!837!837!837!1106!476!476!476!896!896!915!927!927!967!967!969!1000!1000!729!729!1062!1062!1062!1062!1062!1062!1405!1405!1116!1122!1122!399!399!1138!1138!1160!1169!1227!1227!1272!1272!1272!1411!1412!1457!1461!1466!1466!1479!1514!1514!1533!1533!1539!1558!1558!1558!1558!1558!1558!1558!1558!1558!1558!1558!1558!1558!1562!1562!1567!1583!1583!1583!1583!1583!1583!1593!1593!1599!1599!1604!1609!1612!1620!1620!1620!1620!1620!1620!1620!1620!1620!1623!1623!1634!1634!1634!1634!1634!1634!1634!1634!1634!1634!1641!1641!1641!1641!1641!1641!1641!1641!1641!1641!1641!1641!1641!1641!1641!1641!1641!1641!1641!1641!1655!1655!1682!1682!1683!1729!1750!1768!1817!1817!1820!1834!1834!1834!1834!1834!1840!1840!1840!1840!1866!1866!1957!2045!2045!2045!2051!2051!2051!2066!2066!2066!2066!2070!2070!2070!2070!2070!2074!2074!441",
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
  })
}

module.exports = getData
