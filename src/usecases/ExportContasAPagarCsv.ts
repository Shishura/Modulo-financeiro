import { StatusTitulo } from '../generated/prisma/enums.js'
import { prisma } from '../lib/db.js'
import { toCsv } from '../utils/csv-export.js'

interface InputDto {
  dataInicio?: string
  dataFim?: string
  status?: StatusTitulo
}

export class ExportContasAPagarCsv {
  async execute(dto: InputDto): Promise<string> {
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

    return toCsv(
      ['Descrição', 'Fornecedor', 'Valor', 'Valor Pago', 'Vencimento', 'Status'],
      itens.map((i) => [
        i.descricao,
        i.fornecedor,
        Number(i.valor),
        Number(i.valorPago),
        i.dataVencimento.toISOString().slice(0, 10),
        i.status,
      ])
    )
  }
}
