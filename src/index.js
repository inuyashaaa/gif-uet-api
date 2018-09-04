const fs = require("fs")
const path = require('path')
const readline = require("readline")
const CryptoJS = require("crypto-js")
const { app: { secret }} = require('../config')

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const Koa = require('koa')
const Router = require('koa-router')
const login = require("facebook-chat-api")
const koaBody = require('koa-body')
const axios = require('axios')
const download = require('image-downloader')

const app = new Koa()
const router = new Router()

router.get('/', (ctx, next) => {
  ctx.body = "Welcome to Gifur <3"
})

let clientApi = [];

router.post('/login', koaBody(), (ctx, next) => {
  const { email, password } = ctx.request.body
  login({email, password},{forceLogin: true}, (err, api) => {
    if(err) {
      switch (err.error) {
        case 'login-approval':
          console.log('Enter code > ');
          rl.on('line', (line) => {
            err.continue('');
            rl.close();
          });
          break;
        default:
          console.error(err);
      }
      return;
    }
    const userId = api.getCurrentUserID()
    fs.writeFileSync(`states/${userId}.json`, JSON.stringify(api.getAppState()));
    clientApi[userId] = api;
  });
  ctx.body = 'Login success'
})

router.post('/send-message', koaBody(), (ctx, next) => {
  const { key = '' } = ctx.request.body
  if (!key) {
    ctx.throw(400, "Can not get data!!!")
    return
  }
  const nothingToSay = secret
  
  const dataFromClient = JSON.parse(CryptoJS.AES.decrypt(key, nothingToSay).toString(CryptoJS.enc.Utf8))
  const {userSendId, userRecievedId, imageName} = dataFromClient
  if (clientApi && clientApi[userSendId]) {
    const message = {
      attachment: fs.createReadStream(path.resolve(__dirname, `../public/images/${imageName}`))
    }
    clientApi[userSendId].sendMessage(message, userRecievedId)
  } else {
    login({appState: JSON.parse(fs.readFileSync(path.resolve(__dirname, `../states/${userSendId}.json`), 'utf8'))}, (err, api) => {
      if(err) return console.error(err)
      const message = {
        attachment: fs.createReadStream(path.resolve(__dirname, `../public/images/${imageName}`))
      }
      api.sendMessage(message, userRecievedId)
      clientApi[userSendId] = api;
      
    })
  }
  ctx.body = "Send message success"
  return
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
  .use(router.allowedMethods())

module.exports = app

async function downloadIMG(options) {
  try {
    const { filename, image } = await download.image(options)
    console.log(filename)
  } catch (e) {
    console.error(e)
  }
}
