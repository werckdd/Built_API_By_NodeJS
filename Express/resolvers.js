import client from './redis'
import  { Author, Post } from './sequelize'

const resolvers = {
    Query: {
        author: (root, { id },  { client }) => {
            try {
                return {
                    id
                    
                }
            } catch (error) {
                return null
            }
        }        
    },
    Mutation: {
        upVotes: async (parent, { key, value }, { client }) => {
            try {
                await article_vote(client, user, article)
                return true
            } catch (e) {
                console.error(e)
                return false
            }
        }
    },    
    Author: {
        post: (author) => [
            { id: 1, title: 'A post', text: 'Some text', views: 2 },
            { id: 2, title: 'Another post', text: 'Some other text', views: 14 }
        ]
    },
    Post: {
        author:(post) => ( {id:1,firstName:'Hello',lastName:'World'} )
    }
}

const ONE_WEEK_IN_SECONDS = 7 * 86400
const VOTE_SCORE = 432
const ARTICLE_PER_PAGE=25

const post_article = (conn, user, title, link) => {
    let article_id =0
    conn.incr('article:', (err, result) => {
        article_id = result
    })

    let voted = 'voted:' + article_id
    conn.sadd(voted, user)
    //给已经投票用户集合设置过期时间
    conn.expire(voted, ONE_WEEK_IN_SECONDS)
    
    //添加文章
    let article = 'article:' + article_id
    //发布时间
    let now = Date.now()
    conn.hmset(article, {
        title: title,
        link: link,
        poster: user,
        time: now,
        votes:1
    })

    conn.zadd('time:', now, article)
    conn.zadd('score:', 1 * VOTE_SCORE + now, article)
    
    return article_id
}

const article_vote = (conn, user, article) => {

    let cutoff = Date.now() - ONE_WEEK_IN_SECONDS
    if (conn.zscore('time:', article) < cutoff) return false
    
    let article_id = article.split(':')[1]
    //tranction
    conn.multi()
        .sadd(`voted:${ article_id }`, user)
        .zincrby('score:', VOTE_SCORE ,article)
        .hincrby(article, 'votes', 1)
        .exec((error, replies) => {
            console.log(replies.slice(-1)[0][1])
        })
      
}

//获取第几页评分最高的文章和最新发布的文章
const get_articles = (conn, page, order = 'score') => {
    //起始索引和结束索引
    let start = (page - 1) * ARTICLE_PER_PAGE
    let end = start + ARTICLE_PER_PAGE - 1
    
    const ids = []
        articles = []
        article_data = {}
    conn.zrevrange(order, start, end).then(result => {
        ids=result
    })
    for (let id of ids) {
        client.hgetall(id).then(result => {
            article_data[id] = result
        })
    }
    return article_data
}

//分组
const add_remove_groups = (conn, article_id, to_add = [], to_remove = [])=>{
    article = 'article' + article_id
    
    for (let group of to_add) {
        conn.sadd('group'+group,article)
    }
    for (let group of to_remove) {
        conn.srem('group'+group,article)
    }
}

export default resolvers