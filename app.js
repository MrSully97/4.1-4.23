const express = require('express')
const mongoose = require('mongoose')
const { PORT, MONGODB_URI } = require('./utils/config')
const logger = require('./utils/logger')
const middleware = require('./utils/middleware')
const blogsRouter = require('./controllers/blogs')
const usersRouter = require('./controllers/users')
const loginRouter = require('./controllers/login')

const app = express()

logger.info(`Connecting to ${MONGODB_URI}`)

mongoose
    .connect(MONGODB_URI)
    .then(() => {
        logger.info('Connected to MongoDB')
    })
    .catch(error => {
        logger.error('Error connecting to MongoDB:', error.message)
    })

// app.use(express.static('dist'))
app.use(express.json())
app.use(middleware.requestLogger)
app.use(middleware.tokenExtractor)

app.use('/api/login', loginRouter)
app.use('/api/blogs', blogsRouter)
app.use('/api/users', usersRouter)

app.use(middleware.unknownEndpoint)
app.use(middleware.errorHandler)

module.exports = app
