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
  cliente: string
  valor: number
  valorRecebido: number
  dataVencimento: string
  status: StatusTitulo
  createdAt: string
  updatedAt: string
}

// Regra: nunca há exclusão física; cancelamento apenas altera o status.
// Quem pode chamar este caso de uso já foi restrito a ADMIN na rota (RF-FM-014).
export class CancelarRecebimento {
  async execute(dto: InputDto): Promise<OutputDto> {
    const recebimento = await prisma.recebimento.findUnique({ where: { id: dto.id } })
    if (!recebimento) {
      throw new NotFoundError('Recebimento não encontrado')
    }
    if (recebimento.status === 'CANCELADO') {
      throw new TituloCanceladoError('Título já está cancelado')
    }
    if (recebimento.status === 'PAGO') {
      throw new TituloJaLiquidadoError('Título já totalmente recebido não pode ser cancelado')
    }

    const cancelado = await prisma.$transaction(async (tx) => {
      const updated = await tx.recebimento.update({ where: { id: dto.id }, data: { status: 'CANCELADO' } })

      await tx.recebimentoHistorico.create({
        data: {
          recebimentoId: dto.id,
          acao: 'CANCELADO',
          statusAnterior: recebimento.status,
          statusNovo: 'CANCELADO',
          alteradoPorId: dto.usuarioId,
        },
      })

      return updated
    })

    return {
      id: cancelado.id,
      descricao: cancelado.descricao,
      cliente: cancelado.cliente,
      valor: Number(cancelado.valor),
      valorRecebido: Number(cancelado.valorRecebido),
      dataVencimento: cancelado.dataVencimento.toISOString().slice(0, 10),
      status: cancelado.status,
      createdAt: cancelado.createdAt.toISOString(),
      updatedAt: cancelado.updatedAt.toISOString(),
    }
  }
}
