export class NotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NotFoundError'
  }
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ForbiddenError'
  }
}

export class TituloCanceladoError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TituloCanceladoError'
  }
}

export class TituloJaLiquidadoError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TituloJaLiquidadoError'
  }
}

export class ValorPagamentoInvalidoError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValorPagamentoInvalidoError'
  }
}
