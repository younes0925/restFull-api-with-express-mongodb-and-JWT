
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var UserSchema = new Schema({
    email: { type: String, required: true, index: { unique: true } },
    isVerified: { type: Boolean, default: false },
    password: { type: String, required: true },
    username: { type: String, required: true ,unique : true ,dropDups: true },
    Economy: {
        Credits: { type:Number , required: true ,  default:500  },
        Coins:   { type: Number, required: true  , default: 1000},
    } ,
    Stats: {
        XP: { type:Number , required: false },
        kills: { type: Number, required: false },
        deaths: { type: Number, required: false }
    },
    AdminRequests: {
        Banned: {
            Expiry:{ type:Date , required: false }
        }
    },
    Friends:  { type: [String], required: false},
    Purchased:  { type: [String], required: false},
    Clan:  { type: String, required: false ,default: null},
    Token:  { type: String, required: false}
});

const User = mongoose.model('user', UserSchema);

module.exports = User;
