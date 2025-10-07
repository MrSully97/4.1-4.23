const { test, beforeEach, describe, after} = require('node:test')
const assert = require('node:assert')
const mongoose = require('mongoose')
const app = require('../app')
const supertest = require('supertest')
const User = require('../models/user')
const bcrypt = require('bcrypt')
const helper = require('../tests/test_helper')

const api = supertest(app)

describe('user api tests', () => {
    beforeEach(async () => {
        await User.deleteMany({})

        const passwordHash = await bcrypt.hash('sekret', 10)
        const user = new User({ username: 'root', name: 'superuser', passwordHash })

        await user.save()
    })

    test('invalid password in user creation is rejected with status 400', async () => {
        const newUser = {
            username: 'new user',
            name: 'new',
            password: '12'
        }

        const response = await api.post('/api/users/')
          .send(newUser)
          .expect(400)
          .expect('Content-Type', /application\/json/)

        assert(response.error.text.includes('password must be atleast 3 characters long'))
    })

    test('invalid username in user creation is rejected with status 400', async () => {
        const newUser = {
            username: '12',
            name: '12',
            password: '1234'
        }

        const response = await api.post('/api/users/')
          .send(newUser)
          .expect(400)
          .expect('Content-Type', /application\/json/)

        assert(response.error.text.includes("Path `username` (`12`, length 2) is shorter than the minimum allowed length (3)"))
    })

    test('a valid user can be added', async () => {
        const usersAtStart = await helper.usersInDb()

        const newUser = {
            username: 'newTestUser',
            name: 'newUser',
            password: "1234"
        }

        await api.post('/api/users/')
          .send(newUser)
          .expect(201)
          .expect('Content-Type', /application\/json/)

        const usersAtEnd = await helper.usersInDb()
        assert.strictEqual(usersAtEnd.length, usersAtStart.length + 1)
    })
})




after(async () => {
    await mongoose.connection.close()
})