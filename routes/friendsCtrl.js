//import
var bcrypt = require('bcrypt');
var jwtUtils = require('../utils/jwt.utils');
var User = require('../models/user');
var FriendRequest = require('../models/friendRequest');
var asyncLib = require('async');
var FriendRequestSchema = require('../models/user');
//Constants
var responceConstants = require("../responceConstants");

//Routes
module.exports = {

    userFriends: function(req, res)
    {
        var headerAuth = req.headers['authorization'];
        var userId = jwtUtils.getUserId(headerAuth);

        if (userId < 0)
        {
            return res.status(409).json(
            {
                'ResultCode': 2,
                'Message': responceConstants.authFailed
            });
        }

        asyncLib.waterfall([
                function(done)
                {
                    User.findById(
                    {
                        _id: userId
                    }, function(err, userFound)
                    {
                        if (userFound)
                            done(null, userFound)
                        else
                            return res.status(500).json(
                            {
                                'ResultCode': 2,
                                'Message': responceConstants.unknownError
                            });
                    });
                },
                function(userFound, done)
                {
                    if (userFound.Friends != null)
                    {
                        var userIdFriends = [];

                        userFound.Friends.forEach(function(frindId)
                        {
                            userIdFriends.push(frindId);
                        });
                        done(null, userIdFriends);
                    }
                    else
                        return res.status(500).json(
                        {
                            'ResultCode': 3,
                            'Message': responceConstants.unknownError
                        });
                },
                function(userIdFriends, done)
                {
                    if (userIdFriends != null)
                    {
                        User.find(
                        {
                            _id:
                            {
                                "$in": userIdFriends
                            }
                        }, function(err, allFriends)
                        {
                            if (allFriends)
                                done(null, allFriends)
                            else
                                return res.status(500).json(
                                {
                                    'ResultCode': 2,
                                    'Message': responceConstants.unknownError
                                });
                        });
                    }
                    else
                        return res.status(500).json(
                        {
                            'ResultCode': 3,
                            'Message': responceConstants.unknownError
                        });
                },
                function(allFriends, done)
                {
                    if (allFriends)
                    {
                        var userFriends = [];
                        allFriends.forEach(function(frind)
                        {
                            userFriends.push(frind.username);

                        })
                        done(userFriends)
                    }
                    else
                        return res.status(500).json(
                        {
                            'ResultCode': 3,
                            'Message': responceConstants.unknownError
                        });
                },
            ],
            function(userFriends)
            {
                if (userFriends != null)
                {
                    return res.status(201).json(
                    {
                        'ResultCode': 1,
                        'Friends': userFriends
                    });
                }
                else
                    return res.status(500).json(
                    {
                        'ResultCode': 3,
                        'Message': responceConstants.unknownError
                    });
            });
    },

    denyFriendRequest: function(req, res)
    {
        var headerAuth = req.headers['authorization'];
        var userId = jwtUtils.getUserId(headerAuth);

        if (userId < 0)
        {
            return res.status(409).json(
            {
                'ResultCode': 2,
                'Message': responceConstants.authFailed
            });
        }

        //Params
        var usernameSender = req.body.usernameSender; // The username of the person who sent the friend request!

        if (usernameSender == null)
        {
            return res.status(400).json(
            {
                'ResultCode': 3,
                'Message': responceConstants.missingParameters
            });
        }

        asyncLib.waterfall([
                function(done)
                {
                    User.findOne(
                    {username: usernameSender}, function(err, userSenderFound)
                    {
                        if (userSenderFound)
                            done(null, userSenderFound)
                        else
                            return res.status(500).json(
                            {
                                'ResultCode': 2,
                                'Message': 'unable to verify user'
                            });
                    });
                },
                function(userSenderFound, done)
                {
                    FriendRequest.findOne(
                    {
                        $and: [
                        {
                            sender: userSenderFound.id
                        },
                        {
                            receiver: userId
                        }]
                    }, function(err, reqFound)
                    {
                        if (reqFound)
                            done(null, userSenderFound)
                        else
                            return res.status(500).json(
                            {
                                'ResultCode': 2,
                                'Message': 'request already exists! '
                            });
                    });
                },
                function(userSenderFound, done)
                {
                    console.log('sender :' + userSenderFound.id);
                    console.log('receiver :' + userId);

                    FriendRequest.deleteOne(
                    {
                        $and: [
                        {
                            sender: userSenderFound.id
                        },
                        {
                            receiver: userId
                        }]
                    }, function(err, finalReq)
                    {
                        if (finalReq)
                            done(finalReq)
                        else
                            return res.status(500).json(
                            {
                                'ResultCode': 2,
                                'Message': 'unable to verify user'
                            });
                    });
                },
            ],
            function(finalReq)
            {
                if (finalReq)
                {
                    return res.status(201).json(
                    {
                        'ResultCode': 1,
                        'Message': 'Friend request denied! '
                    });
                }
                else
                    return res.status(500).json(
                    {
                        'ResultCode': 3,
                        'Message': 'failed request'
                    });
            });
    },

    acceptFriendRequest: function(req, res)
    {
        var headerAuth = req.headers['authorization'];
        var userId = jwtUtils.getUserId(headerAuth);

        if (userId < 0)
        {
            return res.status(409).json(
            {
                'ResultCode': 2,
                'Message': responceConstants.authFailed
            });
        }

        //Params
        var usernameSender = req.body.usernameSender; // The username of the person who sent the friend request!
        if (usernameSender == null)
            return res.status(400).json(
            {
                'ResultCode': 3,
                'Message': responceConstants.missingParameters
            });

        asyncLib.waterfall([
                function(done)
                {
                    User.findOne(
                    {
                        username: usernameSender
                    }, function(err, userSenderFound)
                    {
                        if (userSenderFound)
                            done(null, userSenderFound)
                        else
                            return res.status(500).json(
                            {
                                'ResultCode': 2,
                                'Message': responceConstants.unknownError
                            });

                    });
                },
                function(userSenderFound, done)
                {
                    FriendRequest.findOne(
                    {
                        $and: [
                        {
                            sender: userSenderFound.id
                        },
                        {
                            receiver: userId
                        }]
                    }, function(err, reqFound)
                    {
                        if (reqFound)
                            done(null, userSenderFound)
                        else
                            return res.status(500).json(
                            {
                                'ResultCode': 2,
                                'Message': 'This friend request doesnt exist.'
                            });
                    });
                },
                function(userSenderFound, done)
                {
                    User.updateOne(
                    {
                        _id: userId
                    },
                    {
                        $push:
                        {
                            Friends: userSenderFound.id
                        }
                    }, function(err, receiver)
                    {
                        if (receiver)
                            done(null, userSenderFound, receiver)
                        else
                            return res.status(500).json(
                            {
                                'ResultCode': 2,
                                'Message': responceConstants.unknownError
                            });
                    });
                },
                function(userSenderFound, receiver ,done)
                {
                    User.updateOne(
                    {
                        _id: userSenderFound.id
                    },
                    {
                        $push:
                        {
                            Friends: userId
                        }
                    }, function(err, res2)
                    {
                        if (res2)
                            done(null, userSenderFound, receiver)
                        else
                            return res.status(500).json(
                            {
                                'ResultCode': 2,
                                'Message': responceConstants.unknownError
                            });
                    });
                },
                function(userSenderFound, receiver, done)
                {
                    //console.log('sender :' + userSenderFound.id);
                    //console.log('receiver :' + userId);

                    FriendRequest.deleteOne(
                    {
                        $and: [
                        {
                            sender: userSenderFound.id
                        },
                        {
                            receiver: userId
                        }]
                    }, function(err, finalReq)
                    {
                        if (finalReq)
                            done(finalReq)
                        else
                            return res.status(500).json(
                            {
                                'ResultCode': 2,
                                'Message': responceConstants.unknownError
                            });
                    });
                },
            ],
            function(finalReq)
            {

                if (finalReq)
                {
                    return res.status(201).json(
                    {
                        'ResultCode': 1,
                        'Message': 'Success, friend added!'
                    });
                }
                else
                    return res.status(500).json(
                    {
                        'ResultCode': 3,
                        'Message': responceConstants.unknownError
                    });
            });
    },

    removeFriend: function(req, res)
    {
        var headerAuth = req.headers['authorization'];
        var userId = jwtUtils.getUserId(headerAuth);

        if (userId < 0)
            return res.status(409).json(
            {
                'ResultCode': 2,
                'Message': responceConstants.authFailed
            });

        //Params
        var usernameSender = req.body.usernameSender;
        if (usernameSender == null)
            return res.status(400).json(
            {
                'ResultCode': 3,
                'Message': responceConstants.missingParameters
            });

        asyncLib.waterfall([
                function(done)
                {
                    User.findOne(
                    {
                        username: usernameSender
                    }, function(err, __userSenderFound)
                    {
                        if (__userSenderFound)
                            done(null, __userSenderFound)
                        else
                            return res.status(500).json(
                            {
                                'ResultCode': 2,
                                'Message': responceConstants.unknownError
                            });
                    });
                },

                function(__userSenderFound, done)
                {
                    console.log(__userSenderFound.id);
                    User.update(
                    {
                        _id: userId
                    },
                    {
                        $pullAll:
                        {
                            Friends: [__userSenderFound.id]
                        }
                    },
                    {
                        multi: true
                    }, function(err, receiver)
                    {
                        if (receiver)
                            done( null ,__userSenderFound ,receiver)
                        else
                            return res.status(500).json(
                            {
                                'ResultCode': 2,
                                'Message': responceConstants.unknownError
                            });
                    });
                },
                function(__userSenderFound,receiver ,  done)
                {
                    console.log(__userSenderFound.id);
                    User.update(
                    {
                        username: __userSenderFound.username
                    },
                    {
                        $pullAll:
                        {
                            Friends: [userId]
                        }
                    },
                    {
                        multi: true
                    }, function(err, receiver2)
                    {
                        if (receiver2)
                            done(__userSenderFound ,receiver ,receiver2)
                        else
                            return res.status(500).json(
                            {
                                'ResultCode': 2,
                                'Message': responceConstants.unknownError
                            });
                    });
                },
            ],
            function(receiver ,receiver2)
            {
                if (receiver && receiver2)
                {
                    return res.status(201).json(
                    {
                        'ResultCode': 1,
                        'Message': 'This friend has been removed, please contact support if any abuse has been recieved.'
                    });
                }
                else
                    return res.status(500).json(
                    {
                        'ResultCode': 3,
                        'Message': responceConstants.unknownError
                    });
            });
    },

    friendRequest: function(req, res)
    {
        var headerAuth = req.headers['authorization'];
        var userId = jwtUtils.getUserId(headerAuth);

        if (userId < 0)
            return res.status(409).json(
            {
                'ResultCode': 2,
                'Message': responceConstants.authFailed
            });

        var usernameReceiver = req.body.usernameReceiver;

        if (usernameReceiver == null)
            return res.status(400).json(
            {
                'ResultCode': 3,
                'Message': responceConstants.missingParameters
            });

        asyncLib.waterfall([
                function(done)
                {
                    User.findById(
                    {
                        _id: userId
                    }, function(err, userSenderFound)
                    {
                        if (userSenderFound)
                            done(null, userSenderFound)
                        else
                            return res.status(500).json(
                            {
                                'ResultCode': 2,
                                'Message': responceConstants.authFailed
                            });

                    });
                },
                function(userSenderFound, done)
                {
                    User.findOne(
                    {
                        username: usernameReceiver
                    }, function(err, userReceiverFound)
                    {
                        if (userReceiverFound)
                            done(null, userSenderFound, userReceiverFound)
                        else
                            return res.status(500).json(
                            {
                                'ResultCode': 2,
                                'Message': responceConstants.userDoesNotExist
                            });
                    });
                },
                function(userSenderFound, userReceiverFound, done)
                {
                    var itemId = userReceiverFound.id;
                    User.findOne(
                    {
                        $and: [
                        {
                            _id: userId
                        },
                        {
                            Friends:
                            {
                                "$in": itemId
                            }
                        }]
                    }, function(err, itemExist)
                    {
                        if (!itemExist)
                            done(null, userSenderFound, userReceiverFound)
                        else
                            return res.status(500).json(
                            {
                                'ResultCode': 2,
                                'Message': 'this user is already friend with you'
                            });
                    });
                },
                function(userSenderFound, userReceiverFound, done)
                {
                    FriendRequest.findOne(
                    {
                        $and: [
                        {
                            sender: userSenderFound.id
                        },
                        {
                            receiver: userReceiverFound.id
                        }]
                    }, function(err, reqFound)
                    {
                        console.log(reqFound);
                        if (!reqFound)
                            done(null, userSenderFound, userReceiverFound)
                        else
                            return res.status(500).json(
                            {
                                'ResultCode': 2,
                                'Message': 'Your request to this user has been sent already!'
                            });
                    });
                },
                function(userSenderFound, userReceiverFound, done)
                {
                    var newReq = new FriendRequest(
                    {
                        sender: userId,
                        receiver: userReceiverFound.id
                    });

                    newReq.save(function(err)
                    {
                        if (err)
                        {
                            return res.status(500).send(
                            {
                                'ResultCode': 3,
                                'Message': responceConstants.unknownError
                            });
                        }
                        done(newReq);
                    })
                },
            ],
            function(newReq)
            {
                if (newReq)
                    return res.status(201).json(
                    {
                        'ResultCode': 1,
                        'Message': 'The request has been sent succesfully!'
                    });
                else
                    return res.status(500).json(
                    {
                        'ResultCode': 3,
                        'Message': responceConstants.unknownError
                    });
            });
    },

    friendRequests: function(req, res)
    {
        var headerAuth = req.headers['authorization'];
        var userId = jwtUtils.getUserId(headerAuth);

        if (userId < 0)
        {
            return res.status(409).json(
            {
                'ResultCode': 2,
                'Message': responceConstants.authFailed
            });
        }

        asyncLib.waterfall([
                function(done)
                {
                    User.findOne(
                    {
                        _id: userId
                    }, function(err, userFound)
                    {
                        if (userFound)
                            done(null, userFound)
                        else
                            return res.status(500).json(
                            {
                                'ResultCode': 2,
                                'Message': responceConstants.unknownError
                            });
                    });
                },
                function(userFound, done)
                {
                    FriendRequest.find(
                    {
                        receiver: userFound.id
                    }, function(err, allRequestAdd)
                    {
                        if (allRequestAdd)
                            done(null, allRequestAdd)
                        else
                            return res.status(500).json(
                            {
                                'ResultCode': 2,
                                'Message': responceConstants.unknownError
                            });
                    });
                },
                function(allRequestAdd, done)
                {
                    if (allRequestAdd != null)
                    {
                        var userSender = [];

                        allRequestAdd.forEach(function(RequestAdd)
                        {
                            userSender.push(RequestAdd.sender);
                        })
                        done(null, userSender)
                    }
                    else
                        return res.status(500).json(
                        {
                            'ResultCode': 3,
                            'Message': responceConstants.unknownError
                        });
                },
                function(userSender, done)
                {
                    if (userSender != null)
                    {
                        User.find(
                        {
                            _id:
                            {
                                "$in": userSender
                            }
                        }, function(err, allRequestAdd)
                        {
                            if (allRequestAdd)
                                done(null, allRequestAdd)
                            else
                                return res.status(500).json(
                                {
                                    'ResultCode': 2,
                                    'Message': responceConstants.unknownError
                                });
                        });
                    }
                    else
                        return res.status(500).json(
                        {
                            'ResultCode': 3,
                            'Message': responceConstants.unknownError
                        });
                },
                function(allRequestAdd, done)
                {
                    if (allRequestAdd)
                    {
                        var userSender = [];
                        allRequestAdd.forEach(function(RequestAdd)
                        {
                            userSender.push(RequestAdd.username);
                        })
                        done(userSender);
                    }
                    else
                        return res.status(500).json(
                        {
                            'ResultCode': 3,
                            'Message': responceConstants.unknownError
                        });
                },
            ],
            function(userSender)
            {
                if (userSender != null)
                {
                    return res.status(201).json(
                    {
                        'ResultCode': 1,
                        'PendingRequests': userSender
                    });
                }
                else
                    return res.status(500).json(
                    {
                        'ResultCode': 3,
                        'Message': responceConstants.unknownError
                    });
            });
    },
}
