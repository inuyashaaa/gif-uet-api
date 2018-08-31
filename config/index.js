'use strict'

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}
module.exports = Object.freeze({
  app: {
    secret: process.env.SECRET_KEY
  }
})
