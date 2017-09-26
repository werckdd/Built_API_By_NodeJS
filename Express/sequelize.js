import Sequelize from 'sequelize'
import casual from 'casual'

const db = new Sequelize('blogPost', 'root', '13866458645qian', {
    host:'localhost',
    dialect: 'mysql',
    port:3306,
    pool: {
        max: 5,
        min: 0,
        idle:10000
    }
})

const AuthorModel = db.define('author', {
    firstName: { type: Sequelize.STRING },
    lastName:{type:Sequelize.STRING}
})

const PostModel = db.define('post', {
    title: { type: Sequelize.STRING },
    text:{type:Sequelize.STRING}
})

AuthorModel.hasMany(PostModel)
PostModel.belongsTo(AuthorModel)

//create mock data with a seed,so we always get a repeatable random sequence:
casual.seed(123)

db.sync({ force: true }).then(() => {
    return AuthorModel.create({
        firstName: casual.first_name,
        lastName: casual.last_name,
    })
}).then((author) => {
    return author.createPost({
        title:`A post by ${author.firstName}`,
        text:casual.sentences(3),
    })
})

const Auhtor = db.models.author
const Post = db.models.post

export  {Auhor,Post}