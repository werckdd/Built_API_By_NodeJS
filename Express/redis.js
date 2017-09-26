import Redis from 'ioredis'

const client = new Redis()


client.on("error", err => {
    console.log("Error " + err);
});

//插入数据
client.flushall()
client.hmset('article:1', {
    title: 'Go to statement considered harmful',
    link: 'https://www.baidu.com',
    poster: 'user:1',
    time: '1331382699.33',
    votes:528
})
client.set('article:',3)
client.zadd('time:', [1332065417.47, 'article:3', 1332075503.49, 'article:2', 1331382699.33,'article:1'])
client.zadd('score:', [1332174713.47, 'article:3', 1332225027.26, 'article:2',1332164163.49, 'article:1'])
client.sadd('voted:1', ['user:1', 'user:2', 'user:3', 'user:4', 'user:5'])
//group
client.sadd('groups:programming',['article:1','article:3'])

//redis不支持回滚，事务失败时不进行回滚，而是继续执行余下的命令，所以等于不支持事务性
client.sadd('voted:1', 'user:8', (error, result) => {
    if (result) {
        client.zincrby('score:', 432, 'article:1', (error, result) => {
            if (result) {
                client.hincrby('article:1', 'votes', 1, (error, result) => {
                    console.log(result)
                })
            }
        })
    }
})

const get_group_articles = async (conn, group, order = 'score:') => {
    let key = `order:${group}`
    
    const result = await conn.exists(key)
    //判断是否已经缓存排序结果，如果没有就现在排序
    if (!result) {
        const t = await conn.zinterstore(key, 2, [`groups:${group}`, order])
    }
    //为了减少redis的工作量，将排序后的集合缓存60s
    await conn.expire(key, 60)

    return get_articles(conn, key)
    
}
const get_articles = async (conn, order = 'score:') => {

    let ids = []
    let articles = []
    let article_data = {}

    const result = await conn.zrevrange(order, 0, -1)
    ids = result
    for (let id of ids) {
        const replies = await client.hgetall(id)
        article_data[id] = replies
    }

    return article_data

}

get_group_articles(client, 'programming', 'score:').then(result => {
    console.log(result)
})


export default client
