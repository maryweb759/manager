
const express = require('express')
const app = express();
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
// server listning port 
const port = 3000 

// load in all mongoose model
const mongoose = require('./db/mongoose')

const { List, Task, User } = require('./db/modules');
//const {  Task } = require('./db/modules/task.model');

/********** start middleware */

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json()); 

// enable cors  middleware from https://enable-cors.org/server_expressjs.html website 
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, HEAD, OPTIONS, PUT, PATCH, DELETE");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-access-token, x-refresh-token, _id");

  res.header(
      'Access-Control-Expose-Headers',
      'x-access-token, x-refresh-token'
  );

  next();
});

// check whether the request has a valid JWT access token
let authenticate = (req, res, next) => {
 let token = req.header('x-access-token'); 

 // verify the jwt 
 jwt.verify(token, User.getJWTSecret() , (err, decoded) => {
   if(err) {
      // there was an error
      // jwt is invalid - * DO NOT AUTHENTICATE * 
      res.status(401).send(err) ;
   } else {
     // jwt is valid
     req.user_id = decoded._id ;
     next() ;
   }
 } )
}

// Verify Refresh Token Middleware (which will be verifying the session) 
// create a variable cuz we want to applie it just for some routes
let verifySession = (req, res, next ) => {
      // grab the refresh token from the request header
      let refreshToken = req.header('x-refresh-token') ;

      // grab the _id from the request header
      let _id = req.header('_id') ;

      User.findByIdAndToken(_id, refreshToken).then((user) => {
        if (!user) {
          // user couldn't be found
          return Promise.reject({
            'error': 'user not found, make sure that the refresh token and the user _id are correct '
          });
        } 

        // if the code reaches here - the user was found
        // therefore the refresh token exists in the database - but we still have to check if it has expired or not

        req.user_id = user._id;
        req.userObject = user;
        req.refreshToken = refreshToken;

        let isSessionValid = false; 

        user.sessions.forEach((session) => {
          if (session.token === refreshToken) {
           // check if the session has expired 
           if (User.hasRefreshTokenExpired(session.expiresAt) === false) {
             // refresh token has not expired
             isSessionValid = true;
           }
          }
        }); 

        if (isSessionValid) {
          // the session is VALID - call next() to continue with processing this web request 
          next();
        } else {
          // the session is not valid 
          return Promise.reject({
            'error': 'refresh token has expired or the session is not valid'
          })
        }
      }).catch((e) => {
        res.status(401).send(e);
      })

}
/********** end middleware */

/** router handlers */

/* 
*GET/ Lists
*purpose: GET all lists 
*/
app.get('/lists',authenticate, async (req, res) => {
    // we want to return an array of all  the lists in the database
  List.find({
    _userId: req.user_id
  }).then((lists) => {
    res.send(lists)
  }).catch((e)=> {
    console.log(e);
  })
 
})

/* 
*POST/ Lists
*purpose: create a list
*/
app.post('/lists', authenticate, async (req, res) => {
    // we want to create a new list and return the new list document back to the user (whick include the id)
    // the list information (fields) would be passed via the json request body 
    let title = req.body.title;
    let newList = new List({
      title,
      _userId: req.user_id
    });

    newList.save().then((listDoc) => {
      // we send the response to see what we have saved
      res.send(listDoc)
     })

})

/* 
*PATCH/ Lists/:id
*purpose: update a specific list
*/
app.patch('/lists/:id', authenticate,  (req, res) => {
    // we want to update the specific (list document with the id in the url) with the new values specified
    // in the json body of the request 
    List.findOneAndUpdate({ _id: req.params.id, _userId: req.user_id }, {
      $set: req.body
    }).then(() => {
      res.send({'message': 'updated successfully'})
    })
})

/* 
*DELETE/ Lists/:id
*purpose: delete a specific list
*/
app.delete('/lists/:id', authenticate, (req, res) => {
    // we want to delete the specific (list document with the id in the url) 
    List.findOneAndRemove({
       _id: req.params.id,
      _listId: req.user_id
    }).then((removedListDoc) => {
      res.send(removedListDoc)
    })
})

/**
 * GET: /lists/:listId/tasks
 * purpose: get all tasks in a specifique list 
 */
app.get('/lists/:listId/tasks', authenticate, (req, res) => {
  // we want to return all the tasks that belongs to a specifique list
  Task.find({
    _listId: req.params.listId
  }).then((tasks) => {
    res.send(tasks)
  })
})

/**
 * GET: /lists/:listId/tasks/:taskId
 * purpose: get all tasks in a specifique list 
 */
app.get('/lists/:listId/tasks/:taskId', authenticate, (req, res) => {
  // we want to return all the tasks that belongs to a specifique list
  Task.findOne({
    _id: req.params.taskId,
    _listId: req.params.listId
  }).then((task) => {
    res.send(task)
  })
})


/**
 * POST: /lists/:listId/tasks
 * purpose: post new tasks in a specifique list 
 */
app.post('/lists/:listId/tasks', authenticate, (req, res) => {
  // we want to create new task to a specifique list

  // first we want to check wether or not currently authenticated user have access to the listId that passed in here
  List.findOne({
    _id: req.params.listId,
    _userId: req.user_id
  }).then((list) => {
    if (list) {
      // list object with the specified conditions was found
      // therefore the currently authenticated user can create new tasks
      return true;
    } 
    return false
  }).then((canCreateTask) => {
    if (canCreateTask) {
      let newTask = Task({
        title: req.body.title,
        _listId: req.params.listId
      })
      newTask.save().then((newTaskDoc) => {
        // we send the response to see what we have saved
        res.send(newTaskDoc)
       })
    } else {
      res.sendStatus(404) ;
    }
  })

 
})

/**
 * PATCH: /lists/:listId/tasks/:id
 * purpose: edit specific task in a specifique list 
 */
 app.patch('/lists/:listId/tasks/:taskId', authenticate, (req, res) => {
  // we want to edit task to a specifique list

  List.findOne({
    _id: req.params.listId,
    _userId: req.user_id
  }).then((list) => {
    if (list) {
      // list object with the specified conditions was found
      // therefore the currently authenticated user can make updates to tasks within this list
      return true;
    } 

      // else - the list object is undefined
     return false
  }).then((canUpdateTask) => {
    if (canUpdateTask) {
      // the currently authenticated user can update tasks
      Task.findOneAndUpdate({
        _id: req.params.taskId,
        _listId: req.params.listId
       }, {
         $set: req.body,
     }
     ).then(() => {
       res.send({ message: 'updated successfully'});  })
     
    } else {
       res.sendStatus(404);
    }
  })

  
});

/**
 * DELETE: /lists/:listId/tasks/:id
 * purpose: DELETE specific task in a specifique list 
 */
 app.delete('/lists/:listId/tasks/:taskId', authenticate, (req, res) => {
  // we want to delete task to a specifique list
  List.findOne({
    _id: req.params.listId,
    _userId: req.user_id
  }).then((list) => {
    if (list) {
     // list object with the specified conditions was found
     // therefore the currently authenticated user can make updates to tasks within this list
    return true;
    } else {

      // else - the list object is undefined
      return false;
    }
  }).then((canDeleteTask) => {
    if(canDeleteTask) {
      Task.findOneAndRemove({
        _id: req.params.taskId,
        _listId: req.params.listId
       }
       ).then((removedTaskDoc) => {
       res.send(removedTaskDoc);
   
       // delete all the tasks that are in the deleted list
       deleteTasksFromList(removedTaskDoc._id);
     })
    } else {
      res.sendStatus(404);
    }
  })

  
  
})

/****** user route
 * post/users
 * Purpose: sing in
 *  */ 
app.post('/users', (req, res) => {
  let body = req.body
  let newUser = new User(body) ;
  newUser.save().then(() => {
    return newUser.createSession() ;
  }).then((refreshToken) => {
    // Session created successfully - refreshToken returned.
        // now we geneate an access auth token for the user
        return newUser.generateAccessAuthToken().then((accessToken) => {
        // access auth token generated successfully, now we return an object containing the auth tokens
          return { accessToken, refreshToken }
        })
  }).then((authTokens) => {
        // Now we construct and send the response to the user with their auth tokens in the header and the user object in the body
        res
        .header('x-refresh-token', authTokens.refreshToken)
        .header('x-access-token', authTokens.accessToken)
        .send(newUser);
   }).catch((e) => {
     res.status(400).send(e) ;
   })
})

/**
 * POST /users/login
 * Purpose: Login
 */
 app.post('/users/login', (req, res) => {
  let email = req.body.email;
  let password = req.body.password;

  User.findByCredentials(email, password).then((user) => {
      return user.createSession().then((refreshToken) => {
          // Session created successfully - refreshToken returned.
          // now we geneate an access auth token for the user

          return user.generateAccessAuthToken().then((accessToken) => {
              // access auth token generated successfully, now we return an object containing the auth tokens
              return { accessToken, refreshToken }
          });
      }).then((authTokens) => {
          // Now we construct and send the response to the user with their auth tokens in the header and the user object in the body
          res
              .header('x-refresh-token', authTokens.refreshToken)
              .header('x-access-token', authTokens.accessToken)
              .send(user);
      })
  }).catch((e) => {
      res.status(400).send(e);
  });
})


/**
 * GET /users/me/access-token
 * Purpose: generates and returns an access token 
 * before we implement this we need some middleware to verifie that the caller is autherazied  access this route
 */
app.get('/users/me/access-token',verifySession, (req, res) => {
    // we know that the user/caller is authenticated and we have the user_id and user object available to us
    req.userObject.generateAccessAuthToken().then((accessToken) => {
      res.header('x-access-token', accessToken).send({ accessToken }); 
    }).catch((e) => {
      res.status(400).send(e);
    })
})

/* HELPER METHODS */
let deleteTasksFromList = (_listId) => {
  Task.deleteMany({
    _listId
  }).then(()=> {
    console.log("tasks from " + _listId + "were deleted");
  })
}

app.listen(port, () => {
  console.log(`taskManager app listening at http://localhost:${port}`)
})

