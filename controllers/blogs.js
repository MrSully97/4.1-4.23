const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const User = require('../models/user')
const { userExtractor } = require('../utils/middleware')

blogsRouter.get('/', async (request, response) => {
    const blogs = await Blog.find({}).populate('user', { username: 1, name: 1 })
    response.json(blogs)
})

blogsRouter.post('/', userExtractor, async (request, response) => {
    const body = request.body

    const user = request.user

    const blog = new Blog({
        title: body.title,
        author: body.author,
        url: body.url,
        likes: body.likes || 0,
        user: user._id
    })

    const savedBlog = await blog.save()
    user.blogs = user.blogs.concat(savedBlog._id)
    await user.save()
    
    response.status(201).json(savedBlog)
})

blogsRouter.delete('/:id', userExtractor, async (request, response) => {
    const blogId = request.params.id
    const blogToDelete = await Blog.findById(blogId)
    
    const user = request.user

    if (!blogToDelete) {
        response.status(204).end()
    }

    // Check if logged in user matches blog post user id
    if (user.id === blogToDelete.user[0]._id.toString()) {
        await Blog.findByIdAndDelete(blogId)
        response.status(204).end()
    }
    else {
        return response.status(401).json({ error: 'logged in userId does not match blog post userId'})
    }
})

blogsRouter.put('/:id', async (request, response) => {
    const id = request.params.id
    const body = request.body

    const updatedBlog = await Blog.findByIdAndUpdate(
        id,
        body,
        { new: true, runValidators: true, context: 'query' }
    )

    if (!updatedBlog) {
        return response.status(404).json({ error: 'Blog not found' })
    }

    response.json(updatedBlog)
})

module.exports = blogsRouter