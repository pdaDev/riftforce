const { Router, urlencoded } = require("express")
const userController = require('./../ocntrollers/UserController')
const authed = require('../middlewares/AuthedReuqestsMiddleware')
const multer  = require('multer')
const upload = multer()
const userRouter = new Router()


userRouter.post('/login', userController.login)
userRouter.post('/register', userController.register)
userRouter.get('/logout', authed, userController.logout)
userRouter.get('/refresh', authed, userController.refresh)
userRouter.get('/me', authed, userController.authme)
userRouter.patch('/me', authed, upload.fields([{ name: 'avatar', maxCount: 1 }]), userController.edit)

module.exports = userRouter
