const { model } = require('mongoose')
const ApiError = require('../common/apiErrors')
const AuthUserDTO = require('../dtos/authUserDTO')
const UserModel = require('../models/UserModel')
const { clearToken, generateToken } = require('./TokenService')
const bcrypt = require('bcrypt')
const fileStorage = require('../repositories/fileStorage')

class UserService {
    login = async (email, password) => {
        try {
            const user = await UserModel.findOne({ email })
            
            if (!user) {
                throw ApiError.Unauthorized()
            } 

            const isPasswordEqual = await bcrypt.compare(password, user.password)

            if (isPasswordEqual) {
                const tokens = await generateToken(user)
        
                return {
                    ...tokens, user: new AuthUserDTO(user)
                }
            } else {
                throw ApiError.BadRequest('Некорректный пароль')
            }
        } catch (e) {
            throw e
            throw ApiError.BadRequest('Failed to login')
        }
    }

    edit = async (id, { name, avatar }) => {
        try {
            let user = await this.getUser(id)
            const nameForChange = name !== undefined && name !== user.name ? name : user.name
            let avatarForChange = user.avatar

            console.log(avatar)
    
            if (avatar !== undefined) {
                if (user.avatar) {
                    await fileStorage.deleteFile(user.avatar)
                }
              
                if (avatar !== null) {
                    avatarForChange = await fileStorage.saveFile(avatar)
                    console.log(avatarForChange)
                } else {
                    avatarForChange = null
                }
            }
    
            await user.updateOne({
                $set: {
                    name: nameForChange,
                    avatar: avatarForChange
                }
            })

            return {
                ...user,
                name: nameForChange,
                avatar: avatarForChange
            }
        } catch (e) {
            throw e
        }
        
    }

    register = async (email, name, password) => {
        try {
            const existedUser = await UserModel.findOne({ email })

            if (existedUser) {
                throw ApiError.BadRequest('This user is already exist')
            }

            const hashPassword = await bcrypt.hash(password, 3)
    
            const user = UserModel({ email, name, password: hashPassword, registerDate: Date.now() })
            await user.save()
           
            const tokens = await generateToken(user)
            return {
                ...tokens,
                user: new AuthUserDTO(user)
            }            
        } catch (e) {
            throw e
            throw ApiError.BadRequest('Failed to register')
        }
    }

    logout = async (id) => {
        try {
            await clearToken(id)
        } catch (e) {
            throw e
        }
    }

    getUser = async (id) => {
        try {
            const user = await UserModel.findById(id)

            if (user) {
                return user
            }

            throw NotFound()
        } catch(e) {
            throw ApiError.BadRequest('Failed to get user')
        }
    }
}


module.exports = new UserService()