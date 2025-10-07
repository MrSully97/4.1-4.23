const __ = require('lodash')

const dummy = (blogs) => {
    return 1
}

const totalLikes = (blogs) => {
    const likes = blogs.reduce((sum, blog) => {
        return sum + blog.likes
    }, 0)
    return likes
}

const favoriteBlog = (blogs) => {
    const mostLiked = blogs.reduce((greatestLikes, blog) => {
        if (greatestLikes.likes) {
            return greatestLikes.likes < blog.likes ? greatestLikes = blog : greatestLikes
        }
        else {
            return blog
        }
    }, {})

    return mostLiked
}

const mostBlogs = (blogs) => {
    if (blogs.length === 0) return {}
    const result = __(blogs).countBy('author').toPairs().maxBy(1)
    return {author: result[0], blogs: result[1]}
}

const mostLikes = (blogs) => {
    if (blogs.length === 0) return {}
    const result =__(blogs)
        .groupBy('author')
        .map((authorBlogs, author) => ({
            author,
            likes: __.sumBy(authorBlogs, 'likes')
        }))
        .maxBy('likes')

    return result
}

module.exports = {
    dummy,
    totalLikes,
    favoriteBlog,
    mostBlogs,
    mostLikes
}