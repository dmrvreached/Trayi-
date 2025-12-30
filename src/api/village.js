const Service = require("../services/village-service");
const UserAuth = require("./middlewares/auth");
const { v4: uuidv4 } = require("uuid");

module.exports = (app) => {
  const service = new Service();

  // To listen

  app.post("/village", UserAuth, async (req, res, next) => {
    try {
      const { id } = req.query;
      const { _id, fullName } = req.user;
      let inputs = req.body;
      if (id) {
        inputs.updatedByName = fullName;
        inputs.updatedById = _id;
      } else {
        inputs.id = uuidv4();
        inputs.addedByName = fullName;
        inputs.addedById = _id;
      }
      const data = await service.Create(inputs, id);
      return res.json(data);
    } catch (error) {
      if (error.code === 11000 && error.keyPattern) {
        res.status(400).json({
          error: Object.keys(error.keyPattern)[0] + " already exists",
        });
      } else if (error.name === "ValidationError") {
        return res.status(400).json({ error: error.message });
      } else {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    }
  });

  app.delete("/village", UserAuth, async (req, res, next) => {
    try {
      const { id } = req.query;
      const data = await service.HardDelete(id);
      return res.json(data);
    } catch (err) {
      next(err);
    }
  });

  app.get("/village", UserAuth, async (req, res, next) => {
    try {
      const data = await service.Get(req.query);
      return res.json(data);
    } catch (err) {
      next(err);
    }
  });

  app.post("/multivillages", UserAuth, async (req, res, next) => {
    try {
      const data = await service.Multi(req.body.districtIds);
      return res.json(data);
    } catch (err) {
      next(err);
    }
  });
  const ExcelJS = require("exceljs");

  app.post("/villagesreport", UserAuth, async (req, res, next) => {
    try {
      const data = await service.villageReport(req.body);

      if (data.status && data.data.length > 0) {
        // Create a new workbook and worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Villages");

        // Define columns with headers and formatting
        worksheet.columns = [
          { header: "Village Name", key: "name", width: 30 },
          { header: "State", key: "state", width: 20 },
          { header: "District", key: "district", width: 20 },
          { header: "Block", key: "block", width: 20 },
        ];

        // Style the header row
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFE0E0E0" },
        };

        // Add data rows
        data.data.forEach((village) => {
          worksheet.addRow({
            name: village.name,
            state: village.state,
            district: village.district,
            block: village.block,
          });
        });

        // Auto-fit columns (optional)
        worksheet.columns.forEach((column) => {
          if (column.width < 15) {
            column.width = 15;
          }
        });

        // Set response headers
        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
          "Content-Disposition",
          "attachment; filename=villages.xlsx"
        );

        // Write to response
        await workbook.xlsx.write(res);
        res.end();
      } else {
        return res.status(400).json({ error: "No data found" });
      }
    } catch (err) {
      console.error("Excel generation error:", err);
      next(err);
    }
  });
};
