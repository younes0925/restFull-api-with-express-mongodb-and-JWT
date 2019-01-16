var bcrypt = require('bcrypt');
var jwtUtils = require('../utils/jwt.utils');
var User = require('../models/user');
var Item = require('../models/item');
var asyncLib = require('async');
//Constants
const DATE_REGEX = /^(0[1-9]|[12][0-9]|3[01])[- /.](0[1-9]|1[012])[- /.](19|20)\d\d$/;
var responceConstants = require("../responceConstants");

const serverSecret = "serverSecret_";

module.exports = {
    addEconomy: function(req, res)
    {
        // Getting auth header
        var headerAuth = req.headers['authorization'];

        if (headerAuth != serverSecret)
        {
            return res.status(409).json(
            {
                'ResultCode': 2,
                'Message': responceConstants.serverAuthFailed
            });
        }

        var username = req.body.username;
        var economy = req.body.economy;
        var quantity = Number(req.body.quantity);

        if (username == null || quantity == null)
            return res.status(400).json(
            {
                'ResultCode': 3,
                'Message': responceConstants.missingParameters
            });

        if (economy != 'coins' && economy != 'credits')
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
                    {
                        username: username
                    }, function(err, userFound)
                    {
                        if (userFound)
                            done(null, userFound)
                        else
                            return res.status(500).json(
                            {
                                'ResultCode': 2,
                                'Message': responceConstants.userDoesNotExist
                            });
                    });
                },
                function(userFound, done)
                {
                    console.log(quantity);
                    var Economy = userFound.Economy;
                    if (economy == 'coins')
                    {
                        Economy.Coins += quantity;
                    }
                    else
                    {
                        Economy.Credits += quantity
                    }

                    User.findOneAndUpdate(
                    {
                        username: username
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
                                'Message': responceConstants.unknownError
                            });
                        }
                        done(userFound, updateProfile);
                    });
                }
            ],
            function(userFound, updateProfile)
            {
                if (updateProfile)
                    return res.status(500).json(
                    {
                        'ResultCode': 2,
                        'Message': 'Success, coins/credits added!'
                    });
                else
                    return res.status(500).json(
                    {
                        'ResultCode': 2,
                        'Message': responceConstants.unknownError
                    });
            },
        )
    },

    banPlayer: function(req, res)
    {
        // Getting auth header
        var headerAuth = req.headers['authorization'];

        if (headerAuth != serverSecret)
        {
            return res.status(409).json(
            {
                'ResultCode': 2,
                'Message': responceConstants.serverAuthFailed
            });
        }

        var username = req.body.username;
        var date = req.body.date;

        if (username == null || date == null)
        {
            return res.status(400).json(
            {
                'ResultCode': 3,
                'Message': responceConstants.missingParameters
            });
        }

        if (!DATE_REGEX.test(date))
        {
            return res.status(400).json(
            {
                'ResultCode': 3,
                'Message': 'Date format invalid, try mm-dd-yyyy!'
            });
        }

        date = new Date(date);
        console.log("User will be banned until: " + date);

        asyncLib.waterfall([
                function(done)
                {
                  User.findOne(
                  {
                      username: username
                  }, function(err, userFound)
                    {
                        if (userFound)
                            done(null, userFound)
                        else
                            return res.status(500).json(
                            {
                                'ResultCode': 2,
                                'Message': responceConstants.userDoesNotExist
                            });
                    });
                },
                function(userFound, done)
                {
                    var AdminRequests = {
                        Banned:
                        {
                            Expiry: date
                        }
                    }

                    User.findOneAndUpdate(
                    {
                        username: username
                    },
                    {
                        $set:
                        {
                            AdminRequests: AdminRequests
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
                                'Message': responceConstants.unknownError
                            });
                        }
                        done(userFound, updateProfile);
                    });
                }
            ],
            function(userFound, updateProfile)
            {
                if (updateProfile)
                    return res.status(500).json(
                    {
                        'ResultCode': 2,
                        'Message': '“Success, player has been banned until: ' + date
                    });
                else
                    return res.status(500).json(
                    {
                        'ResultCode': 2,
                        'Message': responceConstants.unknownError
                    });
            },
        )
    },
}
