var bcrypt = require('bcrypt');
var jwtUtils = require('../utils/jwt.utils');
var User = require('../models/user');
var Clan = require('../models/clan');
var ClanRequest = require('../models/clanRequest');
var asyncLib = require('async');
//Constants

//Routes
module.exports = {

    createClan: function(req, res)
    {
        // Getting auth header
        var headerAuth = req.headers['authorization'];
        var userId = jwtUtils.getUserId(headerAuth);

        if (userId < 0)
            return res.status(409).json(
            {
                'ResultCode': 2,
                'Message': 'optional Auth Failed message'
            });

        var username = req.body.username;
        var clanName = req.body.clanName;
        var clanTag = req.body.clanTag;

        if (username == null || clanName == null || clanTag == null)
            return res.status(200).json(
            {
                'ResultCode': 3,
                'Message': 'username or clanName empty'
            });

        asyncLib.waterfall([
                function(done)
                {
                    User.findOne(
                    {
                        $and: [
                        {
                            _id: userId
                        },
                        {
                            username: username
                        }]
                    }, function(err, userFound)
                    {
                        if (userFound)
                        {
                            done(null, userFound)
                        }
                        else
                            return res.status(500).json(
                            {
                                'ResultCode': 2,
                                'Message': 'user not found '
                            });
                    });
                },
                function(userFound, done)
                {
                    Clan.findOne(
                    {
                        ClanName: clanName
                    }, function(err, clanFound)
                    {
                        if (!clanFound)
                        {
                            done(null, userFound, clanFound)
                        }
                        else
                            return res.status(500).json(
                            {
                                'ResultCode': 2,
                                'Message': 'clan already exists '
                            });
                    });
                },
                function(userFound, clanFound, done)
                {
                    User.findOne(
                    {
                        $and: [
                        {
                            Clan:
                            {
                                $ne: null
                            }
                        },
                        {
                            username: username
                        }]
                    }, function(err, userFound)
                    {
                        if (!userFound)
                        {
                            done(null, userFound)
                        }
                        else
                            return res.status(500).json(
                            {
                                'ResultCode': 2,
                                'Message': 'user already have clan '
                            });
                    });
                },
                function(userFound, clanFound, done)
                {
                    var newClan = new Clan(
                    {
                        ClanName: clanName,
                        ClanTag: clanTag,
                        Owner: username
                    });
                    console.log('first');
                    newClan.save(function(err)
                    {
                        if (err)
                            return res.status(500).send(
                            {
                                'ResultCode': 3,
                                'Message': err.message
                            });
                        else
                            done(null, newClan, userFound, clanFound);
                    })
                },
                function(newClan, userFound, clanFound, done)
                {
                    User.updateOne(
                    {
                        username: username
                    },
                    {
                        $set:
                        {
                            Clan: newClan.id
                        }
                    },
                    {
                        new: true
                    }, function(err, updateProfile)
                    {
                        if (err)
                        {
                            return res.status(500).json(
                            {
                                'ResultCode': 2,
                                'Message': 'cannot insert Clan Id'
                            });
                        }
                        else
                            done(newClan, userFound, clanFound);

                    });
                },
            ],
            function(newClan, userFound, clanFound)
            {
                if (newClan)
                {
                    return res.status(201).json(
                    {
                        'ResultCode': 1,
                        'Message': 'Clan Created!'
                    });
                }
                else
                    return res.status(500).json(
                    {
                        'ResultCode': 2,
                        'Message': 'failed request'
                    });
            },

        )
    },

    clanRequest: function(req, res)
    {
        // Getting auth header
        var headerAuth = req.headers['authorization'];
        var userId = jwtUtils.getUserId(headerAuth);

        if (userId < 0)
            return res.status(409).json(
            {
                'ResultCode': 2,
                'Message': 'optional Auth Failed message'
            });

        var username = req.body.username;
        var otherUsername = req.body.otherUsername;

        if (username == null || otherUsername == null)
            return res.status(200).json(
            {
                'ResultCode': 3,
                'Message': 'username or itemId empty'
            });

        asyncLib.waterfall([
                function(done)
                {
                    User.findOne(
                    {
                        $and: [
                        {
                            _id: userId
                        },
                        {
                            username: username
                        }]
                    }, function(err, userSenderFound)
                    {
                        if (userSenderFound)
                            done(null, userSenderFound)
                        else
                            return res.status(500).json(
                            {
                                'ResultCode': 2,
                                'Message': 'unable to verify user--'
                            });

                    });
                },
                function(userSenderFound, done)
                {
                    console.log(username);
                    Clan.findOne(
                    {
                        Owner: username
                    }, function(err, userOner)
                    {
                        if (userOner)
                            done(null, userSenderFound)
                        else
                            return res.status(500).json(
                            {
                                'ResultCode': 3,
                                'Message': 'You don’t have permission to send an invite!'
                            });
                    });
                },

                function(userSenderFound, done)
                {
                    User.findOne(
                    {
                        username: otherUsername
                    }, function(err, userReceiverFound)
                    {
                        if (userReceiverFound)
                            done(null, userSenderFound, userReceiverFound)
                        else
                            return res.status(500).json(
                            {
                                'ResultCode': 2,
                                'Message': 'unable to verify user '
                            });
                    });
                },
                function(userSenderFound, userReceiverFound, done)
                {
                    var receiver = userReceiverFound.id;
                    Clan.findOne(
                    {
                        $and: [
                        {
                            Owner: userSenderFound.username
                        },
                        {
                            Members:
                            {
                                "$in": receiver
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
                                'Message': 'Member already exists'
                            });
                    });
                },
                function(userSenderFound, userReceiverFound, done)
                {
                    ClanRequest.findOne(
                    {
                        $and: [
                        {
                            clan: userSenderFound.Clan
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
                                'Message': 'request already exists! '
                            });
                    });
                },
                function(userSenderFound, userReceiverFound, done)
                {
                    var newReq = new ClanRequest(
                    {
                        clan: userSenderFound.Clan,
                        receiver: userReceiverFound.id
                    });

                    newReq.save(function(err)
                    {
                        if (err)
                        {
                            return res.status(500).send(
                            {
                                'ResultCode': 3,
                                'Message': err.message
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
                        'Message': 'Invite Sent!'
                    });
                else
                    return res.status(500).json(
                    {
                        'ResultCode': 3,
                        'Message': 'failed request'
                    });
            });
    },
    clanRequests: function(req, res)
    {
        var headerAuth = req.headers['authorization'];
        var userId = jwtUtils.getUserId(headerAuth);

        if (userId < 0)
            return res.status(409).json(
            {
                'ResultCode': 2,
                'Message': 'optional Auth Failed message'
            });

        var username = req.body.username;

        if (username == null)
            return res.status(200).json(
            {
                'ResultCode': 3,
                'Message': 'username  empty'
            });

        asyncLib.waterfall([
                function(done)
                {
                    User.findOne(
                    {
                        $and: [
                        {
                            _id: userId
                        },
                        {
                            username: username
                        }]
                    }, function(err, userFound)
                    {
                        if (userFound)
                            done(null, userFound)
                        else
                            return res.status(500).json(
                            {
                                'ResultCode': 2,
                                'Message': 'unable to verify user'
                            });
                    });
                },
                function(userFound, done)
                {
                    console.log(userFound.id);
                    ClanRequest.find(
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
                                'Message': 'unable to verify user'
                            });
                    });
                },
                function(allRequestAdd, done)
                {

                    if (allRequestAdd != null)
                    {
                        var __clan = [];

                        allRequestAdd.forEach(function(RequestAdd)
                        {
                            __clan.push(RequestAdd.clan);

                        })
                        done(null, __clan)

                    }
                    else
                        return res.status(500).json(
                        {
                            'ResultCode': 3,
                            'Message': 'failed request'
                        });
                },
                function(__clan, done)
                {

                    if (__clan != null)
                    {
                        Clan.find(
                        {
                            _id:
                            {
                                "$in": __clan
                            }
                        }, function(err, allRequestAdd)
                        {
                            if (allRequestAdd)
                                done(null, allRequestAdd)
                            else
                                return res.status(500).json(
                                {
                                    'ResultCode': 2,
                                    'Message': 'unable to verify clan'
                                });
                        });

                    }
                    else
                        return res.status(500).json(
                        {
                            'ResultCode': 3,
                            'Message': 'failed request'
                        });
                },
                function(allRequestAdd, done)
                {

                    console.log(allRequestAdd);

                    if (allRequestAdd)
                    {
                        var __Clan = [];

                        allRequestAdd.forEach(function(RequestAdd)
                        {
                            __Clan.push(RequestAdd.ClanName);

                        })

                        done(__Clan)

                    }
                    else
                        return res.status(500).json(
                        {
                            'ResultCode': 3,
                            'Message': 'failed request'
                        });
                },
            ],
            function(__Clan)
            {

                if (__Clan != null)
                {
                    return res.status(201).json(
                    {
                        'ResultCode': 1,
                        'PendingRequests': __Clan
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

    acceptClanRequest: function(req, res)
    {

        var headerAuth = req.headers['authorization'];
        var userId = jwtUtils.getUserId(headerAuth);

        if (userId < 0)
            return res.status(409).json(
            {
                'ResultCode': 2,
                'Message': 'optional Auth Failed message'
            });


        //Params
        var Username = req.body.Username;
        var ClanName = req.body.ClanName;
        var Bool = req.body.Bool;
        if (Username == null || ClanName == null || Bool != 'Accept')
            return res.status(400).json(
            {
                'ResultCode': 3,
                'Message': 'missing parameters'
            });

        asyncLib.waterfall([
                function(done)
                {
                    Clan.findOne(
                    {
                        ClanName: ClanName
                    }, function(err, clanFound)
                    {
                        if (clanFound)
                            done(null, clanFound)
                        else
                            return res.status(500).json(
                            {
                                'ResultCode': 2,
                                'Message': 'unable to verify clan'
                            });

                    });
                },
                function(clanFound, done)
                {
                    User.findOne(
                    {
                        $and: [
                        {
                            _id: userId
                        },
                        {
                            username: Username
                        }]
                    }, function(err, userFound)
                    {
                        if (userFound)
                            done(null, clanFound, userFound)
                        else
                            return res.status(500).json(
                            {
                                'ResultCode': 2,
                                'Message': 'unable to verify user'
                            });

                    });
                },
                function(clanFound, userFound, done)
                {
                    User.findOne(
                    {
                        $and: [
                        {
                            Clan:
                            {
                                $ne: null
                            }
                        },
                        {
                            username: userFound.username
                        }]
                    }, function(err, user)
                    {
                        if (!user)
                        {
                            done(null, clanFound, userFound)
                        }
                        else
                            return res.status(500).json(
                            {
                                'ResultCode': 2,
                                'Message': 'user already have clan '
                            });
                    });
                },

                function(clanFound, userFound, done)
                {
                    console.log(clanFound.id);
                    console.log(userFound.id);

                    ClanRequest.findOne(
                    {
                        $and: [
                        {
                            clan: clanFound.id
                        },
                        {
                            receiver: userId
                        }]
                    }, function(err, reqFound)
                    {
                        if (reqFound)
                            done(null, clanFound, userFound)
                        else
                            return res.status(500).json(
                            {
                                'ResultCode': 2,
                                'Message': 'failed request '
                            });
                    });
                },
                function(clanFound, userFound, done)
                {
                    Clan.updateOne(
                    {
                        _id: clanFound.id
                    },
                    {
                        $push:
                        {
                            Members: userFound.id
                        }
                    }, function(err, receiver)
                    {
                        if (receiver)
                            done(null, clanFound, userFound)
                        else
                            return res.status(500).json(
                            {
                                'ResultCode': 2,
                                'Message': 'unable to verify clan'
                            });

                    });
                },
                function(clanFound, userFound, done)
                {
                    console.log('sender :' + clanFound.id);
                    console.log('receiver :' + userId);

                    ClanRequest.deleteOne(
                    {
                        $and: [
                        {
                            clan: clanFound.id
                        },
                        {
                            receiver: userId
                        }]
                    }, function(err, finalReq)
                    {
                        if (finalReq)
                            done(null, clanFound, userFound, finalReq)
                        else
                            return res.status(500).json(
                            {
                                'ResultCode': 2,
                                'Message': 'unable to verify user'
                            });

                    });
                },
                function(clanFound, userFound, finalReq, done)
                {
                    console.log(userFound.id);
                    User.updateOne(
                    {
                        username: userFound.username
                    },
                    {
                        $set:
                        {
                            Clan: clanFound.id
                        }
                    },
                    {
                        new: true
                    }, function(err, updateProfile)
                    {
                        if (err)
                        {
                            return res.status(500).json(
                            {
                                'ResultCode': 2,
                                'Message': 'cannot insert Clan Id'
                            });
                        }
                        else
                            done(clanFound, userFound, finalReq, );

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
                        'Message': '”Request accepted !'
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
    declineClanRequest: function(req, res)
    {

        var headerAuth = req.headers['authorization'];
        var userId = jwtUtils.getUserId(headerAuth);

        if (userId < 0)
            return res.status(409).json(
            {
                'ResultCode': 2,
                'Message': 'optional Auth Failed message'
            });


        //Params
        var Username = req.body.Username;
        var ClanName = req.body.ClanName;
        var Bool = req.body.Bool;
        if (Username == null || ClanName == null || Bool != 'Decline')
            return res.status(400).json(
            {
                'ResultCode': 3,
                'Message': 'missing parameters'
            });


        asyncLib.waterfall([
                function(done)
                {
                    Clan.findOne(
                    {
                        ClanName: ClanName
                    }, function(err, clanFound)
                    {
                        if (clanFound)
                            done(null, clanFound)
                        else
                            return res.status(500).json(
                            {
                                'ResultCode': 2,
                                'Message': 'unable to verify clan'
                            });

                    });
                },
                function(clanFound, done)
                {
                    User.findOne(
                    {
                        $and: [
                        {
                            _id: userId
                        },
                        {
                            username: Username
                        }]
                    }, function(err, userFound)
                    {
                        if (userFound)
                            done(null, clanFound, userFound)
                        else
                            return res.status(500).json(
                            {
                                'ResultCode': 2,
                                'Message': 'unable to verify user'
                            });

                    });
                },
                function(clanFound, userFound, done)
                {
                    console.log(clanFound.id);
                    console.log(userFound.id);

                    ClanRequest.findOne(
                    {
                        $and: [
                        {
                            clan: clanFound.id
                        },
                        {
                            receiver: userId
                        }]
                    }, function(err, reqFound)
                    {
                        if (reqFound)
                            done(null, clanFound, userFound)
                        else
                            return res.status(500).json(
                            {
                                'ResultCode': 2,
                                'Message': 'failed request '
                            });
                    });
                },
                function(clanFound, userFound, done)
                {
                    console.log('sender :' + userFound.id);
                    console.log('receiver :' + userId);

                    ClanRequest.deleteOne(
                    {
                        $and: [
                        {
                            clan: clanFound.id
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
                        'Message': '”Request declined !'
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
    leaveClan: function(req, res)
    {
        var headerAuth = req.headers['authorization'];
        var userId = jwtUtils.getUserId(headerAuth);

        if (userId < 0)
            return res.status(409).json(
            {
                'ResultCode': 2,
                'Message': 'optional Auth Failed message'
            });


        //Params
        var Username = req.body.Username;
        var ClanName = req.body.ClanName;
        if (Username == null || ClanName == null)
            return res.status(400).json(
            {
                'ResultCode': 3,
                'Message': 'missing parameters'
            });


        asyncLib.waterfall([
                function(done)
                {
                    Clan.findOne(
                    {
                        ClanName: ClanName
                    }, function(err, clanFound)
                    {
                        if (clanFound)
                            done(null, clanFound)
                        else
                            return res.status(500).json(
                            {
                                'ResultCode': 2,
                                'Message': 'unable to verify clan'
                            });

                    });
                },
                function(clanFound, done)
                {
                    User.findOne(
                    {
                        $and: [
                        {
                            _id: userId
                        },
                        {
                            username: Username
                        },
                        {
                            Clan: clanFound.id
                        }]
                    }, function(err, userFound)
                    {
                        if (userFound)
                            done(null, clanFound, userFound)
                        else
                            return res.status(500).json(
                            {
                                'ResultCode': 2,
                                'Message': 'unable to verify user'
                            });

                    });
                },
                function(clanFound, userFound, done)
                {
                    Clan.updateOne(
                    {
                        _id: clanFound.id
                    },
                    {
                        $pullAll:
                        {
                            Members: [userFound.id]
                        }
                    },
                    {
                        multi: true
                    }, function(err, rmClam)
                    {
                        if (rmClam)
                            done(null, clanFound, userFound, rmClam)
                        else
                            return res.status(500).json(
                            {
                                'ResultCode': 2,
                                'Message': 'remove member  from clan"'
                            });
                    });
                },
                function(clanFound, userFound, rmClam, done)
                {
                    console.log(userFound.id);
                    console.log(clanFound.id);

                    User.updateOne(
                    {
                        _id: userId
                    },
                    {
                        $set:
                        {
                            Clan: null
                        }
                    },
                    {
                        new: true
                    }, function(err, rmUser)
                    {
                        if (err)
                        {
                            return res.status(500).json(
                            {
                                'ResultCode': 2,
                                'Message': 'cannot log on server'
                            });
                        }
                        else
                            done(null, clanFound, userFound, rmClam, rmUser)

                    });
                },

            ],
            function(clanFound, userFound, rmClam, rmUser)
            {

                if (rmClam && rmUser)
                {
                    return res.status(201).json(
                    {
                        'ResultCode': 1,
                        'Message': 'Left Clan !'
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

    changeOwner: function(req, res)
    {

        var headerAuth = req.headers['authorization'];
        var userId = jwtUtils.getUserId(headerAuth);

        if (userId < 0)
            return res.status(409).json(
            {
                'ResultCode': 2,
                'Message': 'optional Auth Failed message'
            });


        //Params
        var Username = req.body.Username;
        var Player = req.body.Player;
        if (Username == null || Player == null)
            return res.status(400).json(
            {
                'ResultCode': 3,
                'Message': 'missing parameters'
            });

        asyncLib.waterfall([
                function(done)
                {
                    User.findOne(
                    {
                        $and: [
                        {
                            _id: userId
                        },
                        {
                            username: Username
                        }]
                    }, function(err, userFound)
                    {
                        if (userFound)
                            done(null, userFound)
                        else
                            return res.status(500).json(
                            {
                                'ResultCode': 2,
                                'Message': 'unable to verify user'
                            });

                    });
                },
                function(userFound, done)
                {
                    User.findOne(
                    {
                        username: Player
                    }, function(err, playerFound)
                    {
                        if (playerFound)
                            done(null, userFound, playerFound)
                        else
                            return res.status(500).json(
                            {
                                'ResultCode': 2,
                                'Message': 'unable to verify player'
                            });

                    });
                },
                function(userFound, playerFound, done)
                {
                    Clan.findOne(
                    {
                        Owner: userFound.username
                    }, function(err, clanFound)
                    {
                        if (clanFound)
                            done(null, userFound, playerFound, clanFound)
                        else
                            return res.status(500).json(
                            {
                                'ResultCode': 2,
                                'Message': 'You don’t have permission to change the owner!”'
                            });

                    });
                },
                function(userFound, playerFound, clanFound, done)
                {

                    Clan.updateOne(
                    {
                        _id: clanFound.id
                    },
                    {
                        $set:
                        {
                            Owner: playerFound.username
                        }
                    },
                    {
                        new: true
                    }, function(err)
                    {
                        if (err)
                        {
                            return res.status(500).json(
                            {
                                'ResultCode': 2,
                                'Message': 'cannot log on server'
                            });
                        }
                        else
                            done(null, userFound, playerFound, clanFound)

                    });
                },
                function(userFound, playerFound, clanFound, done)
                {
                    Clan.updateOne(
                    {
                        _id: clanFound.id
                    },
                    {
                        $pullAll:
                        {
                            Members: [playerFound.id]
                        }
                    },
                    {
                        multi: true
                    }, function(err, rmClam)
                    {
                        if (rmClam)
                            done(null, userFound, playerFound, clanFound)
                        else
                            return res.status(500).json(
                            {
                                'ResultCode': 2,
                                'Message': 'remove member  from clan"'
                            });
                    });
                },
                function(userFound, playerFound, clanFound, done)
                {
                    Clan.updateOne(
                    {
                        _id: clanFound.id
                    },
                    {
                        $push:
                        {
                            Members: userFound.id
                        }
                    }, function(err, receiver)
                    {
                        if (receiver)
                            done(userFound, playerFound, clanFound)
                        else
                            return res.status(500).json(
                            {
                                'ResultCode': 2,
                                'Message': 'unable to verify clan'
                            });

                    });
                },
            ],
            function(userFound, playerFound, clanFound)
            {

                if (userFound && playerFound && clanFound)
                {
                    return res.status(201).json(
                    {
                        'ResultCode': 1,
                        'Message': 'Owner changed!”'
                    });
                }
                else
                    return res.status(500).json(
                    {
                        'ResultCode': 3,
                        'Message': 'failed request'
                    });
            });

    }
}
