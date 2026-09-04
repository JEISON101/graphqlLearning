# GraphQL Learn

Proyecto de aprendizaje que integra **AdonisJS** con **GraphQL Yoga**. El objetivo es mostrar, de forma sencilla, como una peticion HTTP llega a GraphQL, como se valida contra un schema y como un resolver produce la respuesta.

## Stack

- AdonisJS 7
- GraphQL 17
- GraphQL Yoga 5
- TypeScript

## Puesta en marcha

Instala las dependencias y levanta el servidor en modo desarrollo:

```bash
npm install
npm run dev
```

Con la configuracion local habitual, el endpoint queda disponible en:

```text
POST http://localhost:3333/graphql
```

## Archivos importantes

| Archivo | Responsabilidad |
| --- | --- |
| [`start/routes.ts`](start/routes.ts) | Registra la ruta HTTP `POST /graphql` y la conecta con el controller. |
| [`app/controllers/graphql.controller.ts`](app/controllers/graphql.controller.ts) | Adapta la peticion de AdonisJS al formato que espera GraphQL Yoga y devuelve su respuesta. |
| [`app/graphql/schema.ts`](app/graphql/schema.ts) | Define el contrato GraphQL (`typeDefs`) y la implementacion de cada campo (`resolvers`). |
| [`app/models/user.ts`](app/models/user.ts) | Modelo Lucid para usuarios persistidos. Actualmente no es usado por el resolver `users`. |
| [`database/schema.ts`](database/schema.ts) | Define el schema Lucid de la tabla de usuarios para la capa de base de datos. |

## Flujo de una peticion
### 1. Ruta: `start/routes.ts`

La ruta es el primer punto de entrada:

```ts
router.post('/graphql', [GraphqlController, 'handle'])
```

Esto significa que solo las peticiones `POST` dirigidas a `/graphql` se envian a `GraphqlController.handle`. Las rutas REST de autenticacion y perfil viven aparte bajo `/api/v1`.

### 2. Controller: `app/controllers/graphql.controller.ts`

El controller no contiene la logica de cada consulta. Su responsabilidad es servir de puente entre AdonisJS y Yoga:

1. Obtiene la URL completa de la peticion.
2. Lee el body cuando el metodo es `POST`.
3. Convierte el body a JSON para conservar el formato GraphQL.
4. Copia metodo y headers hacia `yoga.fetch`.
5. Envia al cliente el texto de la respuesta generada por Yoga.

La instancia de Yoga se crea una sola vez con el schema importado:

```ts
const yoga = createYoga({ schema })
```

### 3. Schema: `app/graphql/schema.ts`

El schema tiene dos piezas principales:

- **`typeDefs`**: describe que operaciones y tipos conoce GraphQL.
- **`resolvers`**: indica que codigo se ejecuta para obtener el valor de cada campo.

Actualmente se definen:

```graphql
type Query {
  hello: String!
  saludo: String
  users: [User!]!
}

type User {
  id: String!
  name: String!
  email: String!
  urlFoto: String
}
```

`!` significa que el valor no puede ser `null`. Por ejemplo, `hello` siempre debe devolver un texto y `users` siempre debe devolver una lista. `urlFoto` puede ser `null` porque no tiene `!`.

Los resolvers actuales son:

```ts
Query: {
  hello: () => 'Hola GraphQL!',
  saludo: () => 'Hola GraphQL! desde saludo',
  users: () => users,
}
```

GraphQL ejecuta solo los campos que el cliente solicita. Por eso una consulta puede pedir una seleccion distinta de campos sin crear endpoints separados.

## Probar GraphQL

Consulta simple:

```bash
curl http://localhost:3333/graphql \
  -X POST \
  -H 'content-type: application/json' \
  --data '{"query":"{ hello saludo }"}'
```

Respuesta esperada:

```json
{
  "data": {
    "hello": "Hola GraphQL!",
    "saludo": "Hola GraphQL! desde saludo"
  }
}
```

Consulta de usuarios seleccionando solo algunos campos:

```bash
curl http://localhost:3333/graphql \
  -X POST \
  -H 'content-type: application/json' \
  --data '{"query":"{ users { id name urlFoto } }"}'
```

Una respuesta posible es:

```json
{
  "data": {
    "users": [
      {
        "id": "1",
        "name": "Juan",
        "urlFoto": "https://example.com/juan.jpg"
      },
      {
        "id": "2",
        "name": "Maria",
        "urlFoto": null
      }
    ]
  }
}
```

Si la consulta solicita un campo que no existe o rompe las reglas del schema, GraphQL devuelve un objeto `errors` en lugar de ejecutar una respuesta valida.

## Como agregar una operacion

Para agregar un campo nuevo, normalmente se necesitan dos cambios en `app/graphql/schema.ts`:

1. Declarar el campo en `typeDefs`.
2. Implementar un resolver con el mismo nombre dentro de `resolvers.Query`.

Ejemplo:

```graphql
type Query {
  version: String!
}
```

```ts
resolvers: {
  Query: {
    version: () => '1.0.0',
  },
}
```

El nombre es el enlace entre ambas partes. Si se declara el campo pero no se implementa su resolver, la operacion no tendra el comportamiento esperado.

## Estado actual y siguiente paso

El resolver `users` usa el arreglo local `users` de `app/graphql/schema.ts`. El modelo [`app/models/user.ts`](app/models/user.ts) y la base SQLite pertenecen a la capa Lucid, pero todavia no estan conectados a GraphQL.

Para llevar este ejemplo a datos reales, el resolver deberia consultar `User` y devolver los registros persistidos:

```ts
users: () => User.all()
```

En una aplicacion real conviene separar esa consulta en un servicio o repositorio, añadir autenticacion cuando corresponda y definir mutations y variables para operaciones que reciban datos.

## Resumen

```text
Cliente
  -> POST /graphql
  -> start/routes.ts
  -> GraphqlController.handle
  -> yoga.fetch(...)
  -> schema.typeDefs valida la consulta
  -> schema.resolvers ejecuta la logica
  -> GraphQL devuelve exactamente los campos solicitados
```
