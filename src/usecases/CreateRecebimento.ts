import { StatusTitulo } from '../generated/prisma/enums.js'
import { prisma } from '../lib/db.js'

interface InputDto {
  descricao: string
  cliente: string
  valor: number
  dataVencimento: string
  criadoPorId: string
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
}

export class CreateRecebimento {
  async execute(dto: InputDto): Promise<OutputDto> {
    const recebimento = await prisma.$transaction(async (tx) => {
      const criado = await tx.recebimento.create({
        data: {
          descricao: dto.descricao,
          cliente: dto.cliente,
          valor: dto.valor,
          dataVencimento: new Date(dto.dataVencimento),
          criadoPorId: dto.criadoPorId,
        },
      })

      await tx.recebimentoHistorico.create({
        data: {
          recebimentoId: criado.id,
          acao: 'CRIADO',
          statusNovo: criado.status,
          alteradoPorId: dto.criadoPorId,
        },
      })

      return criado
    })

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
    }
  }
}
