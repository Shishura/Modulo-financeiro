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
  recebidoEm?: string
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

export class RegistrarBaixaRecebimento {
  async execute(dto: InputDto): Promise<OutputDto> {
    const recebimento = await prisma.recebimento.findUnique({ where: { id: dto.id } })
    if (!recebimento) {
      throw new NotFoundError('Recebimento não encontrado')
    }
    if (recebimento.status === 'CANCELADO') {
      throw new TituloCanceladoError('Não é possível dar baixa em título cancelado')
    }
    if (recebimento.status === 'PAGO') {
      throw new TituloJaLiquidadoError('Título já está totalmente recebido')
    }

    const valorTotal = Number(recebimento.valor)
    const valorJaRecebido = Number(recebimento.valorRecebido)
    const novoValorRecebido = valorJaRecebido + dto.valor

    if (novoValorRecebido > valorTotal) {
      throw new ValorPagamentoInvalidoError(
        `Valor excede o saldo restante (R$ ${(valorTotal - valorJaRecebido).toFixed(2)})`
      )
    }

    const novoStatus: StatusTitulo = novoValorRecebido >= valorTotal ? 'PAGO' : 'PARCIAL'
    const recebidoEm = dto.recebidoEm ? new Date(dto.recebidoEm) : new Date()

    const atualizado = await prisma.$transaction(async (tx) => {
      await tx.recebimentoBaixa.create({
        data: { recebimentoId: dto.id, valor: dto.valor, recebidoEm, registradoPorId: dto.usuarioId },
      })

      const result = await tx.recebimento.update({
        where: { id: dto.id },
        data: { valorRecebido: novoValorRecebido, status: novoStatus },
      })

      await tx.recebimentoHistorico.create({
        data: {
          recebimentoId: dto.id,
          acao: 'BAIXA_REGISTRADA',
          statusAnterior: recebimento.status,
          statusNovo: novoStatus,
          detalhes: `Baixa de R$ ${dto.valor.toFixed(2)}`,
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
