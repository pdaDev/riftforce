const { Schema, model } = require('mongoose')

const userSchema = new Schema({ 
    email: { type: String, unique: true, required: true },
    name: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    isActivated: { type: Boolean, default: true },
    isAdmin: { type: Boolean, default: false },
    rating: { type: Number, default: 0 },
    avatar: { type: String, nullable: true, default: null },
    registerDate: { type: Number, required: true }
})

module.exports = model('User', userSchema)