import { gql } from "apollo-server";

//Schema
const typeDefs = gql`
  type Frame {
    html: String!
  }

  input FrameInput {
    source: String!
  }

  type Import {
    id: String!
    html: String!
  }
`;

export interface iFrame {
  html: string;
}

export interface iNewFrameInput {
  source: string;
}

export interface iImport {
  id: string;
  html: string;
}

export default typeDefs;
