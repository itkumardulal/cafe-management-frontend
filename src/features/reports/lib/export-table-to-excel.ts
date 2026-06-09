export type ExportTableColumn<T> = {
  header: string;
  getValue: (row: T) => string | number;
};

export type ExportExtraRow = {
  label: string;
  value: string | number;
};

export async function exportTableToExcel<T>({
  fileName,
  sheetName = "Report",
  columns,
  rows,
  footerRow,
  extraRows,
}: {
  fileName: string;
  sheetName?: string;
  columns: ExportTableColumn<T>[];
  rows: T[];
  footerRow?: (string | number)[];
  extraRows?: ExportExtraRow[];
}): Promise<void> {
  const XLSX = await import("xlsx");

  const headerRow = columns.map((column) => column.header);
  const dataRows = rows.map((row) => columns.map((column) => column.getValue(row)));

  const sheetRows: (string | number)[][] = [headerRow, ...dataRows];

  if (footerRow && footerRow.length > 0) {
    sheetRows.push(footerRow);
  }

  if (extraRows && extraRows.length > 0) {
    sheetRows.push([]);
    for (const extra of extraRows) {
      sheetRows.push([extra.label, extra.value]);
    }
  }

  const worksheet = XLSX.utils.aoa_to_sheet(sheetRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));
  XLSX.writeFile(workbook, fileName);
}
