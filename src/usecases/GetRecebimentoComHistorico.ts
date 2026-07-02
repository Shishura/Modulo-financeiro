import { StatusTitulo } from '../generated/prisma/enums.js'
import { NotFoundError } from '../errors/index.js'
import { prisma } from '../lib/db.js'

interface InputDto {
  id: string
}

interface OutputDto {
  id: string
  descricao: string
  cliente: string
  valor: number
  valorRecebido: number
  dataVencimento: string
  status: StatusTitulo
  createdAt: string
  updatedAt: string
  baixas: Array<{
    id: string
    valor: number
    recebidoEm: string
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

export class GetRecebimentoComHistorico {
  async execute(dto: InputDto): Promise<OutputDto> {
    const recebimento = await prisma.recebimento.findUnique({
      where: { id: dto.id },
      include: {
        baixas: { orderBy: { recebidoEm: 'desc' } },
        historico: { orderBy: { createdAt: 'desc' } },
      },
    })

    if (!recebimento) {
      throw new NotFoundError('Recebimento não encontrado')
    }

    return {
      id: recebimento.id,
      descricao: recebimento.descricao,
      cliente: recebimento.cliente,
      valor: Number(recebimento.valor),
      valorRecebido: Number(recebimento.valorRecebido),
      dataVencimento: recebimento.dataVencimento.toISOString().slice(0, 10),
      status: recebimento.status,
      createdAt: recebimento.createdAt.toISOString(),
      updatedAt: recebimento.updatedAt.toISOString(),
      baixas: recebimento.baixas.map((b) => ({
        id: b.id,
        valor: Number(b.valor),
        recebidoEm: b.recebidoEm.toISOString(),
        registradoPorId: b.registradoPorId,
      })),
      historico: recebimento.historico.map((h) => ({
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
