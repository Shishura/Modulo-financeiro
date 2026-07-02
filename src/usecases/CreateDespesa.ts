import { StatusTitulo } from '../generated/prisma/enums.js'
import { prisma } from '../lib/db.js'

interface InputDto {
  descricao: string
  fornecedor: string
  valor: number
  dataVencimento: string
  criadoPorId: string
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
}

export class CreateDespesa {
  async execute(dto: InputDto): Promise<OutputDto> {
    const despesa = await prisma.$transaction(async (tx) => {
      const criada = await tx.despesa.create({
        data: {
          descricao: dto.descricao,
          fornecedor: dto.fornecedor,
          valor: dto.valor,
          dataVencimento: new Date(dto.dataVencimento),
          criadoPorId: dto.criadoPorId,
        },
      })

      await tx.despesaHistorico.create({
        data: {
          despesaId: criada.id,
          acao: 'CRIADO',
          statusNovo: criada.status,
          alteradoPorId: dto.criadoPorId,
        },
      })

      return criada
    })

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
    }
  }
}
