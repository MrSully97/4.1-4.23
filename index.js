const app = require('./app')
const { info } = require('./utils/logger')
const config = require('./utils/config')

app.listen(config.PORT, () => {
    info(`Server running on Port ${config.PORT}`)
})