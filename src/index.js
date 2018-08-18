const fs = require("fs")

var Koa = require('koa')
var Router = require('koa-router')
const login = require("facebook-chat-api")

var app = new Koa();
var router = new Router();

router.get('/', (ctx, next) => {
  ctx.body = "Welcome to Gifur <3"
})
router.get('/login', (ctx, next) => {
    login({email: "FB_EMAIL", password: "FB_PASSWORD"}, (err, api) => {
        if(err) return console.error(err);
    
        fs.writeFileSync('appstate.json', JSON.stringify(api.getAppState()));
    });
})
router.get('/send-message', (ctx, next) => {
  ctx.body = "Welcome to Gifur <3"
  login({appState: JSON.parse(fs.readFileSync('appstate.json', 'utf8'))}, (err, api) => {
    if(err) return console.error(err)

    var manhID = "100004030405392"
    var msg = {
      attachment: fs.createReadStream(__dirname + '../manh2.png')
      // url: "https://i.imgur.com/z7TcWyP.gif"
    }
    api.sendMessage(msg, manhID)
  })
})

app
  .use(router.routes())
  .use(router.allowedMethods());

module.exports = app;
