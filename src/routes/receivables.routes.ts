import { fromNodeHeaders } from 'better-auth/node'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

import {
  NotFoundError,
  TituloCanceladoError,
  TituloJaLiquidadoError,
  ValorPagamentoInvalidoError,
} from '../errors/index.js'
import { auth } from '../lib/auth.js'
import {
  CreateRecebimentoBodySchema,
  ErrorSchema,
  ListRecebimentosQuerySchema,
  ListRecebimentosResponseSchema,
  RecebimentoComHistoricoSchema,
  RecebimentoParamsSchema,
  RecebimentoSchema,
  RegistrarBaixaRecebimentoBodySchema,
  UpdateRecebimentoBodySchema,
} from '../schemas/index.js'
import { CancelarRecebimento } from '../usecases/CancelarRecebimento.js'
import { CreateRecebimento } from '../usecases/CreateRecebimento.js'
import { GetRecebimentoComHistorico } from '../usecases/GetRecebimentoComHistorico.js'
import { ListRecebimentos } from '../usecases/ListRecebimentos.js'
import { RegistrarBaixaRecebimento } from '../usecases/RegistrarBaixaRecebimento.js'
import { UpdateRecebimento } from '../usecases/UpdateRecebimento.js'

export const recebimentoRoutes = (app: FastifyInstance) => {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/',
    schema: {
      tags: ['Recebimentos'],
      summary: 'Cadastrar título de recebimento',
      body: CreateRecebimentoBodySchema,
      response: { 201: RecebimentoSchema, 401: ErrorSchema, 500: ErrorSchema },
    },
    handler: async (request, reply) => {
      try {
        const session = await auth.api.getSession({
          headers: fromNodeHeaders(request.headers),
        })
        if (!session) {
          return reply.status(401).send({ error: 'Não autenticado', code: 'UNAUTHORIZED' })
        }

        const createRecebimento = new CreateRecebimento()
        const result = await createRecebimento.execute({
          descricao: request.body.descricao,
          cliente: request.body.cliente,
          valor: request.body.valor,
          dataVencimento: request.body.dataVencimento,
          criadoPorId: session.user.id,
        })

        return reply.status(201).send(result)
      } catch (error) {
        app.log.error(error)
        return reply.status(500).send({ error: 'Erro interno do servidor', code: 'INTERNAL_SERVER_ERROR' })
      }
    },
  })

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/',
    schema: {
      tags: ['Recebimentos'],
      summary: 'Listar títulos de recebimento ',
      querystring: ListRecebimentosQuerySchema,
      response: { 200: ListRecebimentosResponseSchema, 401: ErrorSchema, 500: ErrorSchema },
    },
    handler: async (request, reply) => {
      try {
        const session = await auth.api.getSession({
          headers: fromNodeHeaders(request.headers),
        })
        if (!session) {
          return reply.status(401).send({ error: 'Não autenticado', code: 'UNAUTHORIZED' })
        }

        const listRecebimentos = new ListRecebimentos()
        const result = await listRecebimentos.execute({
          status: request.query.status,
          page: request.query.page,
          pageSize: request.query.pageSize,
        })

        return reply.status(200).send(result)
      } catch (error) {
        app.log.error(error)
        return reply.status(500).send({ error: 'Erro interno do servidor', code: 'INTERNAL_SERVER_ERROR' })
      }
    },
  })

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/:id',
    schema: {
      tags: ['Recebimentos'],
      summary: 'Buscar recebimentos com histórico e baixas',
      params: RecebimentoParamsSchema,
      response: { 200: RecebimentoComHistoricoSchema, 401: ErrorSchema, 404: ErrorSchema, 500: ErrorSchema },
    },
    handler: async (request, reply) => {
      try {
        const session = await auth.api.getSession({
          headers: fromNodeHeaders(request.headers),
        })
        if (!session) {
          return reply.status(401).send({ error: 'Não autenticado', code: 'UNAUTHORIZED' })
        }

        const getRecebimentoComHistorico = new GetRecebimentoComHistorico()
        const result = await getRecebimentoComHistorico.execute({ id: request.params.id })

        return reply.status(200).send(result)
      } catch (error) {
        app.log.error(error)

        if (error instanceof NotFoundError) {
          return reply.status(404).send({ error: error.message, code: 'NOT_FOUND' })
        }

        return reply.status(500).send({ error: 'Erro interno do servidor', code: 'INTERNAL_SERVER_ERROR' })
      }
    },
  })

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/:id',
    schema: {
      tags: ['Recebimentos'],
      summary: 'Atualizar título de recebimento ',
      params: RecebimentoParamsSchema,
      body: UpdateRecebimentoBodySchema,
      response: { 200: RecebimentoSchema, 400: ErrorSchema, 401: ErrorSchema, 404: ErrorSchema, 500: ErrorSchema },
    },
    handler: async (request, reply) => {
      try {
        const session = await auth.api.getSession({
          headers: fromNodeHeaders(request.headers),
        })
        if (!session) {
          return reply.status(401).send({ error: 'Não autenticado', code: 'UNAUTHORIZED' })
        }

        const updateRecebimento = new UpdateRecebimento()
        const result = await updateRecebimento.execute({
          id: request.params.id,
          descricao: request.body.descricao,
          cliente: request.body.cliente,
          valor: request.body.valor,
          dataVencimento: request.body.dataVencimento,
          usuarioId: session.user.id,
        })

        return reply.status(200).send(result)
      } catch (error) {
        app.log.error(error)

        if (error instanceof NotFoundError) {
          return reply.status(404).send({ error: error.message, code: 'NOT_FOUND' })
        }
        if (error instanceof TituloCanceladoError) {
          return reply.status(400).send({ error: error.message, code: 'TITULO_CANCELADO' })
        }
        if (error instanceof TituloJaLiquidadoError) {
          return reply.status(400).send({ error: error.message, code: 'TITULO_JA_LIQUIDADO' })
        }

        return reply.status(500).send({ error: 'Erro interno do servidor', code: 'INTERNAL_SERVER_ERROR' })
      }
    },
  })

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/:id/cancelar',
    schema: {
      tags: ['Recebimentos'],
      summary: 'Cancelar título de recebimento - somente ADMIN',
      params: RecebimentoParamsSchema,
      response: {
        200: RecebimentoSchema,
        400: ErrorSchema,
        401: ErrorSchema,
        403: ErrorSchema,
        404: ErrorSchema,
        500: ErrorSchema,
      },
    },
    handler: async (request, reply) => {
      try {
        const session = await auth.api.getSession({
          headers: fromNodeHeaders(request.headers),
        })
        if (!session) {
          return reply.status(401).send({ error: 'Não autenticado', code: 'UNAUTHORIZED' })
        }

        const role = (session.user as unknown as { role: 'ADMIN' | 'FUNCIONARIO' }).role
        if (role !== 'ADMIN') {
          return reply
            .status(403)
            .send({ error: 'Você não tem permissão para realizar esta ação', code: 'FORBIDDEN' })
        }

        const cancelarRecebimento = new CancelarRecebimento()
        const result = await cancelarRecebimento.execute({ id: request.params.id, usuarioId: session.user.id })

        return reply.status(200).send(result)
      } catch (error) {
        app.log.error(error)

        if (error instanceof NotFoundError) {
          return reply.status(404).send({ error: error.message, code: 'NOT_FOUND' })
        }
        if (error instanceof TituloCanceladoError) {
          return reply.status(400).send({ error: error.message, code: 'TITULO_CANCELADO' })
        }
        if (error instanceof TituloJaLiquidadoError) {
          return reply.status(400).send({ error: error.message, code: 'TITULO_JA_LIQUIDADO' })
        }

        return reply.status(500).send({ error: 'Erro interno do servidor', code: 'INTERNAL_SERVER_ERROR' })
      }
    },
  })

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/:id/baixas',
    schema: {
      tags: ['Recebimentos'],
      summary: 'Registrar baixa total ou parcial de recebimento',
      params: RecebimentoParamsSchema,
      body: RegistrarBaixaRecebimentoBodySchema,
      response: { 200: RecebimentoSchema, 400: ErrorSchema, 401: ErrorSchema, 404: ErrorSchema, 500: ErrorSchema },
    },
    handler: async (request, reply) => {
      try {
        const session = await auth.api.getSession({
          headers: fromNodeHeaders(request.headers),
        })
        if (!session) {
          return reply.status(401).send({ error: 'Não autenticado', code: 'UNAUTHORIZED' })
        }

        const registrarBaixaRecebimento = new RegistrarBaixaRecebimento()
        const result = await registrarBaixaRecebimento.execute({
          id: request.params.id,
          valor: request.body.valor,
          recebidoEm: request.body.recebidoEm,
          usuarioId: session.user.id,
        })

        return reply.status(200).send(result)
      } catch (error) {
        app.log.error(error)

        if (error instanceof NotFoundError) {
          return reply.status(404).send({ error: error.message, code: 'NOT_FOUND' })
        }
        if (error instanceof TituloCanceladoError) {
          return reply.status(400).send({ error: error.message, code: 'TITULO_CANCELADO' })
        }
        if (error instanceof TituloJaLiquidadoError) {
          return reply.status(400).send({ error: error.message, code: 'TITULO_JA_LIQUIDADO' })
        }
        if (error instanceof ValorPagamentoInvalidoError) {
          return reply.status(400).send({ error: error.message, code: 'VALOR_INVALIDO' })
        }

        return reply.status(500).send({ error: 'Erro interno do servidor', code: 'INTERNAL_SERVER_ERROR' })
      }
    },
  })
}
