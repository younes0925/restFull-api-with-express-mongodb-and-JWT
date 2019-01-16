//import
var bcrypt = require('bcrypt');
var jwtUtils = require('../utils/jwt.utils');
var User = require('../models/user');
var Item = require('../models/item');
var asyncLib = require('async');
//Constants
const DATE_REGEX = /^(0[1-9]|[12][0-9]|3[01])[- /.](0[1-9]|1[012])[- /.](19|20)\d\d$/;

//Routes
module.exports = {

    buyWeapon: function(req, res)
    {
        // Getting auth header
        var headerAuth = req.headers['authorization'];
        var userId = jwtUtils.getUserId(headerAuth);

        if (userId < 0)
        {
            return res.status(409).json(
            {
                'ResultCode': 2,
                'Message': 'optional Auth Failed message'
            });
        }

        var username = req.body.username;
        var itemId = req.body.itemId;
        var currencyType = req.body.currencyType;

        if (username == null || itemId == null)
            return res.status(200).json(
            {
                'ResultCode': 3,
                'Message': 'username or itemId empty'
            });

        if (currencyType != 'coins' && currencyType != 'credits')
        {
            return res.status(200).json(
            {
                'ResultCode': 3,
                'Message': 'invalid currency Type'
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
                                'Message': 'unable to verify user'
                            });
                    });
                },
                function(userFound, done)
                {
                    Item.findOne(
                    {
                        _id: itemId
                    }, function(err, itemFound)
                    {
                        if (itemFound)
                            done(null, userFound, itemFound)
                        else
                            return res.status(500).json(
                            {
                                'ResultCode': 2,
                                'Message': 'unable to verify item'
                            });
                    });
                },
                function(userFound, itemFound, done)
                {
                    var itemId = itemFound.id;
                    User.findOne(
                    {
                        $and: [
                        {
                            _id: userId
                        },
                        {
                            Purchased:
                            {
                                "$in": itemId
                            }
                        }]
                    }, function(err, itemExist)
                    {
                        if (!itemExist)
                            done(null, userFound, itemFound)
                        else
                            return res.status(500).json(
                            {
                                'ResultCode': 2,
                                'Message': 'item already exists'
                            });
                    });
                },
                function(userFound, itemFound, done)
                {

                    if (userFound && itemFound)
                    {
                        if (currencyType == 'coins')
                        {

                            if (userFound.Economy.Coins < itemFound.Coins)
                            {
                                return res.status(500).json(
                                {
                                    'ResultCode': 2,
                                    'Message': 'Failed, not enough coins'
                                });
                            }
                            var newCoins = userFound.Economy.Coins - itemFound.Coins;
                            var Economy = {
                                Credits: userFound.Economy.Coins,
                                Coins: newCoins,
                            }
                            User.findByIdAndUpdate(
                                userId,
                                {
                                    $set:
                                    {
                                        Economy: Economy
                                    }
                                },
                                {
                                    new: true
                                },
                                function(err, updateProfile)
                                {
                                    if (err)
                                    {
                                        return res.status(500).json(
                                        {
                                            'ResultCode': 2,
                                            'Message': 'cannot log on server'
                                        });
                                    }
                                    done(null, userFound, itemFound, updateProfile);
                                });

                        }
                        else
                        {
                            if (userFound.Economy.Credits < itemFound.Credits)
                            {
                                return res.status(500).json(
                                {
                                    'ResultCode': 2,
                                    'Message': 'Failed, not enough credits'
                                });
                            }
                            var newCredits = userFound.Economy.Credits - itemFound.Credits;
                            var Economy = {
                                Credits: newCredits,
                                Coins: userFound.Economy.Credits,
                            }
                            User.updateOne(
                            {
                                _id: userId
                            },
                            {
                                $set:
                                {
                                    Economy: Economy
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
                                        'Message': 'cannot log on server--'
                                    });
                                }
                                done(null, userFound, itemFound, updateProfile);
                            });
                        }
                    }
                },
                function(userFound, itemFound, updateProfile, done)
                {
                    if (updateProfile)
                    {
                        console.log(itemFound.id);
                        User.updateOne(
                        {
                            _id: userId
                        },
                        {
                            $push:
                            {
                                Purchased: itemFound.id
                            }
                        }, function(err, weaponBuy)
                        {
                            if (weaponBuy)
                                done(userFound, itemFound, weaponBuy)
                            else
                                return res.status(500).json(
                                {
                                    'ResultCode': 2,
                                    'Message': 'unable to verify user'
                                });
                        });

                    }
                    else
                        return res.status(500).json(
                        {
                            'ResultCode': 2,
                            'Message': 'Error with request.'
                        });
                },

            ],
            function(userFound, itemFound, weaponBuy, done)
            {

                if (weaponBuy)
                    return res.status(201).json(
                    {
                        'ResultCode': 1,
                        'Message': 'Success, weapon purchased!'
                    });
                else
                    return res.status(500).json(
                    {
                        'ResultCode': 2,
                        'Message': 'cannot log on server'
                    });
            }
        )
    },

    retrieveWeapon: function(req, res)
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
        if (username == null)
            return res.status(200).json(
            {
                'ResultCode': 3,
                'Message': 'username empty'
            });

        console.log(username);

        asyncLib.waterfall([
                function(done)
                {
                    User.findOne(
                    {
                        username: username
                    }, function(err, userFound)
                    {
                        if (userFound)
                        {
                            done(userFound)
                        }
                        else
                            return res.status(500).json(
                            {
                                'ResultCode': 2,
                                'Message': 'unable to verify user'
                            });
                    });
                },
            ],
            function(userFound, done)
            {
                if (userFound)
                    return res.status(201).json(
                    {
                        'ResultCode': 1,
                        'PurchasedWeapons': userFound.Purchased
                    });
                else
                    return res.status(500).json(
                    {
                        'ResultCode': 2,
                        'Message': 'cannot log on server'
                    });
            },
        )
    },

    retrieveBalance: function(req, res)
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
        if (username == null)
            return res.status(200).json(
            {
                'ResultCode': 3,
                'Message': 'username empty'
            });

        console.log(username);

        asyncLib.waterfall([
                function(done)
                {
                    User.findOne(
                    {
                        username: username
                    }, function(err, userFound)
                    {
                        if (userFound)
                        {
                            done(userFound)
                        }
                        else
                            return res.status(500).json(
                            {
                                'ResultCode': 2,
                                'Message': 'user not found '
                            });
                    });
                },
            ],
            function(userFound, done)
            {
                if (userFound)
                {
                    var Economy = userFound.Economy;
                    return res.status(201).json(
                    {
                        'ResultCode': 1,
                        'Coins': Economy.Coins,
                        'Credits': Economy.Credits,
                    });
                }
                else
                    return res.status(500).json(
                    {
                        'ResultCode': 2,
                        'Message': 'cannot log on server'
                    });
            },
        )
    },
}
