const dayjs = require('dayjs')
const sendEmail = require('../utils/sendEmail')
const saveData = require('../utils/saveDataToFile')
const readData = require('../utils/readFileData')
const fs = require('fs')
const puppeteer = require('puppeteer');
const url = 'http://m.win007.com/';
let matchedData = {}

// 抓取数据
const detailSpider = async (page, id) => {
  if (await page.$("#OuTb")) {
    const target = await page.evaluate(() => {
      const dateNode = document.querySelectorAll(".league")[0].innerHTML
      const beginTime = document.querySelectorAll(".league")[0].innerText
      const homeName = document.getElementById("homeName").querySelector("span").innerText
      const guestName = document.getElementById("guestName").querySelector("span").innerText
			const homeScore = document.getElementById("homeScore") ? document.getElementById("homeScore").innerText : "";
			const guestScore = document.getElementById("guestScore") ? document.getElementById("guestScore").innerText : "";
      // 获取大小球盘口
      const tdList = document.querySelectorAll("#OuTb td");
      const targetTd = Array.from(tdList).find((item) => {
        return item.innerText === "未";
      });
      if (!targetTd) {
        return
      }
      const targetNode = targetTd.parentNode.lastChild;
      const targetContent = targetNode.querySelector(".realOdds.red").innerText;
      const needCalculate = targetContent.split('/').length === 2
      let handicap = targetContent
      if (needCalculate) {
        const [left, right] = targetContent.split('/')
        handicap = (Number(left) + Number(right)) / 2
      }
      return {
				time: `时间：${beginTime}`,
				teamInfo: `主客队：${homeName}(分数：${homeScore}) : ${guestName}(分数：${guestScore})`,
				handicap,
        clearTime: dateNode.split("&nbsp;")[1]
			}
    });
    if (target && target.time) {
      const midTime = dayjs(`${dayjs().year()}-${target.clearTime}:00`).unix()
      // filterSaveData(target)
      if (dayjs().add(65, 'minute').unix() > midTime && Number(target.handicap) <= 3) {
        await calculateLine(target, id);
      }
    }
    await page.close();
    await page.waitFor(500);
  } else {
    await page.close();
  }
}

const calculateLine = async (info, id) => {
  const { time, teamInfo, handicap } = info
  const saveData = { time, teamInfo, handicap: `大小球盘口: ${handicap}` }
  matchedData[id] = saveData
  await sendEmail(saveData)
}

const filterSaveData = (datas) => {
  let fileName = `${dayjs().year()}-${dayjs().month() + 1}-${dayjs().date()}.json`
  if (fs.existsSync(`/data/${fileName}.json`)) {
    // 对象属性访问最快
    readData(fileName, (games) => {
      let filterData = games
      for (let key in datas) {
        if (games[key]) {
          if (datas[key]['time'] !== filterData[key]['time']) {
            filterData[key]['time'] = datas[key]['time']
          }
          if (datas[key]['teamInfo'] !== filterData[key]['teamInfo']) {
            filterData[key]['teamInfo'] = datas[key]['teamInfo']
          }
          if (datas[key]['handicap'] !== filterData[key]['handicap']) {
            filterData[key]['handicap'] = datas[key]['handicap']
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
        waitUntil: 'networkidle0',
        timeout: 0
      });
      await getCookiePage.click('.more2 > div:last-child')
      await getCookiePage.click('#ul_filter li:nth-child(2)')
      await getCookiePage.click('#selectAllBtn')
      await getCookiePage.click('#filterBar > .btn')
      const cookies = await getCookiePage.cookies()
      const filterType = cookies.filter(item => item.name === 'filterType')[0].value
      await getCookiePage.close()
      const page = await browser.newPage()
      await page.setDefaultNavigationTimeout(0);
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
        waitUntil: 'networkidle0',
        timeout: 0
      });
      await page.waitForSelector('.MList .match')
      const lists = await page.evaluate(() => {
        let itemList = document.querySelectorAll('.MList .match')
        let hrefArr = []
        for (let i = 0; i < itemList.length; i++) {
          let id = itemList[i].id.split('_')[1]
          const time = itemList[i].querySelector('.time').innerText
          hrefArr.push({
            id: id,
            href: `http://m.win007.com/Analy/ShiJian/${id}.htm`,
            time
          })
        }
        return hrefArr
      })
      await page.close()
      for (let i = 0; i < lists.length; i++) {
        let page = await browser.newPage()
        let id = lists[i].id
        console.log(lists[i].href)
        await page.goto(lists[i].href, {
          waitUntil: 'networkidle0'
        })
        const oddData = await page.$('#ouOdds')
        oddData ? await detailSpider(page, id, lists[i].time) : await page.close()
      }
      // 保存符合条件的数据
      // if (Object.keys(matchedData).length) {
      //   filterSaveData(matchedData)
      // }
      await browser.close()
    } catch (e) {
      console.log(e)
    } finally {
      // 最后要退出进程
      process.exit(0)
    }
  })
}

module.exports = getData
