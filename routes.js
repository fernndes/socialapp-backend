const express = require('express')
const { celebrate, Joi, Segments } = require('celebrate');

const auth = require('./src/utils/fbAuth')

const multer = require("multer")
const imgUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024
    }
})

const PostController = require('./src/controllers/PostController')
const SessionController = require('./src/controllers/SessionController')
const UserController = require('./src/controllers/UserController')

const messageError = {
    'string.empty': 'Field cant be empty!',
    'any.required': 'This is a required field',
    'string.min': 'Field should have a minimum length of {#limit}',
    'string.max': 'Field should have a max length of {#limit}'
}

const routes = express.Router()

routes.get('/posts', auth.fbAuth, PostController.getAllPosts)

routes.post('/post', auth.fbAuth, celebrate({
    [Segments.BODY]: Joi.object().keys({
        body: Joi.string().min(12).required()
    })
}), PostController.makeOnePost)

routes.post('/signup', celebrate({
    [Segments.BODY]: Joi.object().keys({
        username: Joi.string().alphanum().min(6).max(12).required().messages(messageError),
        password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{8,30}$')).required().messages(messageError),
        confirmPassword: Joi.ref('password'),
        email: Joi.string().email().required().messages(messageError)
    })
}), UserController.createAnAccount)

routes.post('/login', celebrate({
    [Segments.BODY]: Joi.object().keys({
        password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{8,30}$')).required().messages(messageError),
        email: Joi.string().email().required().messages(messageError)
    })
}), SessionController.startNewSession)

routes.post('/upload', auth.fbAuth, imgUpload.single('file'), UserController.uploadImage);

routes.post('/user', auth.fbAuth, celebrate({
    [Segments.BODY]: Joi.object().keys({
        bio: Joi.string().required().allow(null, '').messages(messageError),
        location: Joi.string().required().allow(null, '').messages(messageError)
    })
}), UserController.addUserDetails)

routes.get('/user', auth.fbAuth, UserController.getAuthenticatedUser)

routes.get('/user/:username', auth.fbAuth, UserController.getUserDetails)

routes.get('/post/:postId', auth.fbAuth, PostController.getAPost)

routes.post('/post/:postId/comment', auth.fbAuth, celebrate({
    [Segments.BODY]: Joi.object().keys({
        body: Joi.string().min(1).required()
    })
}), PostController.commentAPost)

routes.get('/post/:postId/like', auth.fbAuth, PostController.likeAPost)

routes.get('/post/:postId/unlike', auth.fbAuth, PostController.unlikeAPost)

routes.delete('/post/:postId', auth.fbAuth, PostController.deleteAPost)

module.exports = routes