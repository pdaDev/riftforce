const { model, Schema }  = require('mongoose')

const roomSchema = new Schema({
    owner: { type: String, required: true },
    stage: { type: String, default: 'ROOM' },
    currentUsersCount: { type: Number, default: 1 },
    date: { type: Number, required: true },
    blackList: [String],
    administrators: [String],
    saved: [String],
    expireType: { type: String, default: 'CONSTANT' },
    teams: [{
         name: { type: String, nullable: true, default: null },
         users: [{
             id: { type: String, required: true },
             email: { type: String, required: true },
             name: { type: String, required: true },
             avatar: { type: String, nullable: true },
             rating: { type: Number, required: true },
             type: { type: String, required: true, default: "PLAYER" },
             ready: { type: Boolean, required: true, default: false },
         }]
    }],
    roomState: {
         name: { type: String, required: true } ,
         type: { type: String, default: 'PUBLIC' },
         password: { type: String, default: null, nullable: true },
         props: {
             withExtension: { type: Boolean, default: false },
             draftStages: { type: [String], default: ['PICK'] },
             playersCount: { type: Number, default: 2 }
         },
    }
 })


module.exports = model('Room', roomSchema)