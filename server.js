var express = require('express');
var app = express();
var cors = require('cors');
var path = require('path');
var rp = require('request-promise');
var config = require('./local.env.js');
var helpers = require('./helpers.js');

app.use(cors());
app.use(express.static('public'));

var access_token = null;
var refresh_token = null;



/* Home page */
app.get('/', function(req, res) {
  console.log('Home')
  res.sendFile(path.join(__dirname + "/index.html")); 
});

app.post('/', function(req, res) {
  console.log('Home');
  res.sendFile(path.join(__dirname + "/index.html")); 
})

app.get('/registered', function(req,res) {
  console.log('Registered');
  res.sendFile(path.join(__dirname + "/registered.html"));
});

/* Connects with a fitbit device */
app.get('/registerDev', function (req, res, next) {
  console.log('In registerDev');
  res.redirect(config.authUrl());
});

/* Handles the fitbit callback upon registering a device */
app.get('/fitbit/authenticated', function (req, res, next) {
    console.log('Handled redirect');
    var code = req.query.code;

  // GET ACCESS TOKEN
  // https://dev.fitbit.com/docs/oauth2/#access-token-request
  var op = {
    uri: 'https://api.fitbit.com/oauth2/token',
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + config.client_encoded,
    },
    form: {
      client_id: config.clientId,
      grant_type: 'authorization_code',
      redirect_uri: config.redirect_uri,
      code: code
    }
  };
  rp(op)
    .then(function (tokens) {
      var parsed = JSON.parse(tokens);
      access_token = parsed.access_token;
      refresh_token = parsed.refresh_token;
      helpers.printTokens(tokens);
      res.redirect('/registered');
    })
    .catch(function (err) {
      res.status(500).send({error: err});
    });
});

/* Pulls the activity data */
app.get('/pullactivities', function(req, res, done) {
  console.log("Pull sleep - access token: " + access_token);
  var date = '2017-03-29';
   var importUri = 'https://api.fitbit.com/1/user/-/activities/date/' + date + '.json';
      var options = {
        uri: importUri,
        method: 'GET',
        headers: {
          'Authorization': 'Bearer ' + access_token
        },
        json: true // Automatically parses the JSON string in the response
      };
       return rp(options).then(function(body) {
        var originalActivitiesData = body.activities;
        console.log('Original Activities Data: ' + JSON.stringify(originalActivitiesData, null, 2));
        var dateComponents = date.split('-');
        var day = new Date(dateComponents[0], dateComponents[1] - 1, dateComponents[2]);
 
        console.log("Is it null? " + originalActivitiesData === null);
        console.log("Length: " + originalActivitiesData.length);
        console.log('Sub 0: ' + JSON.stringify(originalActivitiesData[0], null, 2));
        if (originalActivitiesData === null || originalActivitiesData.length === 0) {
          console.log('Unable to parse activities data response.'); // also could be that there's no activity data?
          done();
          return;
        }

        var ret = {}
        for (var i = 0; i < originalActivitiesData.length; i++) {
          var originalActivityData = originalActivitiesData[i];
          var activityData = {
            source: 'fitbit',
            day: day,
            type: originalActivityData.type,
            startDate: originalActivityData.startTime,
            runDuration: originalActivityData.duration,   // returned in miliseconds
            runDistance: originalActivityData.distance    // steps and miles are both converted to kilometers
          };
          ret['act' + i] = activityData;
          /* var query = {              // ongo specific
            owner: activityData.owner,
            source: activityData.source,
            day: activityData.day
          }; */
        }
        console.log("Before done");
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(ret));
        done();
      }, function(err) {
        console.log(err);
        throw err;
      });

})

app.listen(3000);