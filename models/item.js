const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var ItemSchema = new Schema({
    Credits: { type:Number , required: true ,default:40  },
    Coins: { type:Number , required: true ,default:60 },
    MinXP: { type:Number , required: true ,default:40000 },
});

const Item = mongoose.model('item', ItemSchema);

module.exports = Item;