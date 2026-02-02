const ExcelJS = require('exceljs');
const fs = require('fs');

async function exportToExcel(data, resource = 'Mrv_Report') {
  try {
    // Create a new workbook
    const workbook = new ExcelJS.Workbook();

    for (const sheetName of Object.keys(data)) {
      const sheetData = data[sheetName];

      // Add a worksheet for the current sheet
      const worksheet = workbook.addWorksheet(sheetName);

      // Add headers to the worksheet
      if (sheetData.length > 0) {
        const headers = Object.keys(sheetData[0]);
        worksheet.addRow(headers);

        // Add data rows to the worksheet
        sheetData.forEach((row) => {
          const values = headers.map((header) => row[header]);
          worksheet.addRow(values);
        });
      }
    }

    // Save the workbook to a file
    await workbook.xlsx.writeFile(`${resource}.xlsx`);
    console.log('Excel file created successfully');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

module.exports = exportToExcel;
