//import
var bcrypt = require('bcrypt');
var jwtUtils = require('../utils/jwt.utils');
var User = require('../models/user');
var Item = require('../models/item');
var Clan = require('../models/clan');
var asyncLib = require('async');
var nodemailer = require('nodemailer');
var generator = require('../utils/secureCodeGenerator');

var responceConstants = require("../responceConstants");

//Constants
const EMAIL_REGEX = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const PASSWORD_REGEX = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{4,8}$/;

const SENDGRID_USERNAME = "SENDGRID_USERNAME";
const SENDGRID_PASSWORD = "SENDGRID_PASSWORD";
//Routes
module.exports = {

    register: function(req, res)
    {
        //Params
        var email = req.body.email;
        var password = req.body.password;
        var confirmPassword = req.body.confirmPassword;
        var username = req.body.username;

        if (email == null || password == null || username == null)
            return res.status(400).json(
            {
                'ResultCode': 3,
                'Message': responceConstants.missingParameters
            });

        if (password != confirmPassword)
            return res.status(400).json(
            {
                'ResultCode': 3,
                'Message': "Your passwords don't match!"
            });

        if (username.length >= 15 || username.length <= 4)
            return res.status(400).json(
            {
                'ResultCode': 3,
                'Message': 'Your username must be 5 - 15 characters!'
            });

        if (!EMAIL_REGEX.test(email))
            return res.status(400).json(
            {
                'ResultCode': 3,
                'Message': 'Please check your email is valid.'
            });

        if (!PASSWORD_REGEX.test(password))
            return res.status(400).json(
            {
                'ResultCode': 3,
                'Message': responceConstants.invalidPassword
            });

        asyncLib.waterfall([
                function(done)
                {
                    User.findOne(
                    {
                        email: email
                    }, function(err, userFound)
                    {
                        if (userFound)
                            return res.status(400).send(
                            {
                                'ResultCode': 3,
                                'Message': 'The email address you have entered is already associated with another account, if you believe this is an error, please contact support.'
                            });
                        done(null, userFound);
                    })
                },
                function(userFound, done)
                {
                    User.findOne(
                    {
                        username: username
                    }, function(err, userFound)
                    {
                        // Make sure user doesn't already exist
                        if (userFound)
                        {
                            return res.status(400).send(
                            {
                                'ResultCode': 3,
                                'Message': 'The username you have entered is taken, please try a different one!'
                            });
                        }
                        done(null, userFound);
                    })
                },
                function(userFound, done)
                {
                    if (!userFound)
                    {
                        bcrypt.hash(password, 5, function(err, bcryptedPassword)
                        {
                            done(null, userFound, bcryptedPassword);
                        });
                    }
                    else
                    {
                        return res.status(409).json(
                        {
                            'ResultCode': 3,
                            'Message': responceConstants.unknownError
                        });
                    }
                },
                function(userFound, bcryptedPassword, done)
                {
                    var newUser = new User(
                    {
                        email: email,
                        username: username,
                        password: bcryptedPassword,
                        Token: jwtUtils.generateToken(email)
                    });

                    newUser.save(function(err)
                    {
                        if (err)
                        {
                            return res.status(500).send(
                            {
                                'ResultCode': 3,
                                'Message': "There was an error saving the user: " + err.message
                            });
                        }
                        done(null, newUser);
                    })
                },
                function(newUser, done)
                {
                    // Create a verification token for this user
                    // Send the email
                    var transporter = nodemailer.createTransport(
                    {
                        service: 'gmail',
                        auth:
                        {
                            user: SENDGRID_USERNAME,
                            pass: SENDGRID_PASSWORD
                        }
                    });
                    var mailOptions = {
                        from: 'support@northearthstudios.com',
                        to: newUser.email,
                        subject: 'RedShift Account Verification',
                        text: 'Welcome to RedShift!,\n\n' + 'Please verify your account by clicking the link: \nhttp:\/\/' + req.headers.host + '/api/users/confirmation?token=' + newUser.Token + '.\n'
                    };
                    transporter.sendMail(mailOptions, function(err)
                    {
                        if (err)
                        {
                            return res.status(500).send(
                            {
                                'ResultCode': 3,
                                'Message': err.message
                            });
                        }
                    });
                    done(newUser);
                }
            ],
            function(newUser)
            {
                if (newUser)
                    return res.status(201).json(
                    {
                        'ResultCode': 1,
                        'Message': 'A verification email has been sent to ' + newUser.email + '.',
                        'Username': newUser.username,
                        'Economy': newUser.Economy.Credits,
                        'Credits': newUser.Economy.Coins
                    });
                else
                    return res.status(500).json(
                    {
                        'ResultCode': 3,
                        'Message': 'An unknown error occured while creating your account!'
                    });
            });
    },

    login: function(req, res)
    {
        var email = req.body.email;
        var password = req.body.password;

        if (email == null || password == null)
            return res.status(200).json(
            {
                'ResultCode': 3,
                'Message': responceConstants.missingParameters
            });

        asyncLib.waterfall([
                function(done)
                {
                    User.findOne(
                    {
                        email: email
                    }, function(err, userFound)
                    {
                        if (userFound)
                            done(null, userFound)
                        else
                            return res.status(500).json(
                            {
                                'ResultCode': 2,
                                'Message': responceConstants.checkEmail
                            });
                    });
                },
                function(userFound, done)
                {
                    if (userFound)
                    {
                        bcrypt.compare(password, userFound.password, function(errBycrypt, resBycrypt)
                        {
                            done(null, userFound, resBycrypt);
                        });
                    }
                    else
                    {
                        return res.status(409).json(
                        {
                            'ResultCode': 2,
                            'Message': responceConstants.checkEmail
                        });
                    }
                },
                function(userFound, bcryptedPassword, done)
                {
                    if (bcryptedPassword)
                    {
                        done(userFound);
                    }
                    else
                    {
                        return res.status(409).json(
                        {
                            'ResultCode': 2,
                            'Message': responceConstants.checkCredentials
                        });
                    }
                }
            ],
            function(userFound)
            {
                if (!userFound.isVerified)
                    return res.status(401).send(
                    {
                        'ResultCode': 3,
                        'Message': 'Your account has not been verified.'
                    });
                if (userFound)
                    return res.status(201).json(
                    {
                        'ResultCode': 1,
                        'Message': 'Authentication success!',
                        'Token': jwtUtils.generateTokenForUser(userFound),
                        'Username': userFound.username,
                        'Economy': userFound.Economy.Credits,
                        'Credits': userFound.Economy.Coins
                    });
                else
                    return res.status(500).json(
                    {
                        'ResultCode': 2,
                        'Message': 'Unknown error processign your request!'
                    });
            });
    },

    getUserProfile: function(req, res)
    {
        // Getting auth header
        var headerAuth = req.headers['authorization'];
        var userId = jwtUtils.getUserId(headerAuth);

        if (userId < 0)
            return res.status(409).json(
            {
                'ResultCode': 2,
                'Message': responceConstants.authFailed
            });

        User.findById(
        {
            _id: userId
        }, function(err, userFound)
        {
            if (err)
                return res.status(500).json(
                {
                    'ResultCode': 2,
                    'Message': 'An unknown error occured while processing your request.'
                });

            if (userFound)
                return res.status(201).json(
                {
                    'ResultCode': 1,
                    'Message': 'User Profile',
                    'user': userFound,
                });
            else
                return res.status(404).json(
                {
                    'ResultCode': 2,
                    'error': 'This user can not be found.'
                });
        });
    },

    updateUserProfile: function(req, res)
    {
        // Getting auth header
        var headerAuth = req.headers['authorization'];
        var userId = jwtUtils.getUserId(headerAuth);

        if (userId < 0)
            return res.status(409).json(
            {
                'ResultCode': 2,
                'Message': responceConstants.authFailed
            });

        //Params
        var email = req.body.email;
        var password = req.body.password;
        var username = req.body.username;

        if (email == null || password == null || username == null)
            return res.status(400).json(
            {
                'ResultCode': 3,
                'Message': responceConstants.missingParameters
            });

        if (username.length >= 15 || username.length <= 4)
            return res.status(400).json(
            {
                'ResultCode': 3,
                'Message': 'Your username must be 5 - 15 characters!'
            });

        if (!EMAIL_REGEX.test(email))
            return res.status(400).json(
            {
                'ResultCode': 3,
                'Message': 'Please check your email is valid.'
            });

        if (!PASSWORD_REGEX.test(password))
            return res.status(400).json(
            {
                'ResultCode': 3,
                'Message': responceConstants.invalidPassword
            });

        asyncLib.waterfall([
                function(done)
                {
                    bcrypt.hash(password, 5, function(err, bcryptedPassword)
                    {
                        done(bcryptedPassword);
                    });
                }
            ],
            function(bcryptedPassword)
            {
                User.findByIdAndUpdate(
                    userId,
                    {
                        $set:
                        {
                            email: email,
                            password: bcryptedPassword,
                            username: username
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
                                'Message': responceConstants.unknownError
                            });
                        }
                        return res.status(201).json(
                        {
                            'ResultCode': 1,
                            'Message': 'Profile Updated',
                            'RESULT ': updateProfile
                        });
                    });
            }
        )
    },

    confirmation: function(req, res)
    {

        var __token = req.query.token;
        var __email = jwtUtils.getUserEmail(__token);

        if (!__email)
            return res.status(409).json(
            {
                'ResultCode': 2,
                'Message': responceConstants.authFailed
            });


        if (__token == null || __email == null)
            return res.status(400).json(
            {
                'ResultCode': 3,
                'Message': responceConstants.missingParameters
            });

        // Find a matching token
        User.findOne(
        {
            Token: __token
        }, function(err, token)
        {
            if (!token) return res.status(400).send(
            {
                'ResultCode': 2,
                'Message': 'We were unable to find a valid token. Your token my have expired.'
            });

            // If we found a token, find a matching user
            User.findOne(
            {
                email: __email
            }, function(err, user)
            {
                if (!user) return res.status(400).send(
                {
                    'ResultCode': 2,
                    'Message': 'We were unable to find a user for this token.'
                });
                if (user.isVerified) return res.status(400).send(
                {
                    'ResultCode': 3,
                    'Message': 'This user has already been verified.'
                });

                // Verify and save the user
                user.isVerified = true;
                user.save(function(err)
                {
                    if (err)
                    {
                        return res.status(500).send(
                        {
                            'ResultCode': 3,
                            'Message': err.message
                        });
                    }
                    res.status(200).send(
                    {
                        'ResultCode': 1,
                        'Message': 'Thanks, your account has now been verified. You can now login!'
                    });
                });
            });
        });

    },

    resend: function(req, res)
    {
        var __email = req.body.email;

        if (__email == null || __email == "")
        {
            return res.status(400).json(
            {
                'ResultCode': 3,
                'Message': responceConstants.missingParameters
            });
        }
        console.log(__email);
        User.findOneAndUpdate(
            {
                email: __email
            },
            {
                $set:
                {
                    Token: jwtUtils.generateToken(__email)
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
                        'ResultCode': 3,
                        'Message': responceConstants.unknownError
                    });
                }
                if (updateProfile != null)
                {
                    // Send the email
                    var transporter = nodemailer.createTransport(
                    {
                        service: 'gmail',
                        auth:
                        {
                            user: SENDGRID_USERNAME,
                            pass: SENDGRID_PASSWORD
                        }
                    });
                    var mailOptions = {
                        from: 'support@northearthstudios.com',
                        to: updateProfile.email,
                        subject: 'RedShift Account Verification',
                        text: 'Welcome to RedShift!,\n\n' + 'Please verify your account by clicking the link: \nhttp:\/\/' + req.headers.host + '/api/users/confirmation?token=' + updateProfile.Token + '.\n'
                    };
                    transporter.sendMail(mailOptions, function(err)
                    {
                        if (err)
                        {
                            return res.status(500).send(
                            {
                                'ResultCode': 3,
                                'Message': err.message
                            });
                        }
                        res.status(200).send(
                        {
                            'ResultCode': 3,
                            'Message': 'A verification email has been sent to ' + updateProfile.email + ', please allow up to 5 minutes to recieve the email and try checking your spam folder, if it still doesnt arrive please contact support.'
                        });
                    });
                }
                else
                {
                    return res.status(500).json(
                    {
                        'ResultCode': 2,
                        'Message': 'No user with that email has been found!'
                    });
                }
            });
    },

    ForgotPassword: function(req, res)
    {
        var __email = req.body.email;

        if (__email == null || __email == "")
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
                    var secure_code = generator.generateSecureCode(8);
                    bcrypt.hash(secure_code, 5, function(err, bcryptedSecureCode)
                    {
                        done(secure_code, bcryptedSecureCode);
                    });
                }
            ],
            function(secure_code, bcryptedSecureCode)
            {
                User.findOneAndUpdate(
                    {
                        email: __email
                    },
                    {
                        $set:
                        {
                            Token: bcryptedSecureCode
                        }
                    },
                    {
                        new: true
                    },
                    function(err, userFound)
                    {
                        if (err)
                        {
                            return res.status(500).json(
                            {
                                'ResultCode': 2,
                                'Message': 'No user with that email has been found!'
                            });
                        }
                        // Send the email
                        var transporter = nodemailer.createTransport(
                        {
                            service: 'gmail',
                            auth:
                            {
                                user: SENDGRID_USERNAME,
                                pass: SENDGRID_PASSWORD
                            }
                        });
                        var mailOptions = {
                            from: 'support@northearthstudios.com',
                            to: userFound.email,
                            subject: 'RedShift Password Recovery',
                            text: 'Hello,\n\n' + 'Forgot your password? Don’t worry it happens to us too! \n You should use this code to reset your password: ' + secure_code + '\n'
                        };
                        transporter.sendMail(mailOptions, function(err)
                        {
                            if (err)
                            {
                                return res.status(500).send(
                                {
                                    'ResultCode': 3,
                                    'Message': err.message
                                });
                            }
                            res.status(200).send(
                            {
                                'ResultCode': 1,
                                'Message': 'An email with instructions on how to reset your password has been sent to: ' + userFound.email + '.'
                            });
                        })

                    });
            }
        )
    },

    NewPassword: function(req, res)
    {
        var secureCode = req.body.secureCode;
        var password = req.body.password;
        var email = req.body.email;

        if (secureCode == null || password == null || password == email)
        {
            return res.status(400).json(
            {
                'ResultCode': 3,
                'Message': responceConstants.missingParameters
            });
        }

        if (!PASSWORD_REGEX.test(password))
        {
            return res.status(400).json(
            {
                'ResultCode': 3,
                'Message': responceConstants.invalidPassword
            });
        }

        asyncLib.waterfall([
                function(done)
                {
                    User.findOne(
                    {
                        email: email
                    }, function(err, userFound)
                    {
                        if (userFound)
                            done(null, userFound)
                        else
                            return res.status(500).json(
                            {
                                'ResultCode': 2,
                                'Message': responceConstants.checkEmail
                            });
                    });
                },
                function(userFound, done)
                {
                    if (userFound)
                    {
                        bcrypt.compare(secureCode, userFound.Token, function(errBycrypt, resBycryptSecureCode)
                        {
                            done(null, userFound, resBycryptSecureCode);
                        });
                    }
                    else
                    {
                        return res.status(409).json(
                        {
                            'ResultCode': 2,
                            'Message': responceConstants.unknownError
                        });
                    }
                },
                function(userFound, resBycryptSecureCode, done)
                {
                    if (resBycryptSecureCode)
                    {
                        bcrypt.hash(password, 5, function(err, bcryptedPassword)
                        {
                            done(userFound, bcryptedPassword);
                        });
                    }
                    else
                    {
                        return res.status(409).json(
                        {
                            'ResultCode': 2,
                            'Message': responceConstants.unknownError
                        });
                    }
                }
            ],
            function(userFound, bcryptedPassword)
            {
                User.findOneAndUpdate(
                    {
                        email: email
                    },
                    {
                        $set:
                        {
                            password: bcryptedPassword
                        }
                    },
                    {
                        new: true
                    },
                    function(err, userFound)
                    {
                        if (err)
                        {
                            return res.status(500).json(
                            {
                                'ResultCode': 2,
                                'Message': responceConstants.unknownError
                            });
                        }

                        // Send the email
                        var transporter = nodemailer.createTransport(
                        {
                            service: 'gmail',
                            auth:
                            {
                                user: SENDGRID_USERNAME,
                                pass: SENDGRID_PASSWORD
                            }
                        });
                        var mailOptions = {
                            from: 'support@northearthstudios.com',
                            to: userFound.email,
                            subject: 'RedShift Password Recovery',
                            text: 'Just a confirmation email to say that your password has been changed successfully, if you believe this to be an error, please contact support.'
                        };
                        transporter.sendMail(mailOptions, function(err)
                        {
                            if (err)
                            {
                                return res.status(500).send(
                                {
                                    'ResultCode': 2,
                                    'Message': responceConstants.unknownError
                                });
                            }
                            res.status(200).send(
                            {
                                'ResultCode': 1,
                                'Message': 'A email of confirmation has been sent to ' + userFound.email + '.'
                            });
                        })

                    });
            }
        )
    },
}
