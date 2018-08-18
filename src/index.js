const fs = require("fs")
const path = require('path')

var Koa = require('koa')
var Router = require('koa-router')
const login = require("facebook-chat-api")
const koaBody = require('koa-body')

var app = new Koa();
var router = new Router();

router.get('/', (ctx, next) => {
  ctx.body = "Welcome to Gifur <3"
})

router.post('/login', koaBody(), (ctx, next) => {
  const { email, password } = ctx.request.body
  login({email, password}, (err, api) => {
    if(err) return console.log(err)

    const userId = api.getCurrentUserID()
    fs.writeFileSync(`${userId}.json`, JSON.stringify(api.getAppState()));
  });
  ctx.body = 'Login'
})

router.post('/send-message', koaBody(), (ctx, next) => {
  const { userSendId, userRecievedId, imageName } = ctx.request.body
  login({appState: JSON.parse(fs.readFileSync(`${userSendId}.json`, 'utf8'))}, (err, api) => {
    if(err) return console.error(err)
    const manhID = "100004030405392"
    const message = {
      attachment: fs.createReadStream(path.resolve(__dirname, `../public/images/${imageName}`))
    }
    api.sendMessage(message, userRecievedId)
  })
  ctx.body = 'Message'
})

app
  .use(router.routes())
  .use(router.allowedMethods());

module.exports = app;
