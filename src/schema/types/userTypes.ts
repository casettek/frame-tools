import {gql} from 'apollo-server';

//Schema
const typeDefs = gql`

    type User {
        id: ID
        name: String
        surname: String
        email: String,
        creationDate: String
    }

    input UserInput {
        name: String!
        surname: String!
        email: String!
        password: String!
    }

    input AuthInput {
        email: String!
        password: String!
    }

    type Token {
        token: String
    }

`;

export interface iUserInput{
    name: string;
    surname: string;
    email: string;
    password: string;
}

export interface iAuthInput{
    email: string;
    password: string;
}

export default typeDefs;