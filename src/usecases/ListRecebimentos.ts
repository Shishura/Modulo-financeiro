import { StatusTitulo } from '../generated/prisma/enums.js'
import { prisma } from '../lib/db.js'

interface InputDto {
  status?: StatusTitulo
  page: number
  pageSize: number
}

interface RecebimentoItem {
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

interface OutputDto {
  items: RecebimentoItem[]
  total: number
  page: number
  pageSize: number
}

export class ListRecebimentos {
  async execute(dto: InputDto): Promise<OutputDto> {
    const where = dto.status ? { status: dto.status } : {}

    const [items, total] = await Promise.all([
      prisma.recebimento.findMany({
        where,
        orderBy: { dataVencimento: 'asc' },
        skip: (dto.page - 1) * dto.pageSize,
        take: dto.pageSize,
      }),
      prisma.recebimento.count({ where }),
    ])

    return {
      items: items.map((recebimento) => ({
        id: recebimento.id,
        descricao: recebimento.descricao,
        cliente: recebimento.cliente,
        valor: Number(recebimento.valor),
        valorRecebido: Number(recebimento.valorRecebido),
        dataVencimento: recebimento.dataVencimento.toISOString().slice(0, 10),
        status: recebimento.status,
        createdAt: recebimento.createdAt.toISOString(),
        updatedAt: recebimento.updatedAt.toISOString(),
      })),
      total,
      page: dto.page,
      pageSize: dto.pageSize,
    }
  }
}
