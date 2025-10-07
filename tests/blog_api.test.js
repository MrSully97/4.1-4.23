const { test, describe, after, beforeEach } = require('node:test')
const assert = require('node:assert')
const mongoose = require('mongoose')
const supertest = require('supertest')
const Blog = require('../models/blog')
const User = require('../models/user')
const helper = require('./test_helper')
const bcrypt = require('bcrypt')
const app = require('../app')

const api = supertest(app)
let token

beforeEach(async () => {
    await Blog.deleteMany({})
    await User.deleteMany({})

    const passwordHash = await bcrypt.hash('password', 10)
    const user = new User({ username: 'tester', passwordHash })
    await user.save()

    const loginResponse = await api
      .post('/api/login')
      .send({ username: 'tester', password: 'password' })
      .expect(200)
    
    token = loginResponse.body.token

    const blogs = helper.initialBlogs.map(b => ({ ...b, user: user._id }))
    await Blog.insertMany(blogs)
})

describe('API Tests', () => {
    test('notes are returned as json', async () => {
        await api
          .get('/api/blogs')
          .expect(200)
          .expect('Content-Type', /application\/json/)
    })

    test('all notes are returned', async () => {
        const blogs = await api
          .get('/api/blogs')
          .expect(200)
          .expect('Content-Type', /application\/json/)
        
        assert.strictEqual(blogs.body.length, helper.initialBlogs.length)
    })

    test('check that id is in blog data object', async () => {
        const blogs = await api.get('/api/blogs')

        assert('id' in blogs.body[0])
    })

    test('a new valid blog can be added', async () => {
        const newBlog = {
            title: 'test',
            author: 'test',
            url: 'test.com',
            likes: 0
        }

        const result = await api
          .post('/api/blogs/')
          .set('Authorization', `Bearer ${token}`)
          .send(newBlog)
          .expect(201)
          .expect('Content-Type', /application\/json/)

        const blogsAtEnd = await helper.blogsInDb()
        assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length + 1)

        const titles = blogsAtEnd.map(e => e.title)
        assert(titles.includes('test'))
    })

    test('user with no token returns status 401 unauthorized', async () => {
        const newBlog = {
            title: 'test',
            author: 'test',
            url: 'test.com',
            likes: 0
        }

        await api
          .post('/api/blogs/')
          .send(newBlog)
          .expect(401)
          .expect('Content-Type', /application\/json/)
    })

    test('check if likes defaults to 0', async () => {
        const testBlog = new Blog({
            title: 'test',
            author: 'test',
            url: 'test.com'
        })
        
        assert.strictEqual(testBlog.likes, 0)
    })

    test('check for missing title/url', async () => {
        const testBlog = new Blog({
            author: 'test',
            likes: 0
        })
        await api
          .post('/api/blogs/')
          .set('Authorization', `Bearer ${token}`)
          .send(testBlog)
          .expect(400)
    })

    test('delete a valid blog', async () => {
        const blogsAtStart = await helper.blogsInDb()
        const blogToDelete = blogsAtStart[0]

        await api
          .delete(`/api/blogs/${blogToDelete.id}`)
          .set('Authorization', `Bearer ${token}`)
          .expect(204)

        const blogsAtEnd = await helper.blogsInDb()
        assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length - 1)

        const titles = blogsAtEnd.map(b => b.title)
        assert(!titles.includes(blogToDelete.title))
    })

    test('deleting non-existing blog statuscode 204', async () => {
        const invalidBlog = new Blog({
            title: 'fake',
            author: 'fake',
            url: 'fake.com',
            likes: 0,
            id: 1212121212121212
        }) 

        await api
          .delete(`/api/blogs/${invalidBlog.id}`)
          .set('Authorization', `Bearer ${token}`)
          .expect(204)
    })

    test('updating a blog', async () => {
        const blogsAtStart = await helper.blogsInDb()
        const blogToUpdate = { ...blogsAtStart[0] }
        
        const updatedBlog = { ...blogToUpdate, title: 'updatedTheBlog' }

        await api.put(`/api/blogs/${updatedBlog.id}`)
          .send(updatedBlog)
          .expect(200)
          .expect('Content-Type', /application\/json/)
        
        const blogsAtEnd = await helper.blogsInDb()
        const titles = blogsAtEnd.map(b => b.title)

        assert(titles.includes('updatedTheBlog'))
    })

    test('update returns statuscode 404 for invalid blog', async () => {
        const invalidId = await helper.nonExistingId()
        const invalidBlog = {
            title: 'test',
            author: 'test',
            url: 'test.com',
            likes: 0
        }

        await api.put(`/api/blogs/${invalidId}`)
            .send(invalidBlog)
            .expect(404)
    })
})

after(async () => {
    await mongoose.connection.close()
})