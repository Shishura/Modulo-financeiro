import { fromNodeHeaders } from 'better-auth/node'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { auth } from '../lib/auth.js'
import {
  ErrorSchema,
  RelatorioContasAPagarSchema,
  RelatorioContasAReceberSchema,
  RelatorioQuerySchema,
} from '../schemas/index.js'
import { ExportContasAPagarCsv } from '../usecases/ExportContasAPagarCsv.js'
import { ExportContasAReceberCsv } from '../usecases/ExportContasAReceberCsv.js'
import { GetContasAPagar } from '../usecases/GetContasAPagar.js'
import { GetContasAReceber } from '../usecases/GetContasAReceber.js'


export const reportRoutes = (app: FastifyInstance) => {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/contas-a-pagar',
    schema: {
      tags: ['Relatórios'],
      summary: 'Relatório de contas a pagar ',
      querystring: RelatorioQuerySchema,
      response: {
        // formato=json responde com RelatorioContasAPagarSchema; formato=csv responde com o
        // conteúdo do arquivo CSV como texto simples (Content-Type: text/csv).
        200: z.union([RelatorioContasAPagarSchema, z.string()]),
        401: ErrorSchema,
        403: ErrorSchema,
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

        const { dataInicio, dataFim, formato } = request.query

        if (formato === 'csv') {
          const exportContasAPagarCsv = new ExportContasAPagarCsv()
          const csv = await exportContasAPagarCsv.execute({ dataInicio, dataFim })

          return reply
            .header('Content-Type', 'text/csv; charset=utf-8')
            .header('Content-Disposition', 'attachment; filename="contas-a-pagar.csv"')
            .status(200)
            .send(csv)
        }

        const getContasAPagar = new GetContasAPagar()
        const relatorio = await getContasAPagar.execute({ dataInicio, dataFim })

        return reply.status(200).send(relatorio)
      } catch (error) {
        app.log.error(error)
        return reply.status(500).send({ error: 'Erro interno do servidor', code: 'INTERNAL_SERVER_ERROR' })
      }
    },
  })

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/contas-a-receber',
    schema: {
      tags: ['Relatórios'],
      summary: 'Relatório de contas a receber',
      querystring: RelatorioQuerySchema,
      response: {
        200: z.union([RelatorioContasAReceberSchema, z.string()]),
        401: ErrorSchema,
        403: ErrorSchema,
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

        const { dataInicio, dataFim, formato } = request.query

        if (formato === 'csv') {
          const exportContasAReceberCsv = new ExportContasAReceberCsv()
          const csv = await exportContasAReceberCsv.execute({ dataInicio, dataFim })

          return reply
            .header('Content-Type', 'text/csv; charset=utf-8')
            .header('Content-Disposition', 'attachment; filename="contas-a-receber.csv"')
            .status(200)
            .send(csv)
        }

        const getContasAReceber = new GetContasAReceber()
        const relatorio = await getContasAReceber.execute({ dataInicio, dataFim })

        return reply.status(200).send(relatorio)
      } catch (error) {
        app.log.error(error)
        return reply.status(500).send({ error: 'Erro interno do servidor', code: 'INTERNAL_SERVER_ERROR' })
      }
    },
  })
}
