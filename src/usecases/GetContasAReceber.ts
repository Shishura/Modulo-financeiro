import { StatusTitulo } from '../generated/prisma/enums.js'
import { prisma } from '../lib/db.js'

interface InputDto {
  dataInicio?: string
  dataFim?: string
  status?: StatusTitulo
}

interface OutputDto {
  totalAReceber: number
  totalRecebido: number
  totalPendente: number
  itens: Array<{
    id: string
    descricao: string
    cliente: string
    valor: number
    valorRecebido: number
    dataVencimento: string
    status: StatusTitulo
    createdAt: string
    updatedAt: string
  }>
}

export class GetContasAReceber {
  async execute(dto: InputDto): Promise<OutputDto> {
    const itens = await prisma.recebimento.findMany({
      where: {
        status: dto.status,
        dataVencimento: {
          gte: dto.dataInicio ? new Date(dto.dataInicio) : undefined,
          lte: dto.dataFim ? new Date(dto.dataFim) : undefined,
        },
      },
      orderBy: { dataVencimento: 'asc' },
    })

    const totalAReceber = itens.reduce((acc, i) => acc + Number(i.valor), 0)
    const totalRecebido = itens.reduce((acc, i) => acc + Number(i.valorRecebido), 0)

    return {
      totalAReceber,
      totalRecebido,
      totalPendente: totalAReceber - totalRecebido,
      itens: itens.map((i) => ({
        id: i.id,
        descricao: i.descricao,
        cliente: i.cliente,
        valor: Number(i.valor),
        valorRecebido: Number(i.valorRecebido),
        dataVencimento: i.dataVencimento.toISOString().slice(0, 10),
        status: i.status,
        createdAt: i.createdAt.toISOString(),
        updatedAt: i.updatedAt.toISOString(),
      })),
    }
  }
}
