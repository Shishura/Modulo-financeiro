import { StatusTitulo } from '../generated/prisma/enums.js'
import {
  NotFoundError,
  TituloCanceladoError,
  TituloJaLiquidadoError,
  ValorPagamentoInvalidoError,
} from '../errors/index.js'
import { prisma } from '../lib/db.js'

interface InputDto {
  id: string
  valor: number
  pagoEm?: string
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

export class RegistrarPagamentoDespesa {
  async execute(dto: InputDto): Promise<OutputDto> {
    const despesa = await prisma.despesa.findUnique({ where: { id: dto.id } })
    if (!despesa) {
      throw new NotFoundError('Despesa não encontrada')
    }
    if (despesa.status === 'CANCELADO') {
      throw new TituloCanceladoError('Não é possível pagar um título cancelado')
    }
    if (despesa.status === 'PAGO') {
      throw new TituloJaLiquidadoError('Título já está totalmente pago')
    }

    const valorTotal = Number(despesa.valor)
    const valorJaPago = Number(despesa.valorPago)
    const novoValorPago = valorJaPago + dto.valor

    if (novoValorPago > valorTotal) {
      throw new ValorPagamentoInvalidoError(
        `Valor excede o saldo restante (R$ ${(valorTotal - valorJaPago).toFixed(2)})`
      )
    }

    const novoStatus: StatusTitulo = novoValorPago >= valorTotal ? 'PAGO' : 'PARCIAL'
    const pagoEm = dto.pagoEm ? new Date(dto.pagoEm) : new Date()

    const atualizada = await prisma.$transaction(async (tx) => {
      await tx.despesaPagamento.create({
        data: { despesaId: dto.id, valor: dto.valor, pagoEm, registradoPorId: dto.usuarioId },
      })

      const result = await tx.despesa.update({
        where: { id: dto.id },
        data: { valorPago: novoValorPago, status: novoStatus },
      })

      await tx.despesaHistorico.create({
        data: {
          despesaId: dto.id,
          acao: 'PAGAMENTO_REGISTRADO',
          statusAnterior: despesa.status,
          statusNovo: novoStatus,
          detalhes: `Pagamento de R$ ${dto.valor.toFixed(2)}`,
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
