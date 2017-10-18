import client from './redis';
import { Author, Post } from './sequelize';

const resolvers = {
  Query: {
    author: (root, { id }, { client }) => {
      try {
        return {
          id,
        };
      } catch (error) {
        return null;
      }
    },
  },
  Mutation: {
    upVotes: async (parent, { key, value }, { client }) => {
      try {
        await article_vote(client, user, article);
        return true;
      } catch (e) {
        console.error(e);
        return false;
      }
    },
  },
  Author: {
    post: author => [
      {
        id: 1, title: 'A post', text: 'Some text', views: 2,
      },
      {
        id: 2, title: 'Another post', text: 'Some other text', views: 14,
      },
    ],
  },
  Post: {
    author: post => ({ id: 1, firstName: 'Hello', lastName: 'World' }),
  },
};

const ONE_WEEK_IN_SECONDS = 7 * 86400;
const VOTE_SCORE = 432;
const ARTICLE_PER_PAGE = 25;

const post_article = async (conn, user, title, link) => {
  const article_id = await conn.incr('article:');

  const voted = `voted:${article_id}`;
  await conn.sadd(voted, user);
  // 给已经投票用户集合设置过期时间
  await conn.expire(voted, ONE_WEEK_IN_SECONDS);

  // 添加文章
  const article = `article:${article_id}`;
  // 发布时间
  const now = Date.now();
  await conn.hmset(article, {
    title,
    link,
    poster: user,
    time: now,
    votes: 1,
  });

  await conn.zadd('time:', now, article);
  await conn.zadd('score:', 1 * VOTE_SCORE + now, article);

  return article_id;
};

// 为文字投票
const article_vote = async (conn, user, article, approval = true) => {
  // 如果离发布时间超过1周，取消投票
  if (Date.now() - conn.zscore('time:', article) > cutoff) return false;

  const article_id = article.split(':')[1];
  // redis不支持回滚，事务失败时不进行回滚，而是继续执行余下的命令，所以等于不支持事务性，这里其实起不到原子性作用
  if (approval) {
    await conn
      .multi()
      .sadd(`voted:${article_id}`, user)
      .zincrby('score:', VOTE_SCORE, article)
      .hincrby(article, 'votes', 1)
      .exec((error, replies) => {
        console.log(replies.slice(-1)[0][1]);
      });
  } else {
    await conn
      .multi()
      .sadd(`voted:${article_id}`, user)
      .zdecrby('score:', VOTE_SCORE, article)
      .hdecrby(article, 'votes', 1)
      .exec((error, replies) => {
        console.log(replies.slice(-1)[0][1]);
      });
  }
};

// 获取第几页评分最高的文章和最新发布的文章
const get_articles = async (conn, page, order = 'score:') => {
  // 起始索引和结束索引
  const start = (page - 1) * ARTICLE_PER_PAGE;
  const end = start + ARTICLE_PER_PAGE - 1;

  let ids = [];
  const articles = [];
  const article_data = {};

  const result = await conn.zrevrange(order, start, end);
  ids = result;
  for (const id of ids) {
    const replies = await conn.hgetall(id);
    article_data[id] = replies;
  }

  return article_data;
};

// 分组
const add_remove_groups = async (
  conn,
  article_id,
  to_add = [],
  to_remove = [],
) => {
  article = `article${article_id}`;

  for (const group of to_add) {
    await conn.sadd(`group${group}`, article);
  }
  for (const group of to_remove) {
    await conn.srem(`group${group}`, article);
  }
};

const get_group_articles = async (conn, group, page, order = 'score:') => {
  const key = `order${group}`;

  const result = await conn.exists(key);
  // 判断是否已经缓存排序结果，如果没有就现在排序
  if (!result) {
    const t = await conn.zinterstore(key, 2, [`groups:${group}`, order]);
  }
  // 为了减少redis的工作量，将排序后的集合缓存60s
  await conn.expire(key, 60);

  return get_articles(conn, key);
};

/**
 *
 * @param {*} token
 */
// 尝试获取并且返回令牌对应的用户
const check_token = async (conn, token) => conn.hget('login:', token);

const update_token = async (conn, token, user, item = 0) => {
  timestamp = Date.now();
  await conn.hset('login:', token, user);
  // 记录令牌最后一次出现的时间
  await conn.zadd('recent:', token, timestamp);
  if (item) {
    await conn.zadd(`viewed:${token}`, timestamp, token);
    // 只保留用户最近浏览的过的25个商品
    await conn.zremreangebyrank(`viewd:${token}`, 0, -26);
  }
};

const clean_sessions = (conn) => {
  const QUIT = false;
  const LIMIT = 10000000;
  while (!QUIT) {
    size = conn.zcard('recent:');
    if (size <= LIMIT) return null;
    const end_index = Math.min(size - LIMIT, 100);
    tokens = conn.zrange('recent:', 0, end_index - 1);

const session_keys = [];
  for (const token of tokens) {
      session_keys.push(`viewed:${token}`);
    }
    conn.delete();
  }
};

export default resolvers;
