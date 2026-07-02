import { StatusTitulo } from '../generated/prisma/enums.js'
import { NotFoundError, TituloCanceladoError, TituloJaLiquidadoError } from '../errors/index.js'
import { prisma } from '../lib/db.js'

interface InputDto {
  id: string
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

// Regra: nunca há exclusão física; cancelamento apenas altera o status.
// Quem pode chamar este caso de uso já foi restrito a ADMIN na rota (RF-FM-014).
export class CancelarDespesa {
  async execute(dto: InputDto): Promise<OutputDto> {
    const despesa = await prisma.despesa.findUnique({ where: { id: dto.id } })
    if (!despesa) {
      throw new NotFoundError('Despesa não encontrada')
    }
    if (despesa.status === 'CANCELADO') {
      throw new TituloCanceladoError('Título já está cancelado')
    }
    if (despesa.status === 'PAGO') {
      throw new TituloJaLiquidadoError('Título já totalmente pago não pode ser cancelado')
    }

    const cancelada = await prisma.$transaction(async (tx) => {
      const updated = await tx.despesa.update({ where: { id: dto.id }, data: { status: 'CANCELADO' } })

      await tx.despesaHistorico.create({
        data: {
          despesaId: dto.id,
          acao: 'CANCELADO',
          statusAnterior: despesa.status,
          statusNovo: 'CANCELADO',
          alteradoPorId: dto.usuarioId,
        },
      })

      return updated
    })

    return {
      id: cancelada.id,
      descricao: cancelada.descricao,
      fornecedor: cancelada.fornecedor,
      valor: Number(cancelada.valor),
      valorPago: Number(cancelada.valorPago),
      dataVencimento: cancelada.dataVencimento.toISOString().slice(0, 10),
      status: cancelada.status,
      createdAt: cancelada.createdAt.toISOString(),
      updatedAt: cancelada.updatedAt.toISOString(),
    }
  }
}
