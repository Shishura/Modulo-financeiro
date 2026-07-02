// Exportação simplificada para fins acadêmicos: gera CSV (abre nativamente
// no Excel/LibreOffice) sem precisar de bibliotecas externas como exceljs
// ou pdfkit. Cada linha de `rows` deve ter a mesma ordem das `headers`.
export function toCsv(headers: string[], rows: Array<Array<string | number>>): string {
  const escape = (value: string | number) => {
    const text = String(value)
    return /[",;\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }

  const lines = [headers.map(escape).join(';'), ...rows.map((row) => row.map(escape).join(';'))]

  return lines.join('\n')
}
