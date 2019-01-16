
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var ClanSchema = new Schema({
    ClanName: { type:String , required: true },
    ClanTag: { type:String , required: true },
    Owner: { type:String , required: true },
    Members: { type:Array , required: true },
});

const Clan = mongoose.model('clan', ClanSchema);

module.exports = Clan;