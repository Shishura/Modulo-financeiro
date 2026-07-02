import { StatusTitulo } from '../generated/prisma/enums.js'
import { NotFoundError, TituloCanceladoError, TituloJaLiquidadoError } from '../errors/index.js'
import { prisma } from '../lib/db.js'

interface InputDto {
  id: string
  descricao?: string
  cliente?: string
  valor?: number
  dataVencimento?: string
  usuarioId: string
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

export class UpdateRecebimento {
  async execute(dto: InputDto): Promise<OutputDto> {
    const recebimento = await prisma.recebimento.findUnique({ where: { id: dto.id } })
    if (!recebimento) {
      throw new NotFoundError('Recebimento não encontrado')
    }
    if (recebimento.status === 'CANCELADO') {
      throw new TituloCanceladoError('Título cancelado não pode ser alterado')
    }
    if (recebimento.status === 'PAGO') {
      throw new TituloJaLiquidadoError('Título já totalmente recebido não pode ser alterado')
    }

    const atualizado = await prisma.$transaction(async (tx) => {
      const result = await tx.recebimento.update({
        where: { id: dto.id },
        data: {
          descricao: dto.descricao,
          cliente: dto.cliente,
          valor: dto.valor,
          dataVencimento: dto.dataVencimento ? new Date(dto.dataVencimento) : undefined,
        },
      })

      await tx.recebimentoHistorico.create({
        data: {
          recebimentoId: dto.id,
          acao: 'ATUALIZADO',
          statusAnterior: recebimento.status,
          statusNovo: result.status,
          alteradoPorId: dto.usuarioId,
        },
      })

      return result
    })

    return {
      id: atualizado.id,
      descricao: atualizado.descricao,
      cliente: atualizado.cliente,
      valor: Number(atualizado.valor),
      valorRecebido: Number(atualizado.valorRecebido),
      dataVencimento: atualizado.dataVencimento.toISOString().slice(0, 10),
      status: atualizado.status,
      createdAt: atualizado.createdAt.toISOString(),
      updatedAt: atualizado.updatedAt.toISOString(),
    }
  }
}
