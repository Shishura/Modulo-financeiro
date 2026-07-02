import { StatusTitulo } from '../generated/prisma/enums.js'
import { prisma } from '../lib/db.js'

interface InputDto {
  status?: StatusTitulo
  page: number
  pageSize: number
}

interface DespesaItem {
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

interface OutputDto {
  items: DespesaItem[]
  total: number
  page: number
  pageSize: number
}

export class ListDespesas {
  async execute(dto: InputDto): Promise<OutputDto> {
    const where = dto.status ? { status: dto.status } : {}

    const [items, total] = await Promise.all([
      prisma.despesa.findMany({
        where,
        orderBy: { dataVencimento: 'asc' },
        skip: (dto.page - 1) * dto.pageSize,
        take: dto.pageSize,
      }),
      prisma.despesa.count({ where }),
    ])

    return {
      items: items.map((despesa) => ({
        id: despesa.id,
        descricao: despesa.descricao,
        fornecedor: despesa.fornecedor,
        valor: Number(despesa.valor),
        valorPago: Number(despesa.valorPago),
        dataVencimento: despesa.dataVencimento.toISOString().slice(0, 10),
        status: despesa.status,
        createdAt: despesa.createdAt.toISOString(),
        updatedAt: despesa.updatedAt.toISOString(),
      })),
      total,
      page: dto.page,
      pageSize: dto.pageSize,
    }
  }
}
