import 'dotenv/config'

import fastifyCors from '@fastify/cors'
import fastifySwagger from '@fastify/swagger'
import ScalarApiReference from '@scalar/fastify-api-reference'
import { fromNodeHeaders } from 'better-auth/node'
import Fastify from 'fastify'
import { jsonSchemaTransform, serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod'

import { auth } from './lib/auth.js'
import { despesaRoutes } from './routes/payables.routes.js'
import { recebimentoRoutes } from './routes/receivables.routes.js'
import { reportRoutes } from './routes/reports.routes.js'

export async function buildApp() {
  const app = Fastify({ logger: true })

  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)

  await app.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'SISGFPA API',
        description: 'API REST do Sistema de Gerenciamento Financeiro para Papelarias - Módulo Financeiro',
        version: '1.0.0',
      },
      servers: [{ description: 'Servidor local', url: `http://localhost:${process.env.PORT ?? 8080}` }],
    },
    transform: jsonSchemaTransform,
  })

  await app.register(ScalarApiReference, {
    routePrefix: '/docs',
    configuration: {
      theme: 'elysiajs',
      sources: [
        { title: 'SISGFPA API', slug: 'sisgfpa-api', url: '/swagger.json' },
        { title: 'Auth API', slug: 'auth-api', url: '/api/auth/open-api/generate-schema' },
      ],
    },
  })

  await app.register(fastifyCors, {
    origin: ['http://localhost:3000'],
    credentials: true,
  })

  // Rotas do módulo financeiro
  await app.register(despesaRoutes, { prefix: '/despesas' })
  await app.register(recebimentoRoutes, { prefix: '/recebimentos' })
  await app.register(reportRoutes, { prefix: '/relatorios' })

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/swagger.json',
    schema: { hide: true },
    handler: async () => app.swagger(),
  })

  // Repassa todas as requisições de autenticação para o Better Auth
  // (cadastro, login, logout, sessão), conforme o padrão do framework.
  app.route({
    method: ['GET', 'POST'],
    url: '/api/auth/*',
    async handler(request, reply) {
      try {
        const url = new URL(request.url, `http://${request.headers.host}`)
        const headers = fromNodeHeaders(request.headers)
        const req = new Request(url.toString(), {
          method: request.method,
          headers,
          ...(request.body ? { body: JSON.stringify(request.body) } : {}),
        })
        const response = await auth.handler(req)
        reply.status(response.status)
        response.headers.forEach((value, key) => reply.header(key, value))
        reply.send(response.body ? await response.text() : null)
      } catch (error) {
        app.log.error(error)
        reply.status(500).send({ error: 'Falha interna de autenticação', code: 'AUTH_FAILURE' })
      }
    },
  })

  return app
}
