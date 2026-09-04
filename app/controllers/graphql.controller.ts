import type { HttpContext } from '@adonisjs/core/http'
import { createYoga } from 'graphql-yoga'
import { schema } from '../graphql/schema.ts'

const yoga = createYoga({
  schema
})

export default class GraphqlController {
  async handle({ request, response }: HttpContext) {
    const url = new URL(request.url(), `${request.protocol()}://${request.host()}`)

    const body = request.method() === 'POST'
      ? JSON.stringify(request.body())
      : undefined

    const yogaResponse = await yoga.fetch(
      url, 
      {
        method: request.method(),
        headers: request.headers(),
        body
      }
    )
    return response.send(await yogaResponse.text())
  }
}