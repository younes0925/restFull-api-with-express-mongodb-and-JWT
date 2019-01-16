const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var FriendRequestSchema = new Schema({
    sender: { type: String, required: true},
    receiver: { type: String, required: true},
});

const FriendRequest = mongoose.model('friendRequestSchema', FriendRequestSchema);

module.exports = FriendRequest;