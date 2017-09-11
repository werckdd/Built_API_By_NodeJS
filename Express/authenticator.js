var OAUTH = require('oauth').OAuth
var config = require('./config.json')

//Create the oauth object for accessing Twitter
var oauth = new OAUTH(
    config.request_token_url,
    config.access_token_url,
    config.consumer_key,
    config.consumer_secret,
    config.oauth_version,
    config.oauth_callback,
    config.oauth_signature,
)

module.exports = {
    redirectToTwitterLoginPage = (req, req) => {
        //Ask Twitter for a request token
    }
}