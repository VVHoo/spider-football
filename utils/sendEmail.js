// 引入发送邮件的类库
/*
* mail_host="smtp.qq.com"  #设置服务器
                mail_user="327107942@qq.com"    #用户名
                mail_pass="stwabobezufxbigd"   #口令
                sender = '327107942@qq.com'
                receivers = ['770822273@qq.com','396857323@qq.com','zsxinwenhui@163.com']

                contentStr = homename+' VS '+guestname+' score: '+scoreContent+' data: '+daContent*/
// 发送邮件逻辑
const nodemailer = require('nodemailer')
// 创建一个SMTP客户端配置
const receivers = ['770822273@qq.com', 'zsxinwenhui@163.com', '396857323@qq.com', '827583114@qq.com']
const emailConfig = {
  host: 'smtp.qq.com',
  port: 465,
  auth: {
    user: '327107942@qq.com', // 邮箱账号
    pass: 'stwabobezufxbigd' // 邮箱的授权码
  }
}
// 创建一个SMTP客户端对象
const transporter = nodemailer.createTransport(emailConfig)

async function sendEmail (data) {
  let content = data.shot ? `id: ${data.id}, ${data.homeName} VS ${data.guestName}, score: ${data.score}, daContent: ${data.daContent}, 射门: ${data.shot}, 射正: ${data.shotPositive}` : `id: ${data.id},  ${data.homeName} VS ${data.guestName}, score: ${data.score}, daContent: ${data.daContent}`
  let mail = {
    // 发件人
    from: '来自cloud <327107942@qq.com>',
    // 主题
    subject: 'info',
    // 收件人
    to: receivers.join(','),
    // 邮件内容，text或者html格式
    text: content
  }
  let res = await transporter.sendMail(mail)
}

module.exports = sendEmail
