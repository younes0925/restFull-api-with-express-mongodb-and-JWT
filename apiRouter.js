// Imports
var express = require('express');
var usersCtrl = require('./routes/usersCtrl');
var friendsCtrl = require('./routes/friendsCtrl');
var economyCtrl = require('./routes/economyCtrl');
var clanCtrl = require('./routes/clanCtrl');
var admin = require('./routes/admin');

//Router
exports.router = (function()
{
    var apiRouter = express.Router();

    //Users router
    apiRouter.route('/users/register/').post(usersCtrl.register);
    apiRouter.route('/users/login/').post(usersCtrl.login);
    apiRouter.route('/users/me/').get(usersCtrl.getUserProfile);
    apiRouter.route('/users/me/').put(usersCtrl.updateUserProfile);
    apiRouter.route('/users/confirmation').get(usersCtrl.confirmation);
    apiRouter.route('/users/resend').post(usersCtrl.resend);
    apiRouter.route('/users/forgotPassword').post(usersCtrl.ForgotPassword);
    apiRouter.route('/users/newPassword').post(usersCtrl.NewPassword);

    //Friends router
    apiRouter.route('/friends/request/').post(friendsCtrl.friendRequest);
    apiRouter.route('/friends/requests/').get(friendsCtrl.friendRequests);
    apiRouter.route('/friends/acceptFriendRequest/').post(friendsCtrl.acceptFriendRequest);
    apiRouter.route('/friends/removeFriend/').delete(friendsCtrl.removeFriend);
    apiRouter.route('/friends/denyFriendRequest/').delete(friendsCtrl.denyFriendRequest);
    apiRouter.route('/friends/userFriends/').get(friendsCtrl.userFriends);

    //Economy router
    apiRouter.route('/economy/buy/').post(economyCtrl.buyWeapon);
    apiRouter.route('/economy/retrieveWeapon/').get(economyCtrl.retrieveWeapon);
    apiRouter.route('/economy/retrieveBalance/').get(economyCtrl.retrieveBalance);

    // Admin API
    apiRouter.route('/admin/addEconomy/').post(admin.addEconomy);
    apiRouter.route('/admin/banPlayer/').post(admin.banPlayer);

    //Clans
    apiRouter.route('/clans/createClan/').post(clanCtrl.createClan);
    apiRouter.route('/clans/clanRequest/').post(clanCtrl.clanRequest);
    apiRouter.route('/clans/clanRequests/').get(clanCtrl.clanRequests);
    apiRouter.route('/clans/acceptClanRequest/').post(clanCtrl.acceptClanRequest);
    apiRouter.route('/clans/declineClanRequest/').post(clanCtrl.declineClanRequest);
    apiRouter.route('/clans/leaveClan/').delete(clanCtrl.leaveClan);
    apiRouter.route('/clans/changeOwner/').post(clanCtrl.changeOwner);

    return apiRouter
})();
