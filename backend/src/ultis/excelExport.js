const border = {
  top: { style: 'thin', color: { rgb: 'D9E2F3' } },
  bottom: { style: 'thin', color: { rgb: 'D9E2F3' } },
  left: { style: 'thin', color: { rgb: 'D9E2F3' } },
  right: { style: 'thin', color: { rgb: 'D9E2F3' } }
};

const titleStyle = {
  font: { name: 'Aptos Display', sz: 16, bold: true, color: { rgb: 'FFFFFF' } },
  fill: { fgColor: { rgb: '1F4E78' } },
  alignment: { horizontal: 'center', vertical: 'center' }
};

const headerStyle = {
  font: { name: 'Aptos', sz: 10, bold: true, color: { rgb: 'FFFFFF' } },
  fill: { fgColor: { rgb: '5B9BD5' } },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  border
};

const bodyStyle = {
  font: { name: 'Aptos', sz: 10, color: { rgb: '1F1F1F' } },
  alignment: { vertical: 'center', wrapText: true },
  border
};

export const styleTableSheet = (XLSX, ws, {
  title,
  subtitle,
  headerRow = 3,
  widths = [],
  numericColumns = [],
  dateColumns = []
} = {}) => {
  const range = XLSX.utils.decode_range(ws['!ref']);
  const lastColumn = range.e.c;
  const lastRow = range.e.r;
  const headerCellRow = headerRow;

  if (title) {
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: lastColumn } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: lastColumn } }
    ];
    ws['A1'].s = titleStyle;
    if (subtitle && ws['A2']) {
      ws['A2'].s = {
        font: { name: 'Aptos', sz: 10, italic: true, color: { rgb: '666666' } },
        alignment: { horizontal: 'center', vertical: 'center' }
      };
    }
    ws['!rows'] = [{ hpt: 28 }, { hpt: 20 }, { hpt: 8 }, { hpt: 28 }];
  }

  for (let column = 0; column <= lastColumn; column += 1) {
    const headerCell = ws[XLSX.utils.encode_cell({ r: headerCellRow, c: column })];
    if (headerCell) headerCell.s = headerStyle;
  }

  for (let row = headerCellRow + 1; row <= lastRow; row += 1) {
    for (let column = 0; column <= lastColumn; column += 1) {
      const cell = ws[XLSX.utils.encode_cell({ r: row, c: column })];
      if (!cell) continue;
      cell.s = {
        ...bodyStyle,
        fill: { fgColor: { rgb: (row - headerCellRow) % 2 ? 'FFFFFF' : 'F7FBFF' } },
        alignment: { ...bodyStyle.alignment, horizontal: numericColumns.includes(column) ? 'right' : 'left' }
      };
      if (numericColumns.includes(column)) cell.z = '#,##0';
      if (dateColumns.includes(column)) cell.z = 'dd/mm/yyyy';
    }
  }

  ws['!cols'] = widths.map(width => ({ wch: width }));
  ws['!autofilter'] = {
    ref: `${XLSX.utils.encode_col(0)}${headerCellRow + 1}:${XLSX.utils.encode_col(lastColumn)}${lastRow + 1}`
  };
  ws['!freeze'] = { xSplit: 0, ySplit: headerCellRow + 1 };
  return ws;
};

export const styleSummarySheet = (XLSX, ws, { title, widths = [], headerRow = 2, totalRow } = {}) => {
  const range = XLSX.utils.decode_range(ws['!ref']);
  const lastColumn = range.e.c;
  const lastRow = range.e.r;
  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: lastColumn } }];
  if (title && ws['A1']) ws['A1'].s = titleStyle;
  for (let column = 0; column <= lastColumn; column += 1) {
    const cell = ws[XLSX.utils.encode_cell({ r: headerRow, c: column })];
    if (cell) cell.s = headerStyle;
  }
  for (let row = headerRow + 1; row <= lastRow; row += 1) {
    for (let column = 0; column <= lastColumn; column += 1) {
      const cell = ws[XLSX.utils.encode_cell({ r: row, c: column })];
      if (cell) cell.s = { ...bodyStyle, fill: { fgColor: { rgb: row % 2 ? 'FFFFFF' : 'F7FBFF' } } };
    }
  }
  if (totalRow !== undefined) {
    for (let column = 0; column <= lastColumn; column += 1) {
      const cell = ws[XLSX.utils.encode_cell({ r: totalRow, c: column })];
      if (cell) cell.s = { ...headerStyle, fill: { fgColor: { rgb: 'D9EAF7' } }, font: { ...headerStyle.font, color: { rgb: '1F1F1F' } } };
    }
  }
  ws['!cols'] = widths.map(width => ({ wch: width }));
  ws['!autofilter'] = { ref: `A${headerRow + 1}:${XLSX.utils.encode_col(lastColumn)}${lastRow + 1}` };
  ws['!freeze'] = { xSplit: 0, ySplit: headerRow + 1 };
  return ws;
};
