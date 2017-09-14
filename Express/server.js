var express = require('express')
var url = require('url')
var config = require('./config')
var bodyParser = require('body-parser')
var querystring = require('querystring')

var authenticator = require('./GithubAuthenticator')
var app = express()

//利用cookie-parser读取cookie req.cookie
app.use(require('cookie-parser')())
//解析application/json,将结果封装到req.body
app.use(bodyParser.json())
// parse application/x-www-form-urlencoded ,extended:false使用第三方库querystring来解析
app.use(bodyParser.urlencoded({ extended: false }))

app.get('/auth/github', authenticator.redirectToGithubLoginPage);

/**
 * url.parse将URL字符串转换成对象并返回。比如'http://example.com:8080/one?a=index&t=article&m=default'
 * 对象为{
    protocol : 'http' ,
    auth : null ,
    host : 'example.com:8080' ,
    port : '8080' ,
    hostname : 'example.com' ,
    hash : null ,
    search : '?a=index&t=article&m=default',
    query : 'a=index&t=article&m=default',
    pathname : '/one',
    path : '/one?a=index&t=article&m=default',
    href : 'http://example.com:8080/one?a=index&t=article&m=default'
}
 */ 
app.get(url.parse(config.oauth_callback).path, (req, res) => {
    authenticator.authenticate(req, res, (repo) => {
        if (repo) {
            res.setHeader('content-type', 'text/html')
            res.send(repo)
            console.log('already send')
            res.end()
        } else {
            res.sendStatus(401)
        }
    } )
})

//入口路径
app.get('/', (req, res) => {
    if(!req.cookie.)
})


var server = app.listen(config.port, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Example app listening at http://%s:%s', host, port);
});