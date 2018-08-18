const fs = require("fs")
const path = require('path')

var Koa = require('koa')
var Router = require('koa-router')
const login = require("facebook-chat-api")
const koaBody = require('koa-body')
const axios = require('axios')
const download = require('image-downloader')

var app = new Koa()
var router = new Router()

router.get('/', (ctx, next) => {
  ctx.body = "Welcome to Gifur <3"
})

router.post('/login', koaBody(), (ctx, next) => {
  const { email, password } = ctx.request.body
  login({email, password}, (err, api) => {
    if(err) return console.log(err)

    const userId = api.getCurrentUserID()
    fs.writeFileSync(`states/${userId}.json`, JSON.stringify(api.getAppState()));
  });
  ctx.body = 'Login'
})

router.post('/send-message', koaBody(), (ctx, next) => {
  const { userSendId, userRecievedId, imageName } = ctx.request.body

  login({appState: JSON.parse(fs.readFileSync(path.resolve(__dirname, `../states/${userSendId}.json`), 'utf8'))}, (err, api) => {
    if(err) return console.error(err)
    const message = {
      attachment: fs.createReadStream(path.resolve(__dirname, `../public/images/${imageName}`))
    }
    api.sendMessage(message, userRecievedId)
  })
  ctx.body = 'Message'
})

router.get('/import-image', async (ctx, next) => {
  const { albumName } = ctx.query
  
  const requestUrl = `https://api.imgur.com/3/album/${albumName}`
  const options = {
    method: 'GET',
    headers: { 
      "Content-Type": "application/json; charset=utf-8",
      "Authorization": "Client-ID 8199676913db8bf"
    },
    url: requestUrl,
  };
  try {
    const response = await axios(options);
    const listImage = response.data.data.images
    const a = listImage.map(image => {
      return downloadIMG({
        url: image.link,
        dest: path.resolve(__dirname, '../public/images')
      })
    })
    
    Promise.all(a).then(data => {
      ctx.body = data
    })
    return ctx.body
  } catch (error) {
    ctx.throw(400, error)
  }
})

app
  .use(router.routes())
  .use(router.allowedMethods());

module.exports = app;

async function downloadIMG(options) {
  try {
    const { filename, image } = await download.image(options)
    console.log(filename)
  } catch (e) {
    console.error(e)
  }
}
