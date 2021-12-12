const mongoose = require('mongoose'); 
const _ = require("lodash") ; 
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
// jwt secret  
const jwtSecret =  "51778657246321226641fsdklafjasdkljfsklfjd7148924065";
const UserSchema = new mongoose.Schema({
    email : {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 1,
    },
    password: {
        type: String,
        required: true,
        minlength: 8,
    },
    sessions: [{
        token: {
            type: String,
            required: true
        },
        expiresAt: {
            type: Number, 
            required: true,
        }
    }]
}) 

/**********  instans methods  */ 
// we overwrite the default to a json method because we want to omit the fields we dont want to be public 
UserSchema.methods.toJSON = function() {
    const user = this;
    const userObject = user.toObject() ;

        // return the document except the password and sessions (these shouldn't be made available)
    return _.omit(userObject, ['password', 'sessions']); 
} 

// second method generate access token
UserSchema.methods.generateAccessAuthToken = function() {
    const user = this;
    return new Promise((resolve, reject) => {
        // create the Json web oken and return that 
     jwt.sign({ _id: user._id.toHexString() } , jwtSecret, { expiresIn: '15m' }, (err, token) => {
         if (!err) {
             resolve(token);
         } else {
             // there is an error 
             reject() ;
         }
     })
    })
} 

// generateRefreshAuthToken()
UserSchema.methods.generateRefreshAuthToken = function() {
     // This method simply generates a 64byte hex string crypto - it doesn't save it to the database. saveSessionToDatabase() does that.
     return new Promise((resolve, reject) => {
      crypto.randomBytes(64, (err, buf) => {
          if (!err) {
              let token = buf.toString('hex');
              resolve(token) ;
          }
      })
     })
 } 

UserSchema.methods.createSession = function() {
    let user = this ; 
    user.generateAccessAuthToken().then((refreshToken) => {
        return saveSessionToDatabase(user, refreshToken) ;
        //we chain a .then() cuz we we return refreshToken from saveSessionToDatabase() and retrive it back 
    }).then((refreshToken) => {
       // saved to database successfully
        // now return the refresh token
        return refreshToken ;
    }).catch((e) => {
        return Promise.reject('failed to save the session to the database.n\ ' + e)
    })
}


/********** model methods (static models) which mean this methods can be called on the model 
 * not an instance of a model - not a user object but a model of class
 */
UserSchema.statics.findByIdAndToken = function(_id, token) {

    // finds user by id and token
    // used in auth middleware (verifySession)

    let User = this ; 
    return User.findOne({
        _id, 
        "sessions.token": token
    })
}

UserSchema.statics.findByCredentials = function (email, password) {
    let User = this;
    return User.findOne({ email }).then((user) => {
        if (!user) return Promise.reject();

        return new Promise((resolve, reject) => {
            bcrypt.compare(password, user.password, (err, res) => {
                if (res) {
                    resolve(user);
                }
                else {
                    reject();
                }
            })
        })
    })
}

UserSchema.statics.hasRefreshedTokenExpired = (expiresAt) => {
    // to get the seconds 
    let secondsSinceEpoch = Date.now() / 1000 ; 

    if(expiresAt > secondsSinceEpoch) {
        // hasn't expired
       return false;
    } else {
        // hasn expired
        return true;
    }
}

/******* create middlewares to hash the password */ 

// Before a user document is saved, this code runs
UserSchema.pre('save', function(next) {
    let user = this; 
    // determn number of hashing rounds in bcrypt
    let constFactor = 10 ;

    if (user.isModified('password')) {
     // if the password field has been edited/changed then run this code.

     // Generate salt and hash password
     bcrypt.genSalt(constFactor, (err, salt) => {
         bcrypt.hash(user.password, salt, (err, hash) => {
             user.password = hash;
             next() ;
         })
     })
    } else {
        next() ;
    }
})

/* HELPER METHODS */
 // session = () refresh token + expirt time ) 
 let  saveSessionToDatabase = (user, refreshToken) => {
     // save session to database 
     return new Promise((resolve, reject) => {
         let expiresAt = generateRefreshTokenExpiryTime() ;
        // that simply will take the user document and push this object to the sessions array 
         user.sessions.push({'token': refreshToken, expiresAt});

         user.save().then(() => {
             // saved session successfully
             return resolve(refreshToken)
         }).catch((e) => {
             reject(e) ;
         })
     })
 } 

// that will generate a timestap for 10 days 
 let generateRefreshTokenExpiryTime = () => {
     let daysUntilExpire = '10';
     let secondsUntilEpire = ((daysUntilExpire * 24) * 60) * 60 ; 
     return ((Date.now() / 1000) + secondsUntilEpire) ; 
     
 } 

 const User = mongoose.model('User', UserSchema);

 module.exports = { User }