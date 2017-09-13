var https = require('https')
var url = require('url')
var fs = require('fs')

const config = require('./config.json')

const dataStamp = (new Date()).valueOf

module.exports = {
    redirectToGithubLoginPage: (req, res) => {
        //时间戳

        /**
         * 1.用户点击github登录本地应用引导用户跳转到第三方授权页 跳转地址为:
         * https://github.com/login/oauth/authorize?client_id=xxxxx&state=xxx&redirect_uri=xxxx;
         * (client_id 上面已经拿到了,state参数随机数防止跨站请求伪造攻击,redirect_uri 就是你上面填的Authorization callback URL)
         */
        const authorizeUrl = `${config.authorize_url}?client_id=${config.clientID}&redirect_uri=${config.oauth_callback}&scope=${config.scope}&state=123&allow_signup=false`
        res.redirect(authorizeUrl)

    },
    /**
     * 2.通过第一步的请求，如果用户正确授权，换取的code和上一步传输的state
     * 会被服务器作为回调参数，放在你在这里配置的回调地址上
     */
    authenticate: (req, res, cb) => {
        const code = req.query.code
        const headers = req.headers
        /**
         * 3.带着这个code再次访问github,注意这里加入了clientSecret变量
         *  为了获取access_token
         */
        const accessUrl = `${config.access_token_url}?client_id=${config.clientID}&client_secret=${config.clientSecret}&code=${code}&redirect_uri=${config.oauth_callback}&state=123`
        const options = {
            host: 'github.com',
            path: url.parse(accessUrl).path,
            headers: { 'Accept': 'application/json' }
        }

        let htmlPage= new String
        //发起node的https模块的post请求
        //注意，这里有个坑，用http.request,不管是用POST或者GET方法都得不到res
        const result = https.get(options, (res) => {
            res.setEncoding('utf8')

            res.on('data', chunk => {
                //得到access_token值
                const accessToken = JSON.parse(chunk).access_token
                /**
                 * 4.用得到的access_token值访问https://api.github.com/user?access_token=
                 *  或者把放在头文件中"Authorization": "token 参数"
                 */
                
                const userUrl = `${config.user_info_url}?access_token=${accessToken}`
                console.log(userUrl)
                const options = {
                    host: 'api.github.com',
                    path: url.parse(userUrl).path,
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'wreckdd'
                    }
                }
                
                https.get(options, res => {
                    res.setEncoding('utf8')
                    
                    res.on('data', chunk => {
                        htmlPage += chunk
                        console.log(chunk)
                    })
                    res.on('end', () => {
                        fs.writeFile(__dirname + '/page.html', htmlPage, err => {
                            console.log('File Created')
                        })
                        cb(htmlPage)
                    })
                    
                })
            })
        })


    }
}