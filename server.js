const express = require('express')
const session = require('express-session')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const MongoDBStore = require('connect-mongodb-session')(session);
const config = require('./config')
const IN_PROD = config.NODE_ENV === 'production'

const server = express()

const store = new MongoDBStore(
  {
    uri: config.MONGODB_URI,
    databaseName: config.MONGODB_NAME,
    collection: 'sessions'
  },
  function (err) {
    console.log('connect-mongodb-session error on initializing:  ' + err)
  });

store.on('error', function (err) {
  console.log('connect-mongodb-session error' + err)
});

server.use(bodyParser.urlencoded({ extended: false }))
server.use(bodyParser.json())
var options = {
  index: "spa.html"
  // dotfiles: 'ignore',
  // etag: false,
  // extensions: ['htm', 'html'],
  // index: false,
  // maxAge: '1d',
  // redirect: false,
  // setHeaders: function (res, path, stat) {
  //   res.set('x-timestamp', Date.now())
  // }
}
server.use(express.static('public', options))

server.use(session({
  name: config.SESSION_NAME,
  resave: false,
  saveUninitialized: false,
  secret: config.SESSION_SECRET,
  cookie: {
    maxAge: config.SESSION_LIFETIME,
    sameSite: true,
    secure: IN_PROD
  },
  store: store
}))

server.listen(config.PORT, () => {
  mongoose.set('useFindAndModify', false)  // set this to get rid of an annoying warning that shouldn't be coming up
  mongoose.connect(config.MONGODB_URI, { useNewUrlParser: true })
})

const db = mongoose.connection
db.on('error', (err) => console.log(err))
db.once('open', () => {
  require('./api_routes/userAuth')(server)
  require('./api_routes/userAppData')(server)
  console.log(`Server started on port ${config.PORT}. Web address http://localhost:${config.PORT}`)
})