import { StatusTitulo } from '../generated/prisma/enums.js'
import { NotFoundError } from '../errors/index.js'
import { prisma } from '../lib/db.js'

interface InputDto {
  id: string
}

interface OutputDto {
  id: string
  descricao: string
  fornecedor: string
  valor: number
  valorPago: number
  dataVencimento: string
  status: StatusTitulo
  createdAt: string
  updatedAt: string
  pagamentos: Array<{
    id: string
    valor: number
    pagoEm: string
    registradoPorId: string
  }>
  historico: Array<{
    id: string
    acao: string
    statusAnterior: string | null
    statusNovo: string | null
    detalhes: string | null
    alteradoPorId: string
    createdAt: string
  }>
}

export class GetDespesaComHistorico {
  async execute(dto: InputDto): Promise<OutputDto> {
    const despesa = await prisma.despesa.findUnique({
      where: { id: dto.id },
      include: {
        pagamentos: { orderBy: { pagoEm: 'desc' } },
        historico: { orderBy: { createdAt: 'desc' } },
      },
    })

    if (!despesa) {
      throw new NotFoundError('Despesa não encontrada')
    }

    return {
      id: despesa.id,
      descricao: despesa.descricao,
      fornecedor: despesa.fornecedor,
      valor: Number(despesa.valor),
      valorPago: Number(despesa.valorPago),
      dataVencimento: despesa.dataVencimento.toISOString().slice(0, 10),
      status: despesa.status,
      createdAt: despesa.createdAt.toISOString(),
      updatedAt: despesa.updatedAt.toISOString(),
      pagamentos: despesa.pagamentos.map((p) => ({
        id: p.id,
        valor: Number(p.valor),
        pagoEm: p.pagoEm.toISOString(),
        registradoPorId: p.registradoPorId,
      })),
      historico: despesa.historico.map((h) => ({
        id: h.id,
        acao: h.acao,
        statusAnterior: h.statusAnterior,
        statusNovo: h.statusNovo,
        detalhes: h.detalhes,
        alteradoPorId: h.alteradoPorId,
        createdAt: h.createdAt.toISOString(),
      })),
    }
  }
}
