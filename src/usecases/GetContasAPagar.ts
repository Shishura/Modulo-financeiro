import { StatusTitulo } from '../generated/prisma/enums.js'
import { prisma } from '../lib/db.js'

interface InputDto {
  dataInicio?: string
  dataFim?: string
  status?: StatusTitulo
}

interface OutputDto {
  totalAPagar: number
  totalPago: number
  totalPendente: number
  itens: Array<{
    id: string
    descricao: string
    fornecedor: string
    valor: number
    valorPago: number
    dataVencimento: string
    status: StatusTitulo
    createdAt: string
    updatedAt: string
  }>
}

export class GetContasAPagar {
  async execute(dto: InputDto): Promise<OutputDto> {
    const itens = await prisma.despesa.findMany({
      where: {
        status: dto.status,
        dataVencimento: {
          gte: dto.dataInicio ? new Date(dto.dataInicio) : undefined,
          lte: dto.dataFim ? new Date(dto.dataFim) : undefined,
        },
      },
      orderBy: { dataVencimento: 'asc' },
    })

    const totalAPagar = itens.reduce((acc, i) => acc + Number(i.valor), 0)
    const totalPago = itens.reduce((acc, i) => acc + Number(i.valorPago), 0)

    return {
      totalAPagar,
      totalPago,
      totalPendente: totalAPagar - totalPago,
      itens: itens.map((i) => ({
        id: i.id,
        descricao: i.descricao,
        fornecedor: i.fornecedor,
        valor: Number(i.valor),
        valorPago: Number(i.valorPago),
        dataVencimento: i.dataVencimento.toISOString().slice(0, 10),
        status: i.status,
        createdAt: i.createdAt.toISOString(),
        updatedAt: i.updatedAt.toISOString(),
      })),
    }
  }
}
