var express = require('express')
var url = require('url')
var config = require('./config')
var authenticator = require('./authenticator')
var app = express()


app.use(require('cookie-parser')())

app.get('/auth/twitter', authenticator.redirectToTwitterLoginPage);

//callback url when user is redirected to after signing in
app.get(url.parse(config.oauth_callback).path, (req, res) => {
    authenticator.authenticate(req, res, (err) => {
        if (err) {
            console.log(err)
            //401, Unauthorized，未授权
            res.sendStatus(401)
        } else {
            res,send('Authentication Successfull!!')
        }
    })
})


var server = app.listen(config.port, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Example app listening at http://%s:%s', host, port);
});