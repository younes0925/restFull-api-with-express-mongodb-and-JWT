const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var ClanRequestSchema = new Schema({
    clan: { type: String, required: true},
    receiver: { type: String, required: true},
});

const ClanRequest = mongoose.model('clanRequestSchema', ClanRequestSchema);

module.exports = ClanRequest;