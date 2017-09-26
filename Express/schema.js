import {makeExecutableSchema} from 'graphql-tools'
import resolvers from './resolvers'

const typeDefs= `
    type Author {
        id:Int
        firstName:String
        lastName:String
        post:[Article]
    }
    type Article {
        postId:ID!
        title:String
        link:String
        post:String
        time:Float
        votes:Int
        author:Author
    }
    type Query {
        author( id:Int! ):Author
    }
    type Mutation{
        upVotes(postId:Int!):Article
    }
`
const schema = makeExecutableSchema({
    typeDefs,
    resolvers
})

export default schema