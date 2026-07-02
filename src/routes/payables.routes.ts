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
  CreateDespesaBodySchema,
  DespesaComHistoricoSchema,
  DespesaParamsSchema,
  DespesaSchema,
  ErrorSchema,
  ListDespesasQuerySchema,
  ListDespesasResponseSchema,
  RegistrarPagamentoDespesaBodySchema,
  UpdateDespesaBodySchema,
} from '../schemas/index.js'
import { CancelarDespesa } from '../usecases/CancelarDespesa.js'
import { CreateDespesa } from '../usecases/CreateDespesa.js'
import { GetDespesaComHistorico } from '../usecases/GetDespesaComHistorico.js'
import { ListDespesas } from '../usecases/ListDespesas.js'
import { RegistrarPagamentoDespesa } from '../usecases/RegistrarPagamentoDespesa.js'
import { UpdateDespesa } from '../usecases/UpdateDespesa.js'

export const despesaRoutes = (app: FastifyInstance) => {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/',
    schema: {
      tags: ['Despesas'],
      summary: 'Cadastrar título de despesa',
      body: CreateDespesaBodySchema,
      response: { 201: DespesaSchema, 401: ErrorSchema, 500: ErrorSchema },
    },
    handler: async (request, reply) => {
      try {
        const session = await auth.api.getSession({
          headers: fromNodeHeaders(request.headers),
        })
        if (!session) {
          return reply.status(401).send({ error: 'Não autenticado', code: 'UNAUTHORIZED' })
        }

        const createDespesa = new CreateDespesa()
        const result = await createDespesa.execute({
          descricao: request.body.descricao,
          fornecedor: request.body.fornecedor,
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
      tags: ['Despesas'],
      summary: 'Listar títulos de despesa',
      querystring: ListDespesasQuerySchema,
      response: { 200: ListDespesasResponseSchema, 401: ErrorSchema, 500: ErrorSchema },
    },
    handler: async (request, reply) => {
      try {
        const session = await auth.api.getSession({
          headers: fromNodeHeaders(request.headers),
        })
        if (!session) {
          return reply.status(401).send({ error: 'Não autenticado', code: 'UNAUTHORIZED' })
        }

        const listDespesas = new ListDespesas()
        const result = await listDespesas.execute({
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
      tags: ['Despesas'],
      summary: 'Buscar despesa com histórico e pagamentos',
      params: DespesaParamsSchema,
      response: { 200: DespesaComHistoricoSchema, 401: ErrorSchema, 404: ErrorSchema, 500: ErrorSchema },
    },
    handler: async (request, reply) => {
      try {
        const session = await auth.api.getSession({
          headers: fromNodeHeaders(request.headers),
        })
        if (!session) {
          return reply.status(401).send({ error: 'Não autenticado', code: 'UNAUTHORIZED' })
        }

        const getDespesaComHistorico = new GetDespesaComHistorico()
        const result = await getDespesaComHistorico.execute({ id: request.params.id })

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
      tags: ['Despesas'],
      summary: 'Atualizar título de despesa ',
      params: DespesaParamsSchema,
      body: UpdateDespesaBodySchema,
      response: { 200: DespesaSchema, 400: ErrorSchema, 401: ErrorSchema, 404: ErrorSchema, 500: ErrorSchema },
    },
    handler: async (request, reply) => {
      try {
        const session = await auth.api.getSession({
          headers: fromNodeHeaders(request.headers),
        })
        if (!session) {
          return reply.status(401).send({ error: 'Não autenticado', code: 'UNAUTHORIZED' })
        }

        const updateDespesa = new UpdateDespesa()
        const result = await updateDespesa.execute({
          id: request.params.id,
          descricao: request.body.descricao,
          fornecedor: request.body.fornecedor,
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
      tags: ['Despesas'],
      summary: 'Cancelar título de despesa - somente ADMIN',
      params: DespesaParamsSchema,
      response: {
        200: DespesaSchema,
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

        const cancelarDespesa = new CancelarDespesa()
        const result = await cancelarDespesa.execute({ id: request.params.id, usuarioId: session.user.id })

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
    url: '/:id/pagamentos',
    schema: {
      tags: ['Despesas'],
      summary: 'Registrar pagamento total ou parcial de despesa ',
      params: DespesaParamsSchema,
      body: RegistrarPagamentoDespesaBodySchema,
      response: { 200: DespesaSchema, 400: ErrorSchema, 401: ErrorSchema, 404: ErrorSchema, 500: ErrorSchema },
    },
    handler: async (request, reply) => {
      try {
        const session = await auth.api.getSession({
          headers: fromNodeHeaders(request.headers),
        })
        if (!session) {
          return reply.status(401).send({ error: 'Não autenticado', code: 'UNAUTHORIZED' })
        }

        const registrarPagamentoDespesa = new RegistrarPagamentoDespesa()
        const result = await registrarPagamentoDespesa.execute({
          id: request.params.id,
          valor: request.body.valor,
          pagoEm: request.body.pagoEm,
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
