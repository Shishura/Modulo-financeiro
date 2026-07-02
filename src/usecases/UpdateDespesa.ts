import { StatusTitulo } from '../generated/prisma/enums.js'
import { NotFoundError, TituloCanceladoError, TituloJaLiquidadoError } from '../errors/index.js'
import { prisma } from '../lib/db.js'

interface InputDto {
  id: string
  descricao?: string
  fornecedor?: string
  valor?: number
  dataVencimento?: string
  usuarioId: string
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

export class UpdateDespesa {
  async execute(dto: InputDto): Promise<OutputDto> {
    const despesa = await prisma.despesa.findUnique({ where: { id: dto.id } })
    if (!despesa) {
      throw new NotFoundError('Despesa não encontrada')
    }
    if (despesa.status === 'CANCELADO') {
      throw new TituloCanceladoError('Título cancelado não pode ser alterado')
    }
    if (despesa.status === 'PAGO') {
      throw new TituloJaLiquidadoError('Título já totalmente pago não pode ser alterado')
    }

    const atualizada = await prisma.$transaction(async (tx) => {
      const result = await tx.despesa.update({
        where: { id: dto.id },
        data: {
          descricao: dto.descricao,
          fornecedor: dto.fornecedor,
          valor: dto.valor,
          dataVencimento: dto.dataVencimento ? new Date(dto.dataVencimento) : undefined,
        },
      })

      await tx.despesaHistorico.create({
        data: {
          despesaId: dto.id,
          acao: 'ATUALIZADO',
          statusAnterior: despesa.status,
          statusNovo: result.status,
          alteradoPorId: dto.usuarioId,
        },
      })

      return result
    })

    return {
      id: atualizada.id,
      descricao: atualizada.descricao,
      fornecedor: atualizada.fornecedor,
      valor: Number(atualizada.valor),
      valorPago: Number(atualizada.valorPago),
      dataVencimento: atualizada.dataVencimento.toISOString().slice(0, 10),
      status: atualizada.status,
      createdAt: atualizada.createdAt.toISOString(),
      updatedAt: atualizada.updatedAt.toISOString(),
    }
  }
}
