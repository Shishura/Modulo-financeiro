import z from 'zod'

export const ErrorSchema = z.object({
  error: z.string(),
  code: z.string(),
})

export const StatusTituloSchema = z.enum(['PENDENTE', 'PARCIAL', 'PAGO', 'CANCELADO'])

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

// ===================== Despesas =====================

export const DespesaParamsSchema = z.object({
  id: z.uuid(),
})

export const CreateDespesaBodySchema = z.object({
  descricao: z.string().min(1),
  fornecedor: z.string().min(1),
  valor: z.number().positive(),
  dataVencimento: z.iso.date(),
})

export const UpdateDespesaBodySchema = z.object({
  descricao: z.string().min(1).optional(),
  fornecedor: z.string().min(1).optional(),
  valor: z.number().positive().optional(),
  dataVencimento: z.iso.date().optional(),
})

export const RegistrarPagamentoDespesaBodySchema = z.object({
  valor: z.number().positive(),
  pagoEm: z.iso.datetime().optional(),
})

export const ListDespesasQuerySchema = z.object({
  status: StatusTituloSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

export const DespesaSchema = z.object({
  id: z.uuid(),
  descricao: z.string(),
  fornecedor: z.string(),
  valor: z.number(),
  valorPago: z.number(),
  dataVencimento: z.iso.date(),
  status: StatusTituloSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

export const ListDespesasResponseSchema = z.object({
  items: z.array(DespesaSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
})

export const DespesaHistoricoItemSchema = z.object({
  id: z.uuid(),
  acao: z.string(),
  statusAnterior: StatusTituloSchema.nullable(),
  statusNovo: StatusTituloSchema.nullable(),
  detalhes: z.string().nullable(),
  alteradoPorId: z.string(),
  createdAt: z.iso.datetime(),
})

export const DespesaComHistoricoSchema = DespesaSchema.extend({
  historico: z.array(DespesaHistoricoItemSchema),
  pagamentos: z.array(
    z.object({
      id: z.uuid(),
      valor: z.number(),
      pagoEm: z.iso.datetime(),
      registradoPorId: z.string(),
    })
  ),
})

// ===================== Recebimentos =====================

export const RecebimentoParamsSchema = z.object({
  id: z.uuid(),
})

export const CreateRecebimentoBodySchema = z.object({
  descricao: z.string().min(1),
  cliente: z.string().min(1),
  valor: z.number().positive(),
  dataVencimento: z.iso.date(),
})

export const UpdateRecebimentoBodySchema = z.object({
  descricao: z.string().min(1).optional(),
  cliente: z.string().min(1).optional(),
  valor: z.number().positive().optional(),
  dataVencimento: z.iso.date().optional(),
})

export const RegistrarBaixaRecebimentoBodySchema = z.object({
  valor: z.number().positive(),
  recebidoEm: z.iso.datetime().optional(),
})

export const ListRecebimentosQuerySchema = z.object({
  status: StatusTituloSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

export const RecebimentoSchema = z.object({
  id: z.uuid(),
  descricao: z.string(),
  cliente: z.string(),
  valor: z.number(),
  valorRecebido: z.number(),
  dataVencimento: z.iso.date(),
  status: StatusTituloSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

export const ListRecebimentosResponseSchema = z.object({
  items: z.array(RecebimentoSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
})

export const RecebimentoHistoricoItemSchema = z.object({
  id: z.uuid(),
  acao: z.string(),
  statusAnterior: StatusTituloSchema.nullable(),
  statusNovo: StatusTituloSchema.nullable(),
  detalhes: z.string().nullable(),
  alteradoPorId: z.string(),
  createdAt: z.iso.datetime(),
})

export const RecebimentoComHistoricoSchema = RecebimentoSchema.extend({
  historico: z.array(RecebimentoHistoricoItemSchema),
  baixas: z.array(
    z.object({
      id: z.uuid(),
      valor: z.number(),
      recebidoEm: z.iso.datetime(),
      registradoPorId: z.string(),
    })
  ),
})

// ===================== Relatórios =====================

export const RelatorioQuerySchema = z.object({
  dataInicio: z.iso.date().optional(),
  dataFim: z.iso.date().optional(),
  // formato de exportação: json (padrão, retorna o relatório estruturado)
  // ou csv (RF-FM-013 - versão simplificada de exportação, sem dependências extras)
  formato: z.enum(['json', 'csv']).default('json'),
})

export const RelatorioContasAPagarSchema = z.object({
  totalAPagar: z.number(),
  totalPago: z.number(),
  totalPendente: z.number(),
  itens: z.array(DespesaSchema),
})

export const RelatorioContasAReceberSchema = z.object({
  totalAReceber: z.number(),
  totalRecebido: z.number(),
  totalPendente: z.number(),
  itens: z.array(RecebimentoSchema),
})
