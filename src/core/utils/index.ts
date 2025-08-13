import * as xlsx from 'xlsx';

export function parseXlsxToObject(buffer: Buffer) {
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const json = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
  return json;
}
