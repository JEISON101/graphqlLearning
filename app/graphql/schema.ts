import { createSchema } from 'graphql-yoga'

const users = [
  {
    id: '1',
    name: 'Juan',
    email: 'juan@gmail.com',
    urlFoto: 'https://example.com/juan.jpg',
  },
  {
    id: '2',
    name: 'Maria',
    email: 'maria@gmail.com',
    urlFoto: null,
  },
  {
    id: '3',
    name: 'Pedro',
    email: 'pedro@gmail.com',
    urlFoto: 'https://example.com/pedro.jpg',
  },
]

export const schema = createSchema({
  /*
    IMPORTANTE

    los typeDesfs son las operaciones 
    que graphql puede ejecutar, es decir, los queries y mutations que se pueden realizar.
    en este caso tenemos una operacion llamada Query
    la cual tiene un campo llamado hello que retorna un string y el ! es para indicar que no
    puede ser null.
  */
  typeDefs:`
    type Query {
      hello: String!,
      saludo: String,
      users: [User!]!
    },
    type User {
      id: String!,
      name: String!,
      email: String!,
      urlFoto: String
    }
  `,


  /*
    --RESOLVERS--
    Estos son los encargados de ejecutar la logica de negocio de cada operacion, es decir,
    cuando se ejecute la operacion hello, este resolver se encargara de retornar el string 'Hola GraphQL!'.

    estos son los que terminan conectando con nuestra logica
  */
  resolvers: {
    Query: {
      hello: () => 'Hola GraphQL!',
      saludo: () => 'Hola GraphQL! desde saludo',
      users: () => users
    }
  },
})

/*
  podemos hacer una solicitud de hello y la lista de usuarios
  con los campos que deseamos tener en cada objeto:

  BODY JSON
  {
    "query": "{hello  users{id, name, urlFoto} }"
  }
*/