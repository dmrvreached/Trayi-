const DashboardService = require("../services/dashboard-service");
const UserAuth = require("./middlewares/auth");
const multer = require("multer");
const importFromExcel = require("../utils/functions/importFromExcelTest");
const { v4: uuidv4 } = require("uuid");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

module.exports = (app) => {
  const service = new DashboardService();

  app.post(
    "/uploadexcel",
    UserAuth,
    upload.single("excel"),
    async (req, res, next) => {
      try {
        if (!req.file) {
          return res.status(400).send("No file uploaded.");
        }
        const { _id, fullName } = req.user;
        const userData = {
          id: uuidv4(),
          addedByName: fullName,
          addedById: _id,
        };
        const result = await importFromExcel(req.file.buffer, userData);
        return res.json(result);
      } catch (err) {
        next(err);
      }
    }
  );

  app.get("/dashboard/stats", UserAuth, async (req, res, next) => {
    try {
      const data = await service.Count(
        req.query.clientId ? req.query.clientId : null
      );
      return res.json(data);
    } catch (err) {
      next(err);
    }
  });

  app.post(
    "/bulkupload",
    UserAuth,
    upload.array("photos"),
    async (req, res, next) => {
      try {
        const data = await service.UploadBulk(req.files);
        return res.json(data);
      } catch (err) {
        next(err);
      }
    }
  );

  app.post(
    "/upload",
    UserAuth,
    upload.single("image"),
    async (req, res, next) => {
      try {
        const data = await service.Upload(req.file);
        return res.json(data);
      } catch (err) {
        next(err);
      }
    }
  );

  app.get("/labels", UserAuth, async (req, res, next) => {
    try {
      const data = await service.Labels(req.query);
      return res.json(data);
    } catch (err) {
      next(err);
    }
  });

  app.get("/resource", UserAuth, async (req, res, next) => {
    try {
      const data = await service.Resource(req.query);
      return res.json(data);
    } catch (err) {
      next(err);
    }
  });
  app.get("/versioncheck", async (req, res, next) => {
    try {
      const data = await service.versionCheck();
      return res.json(data);
    } catch (err) {
      next(err);
    }
  });

  app.get("/dcdata", UserAuth, async (req, res, next) => {
    try {
      const { id } = req.user;
      const data = await service.DCData(req.query.id ? req.query.id : id);
      return res.json(data);
    } catch (err) {
      next(err);
    }
  });
  app.get("/dcdataupdate", UserAuth, async (req, res, next) => {
    try {
      const { id } = req.user;
      const data = await service.DCDataUpdate(
        req?.query?.id ? req.query.id : id
      );
      return res.json(data);
    } catch (err) {
      next(err);
    }
  });
  //filters the farmers based on the state district block and village wise
  app.post("/dcdataupdatefilter", UserAuth, async (req, res, next) => {
    try {
      const { id } = req.user;
      const data = await service.DCDataUpdateFilter(
       req
      );
      return res.json(data);
    } catch (err) {
      next(err);
    }
  });

  app.post("/popsdata", UserAuth, async (req, res, next) => {
    try {
      const data = await service.POPData(req.body.seasonIds);
      return res.json(data);
    } catch (err) {
      next(err);
    }
  });

  app.post("/reports", UserAuth, async (req, res, next) => {
    try {
      const data = await service.Report(req.query, req.body);
      return res.json(data);
    } catch (err) {
      next(err);
    }
  });

  app.get("/cultivationReportCost", async (req, res, next) => {
    try {
      const data = await service.CultivationReportCost(req.query.seasonId);
      return res.json(data);
    } catch (err) {
      next(err);
    }
  });

  app.post("/farmersreportswithpops", UserAuth, async (req, res, next) => {
    try {
      const data = await service.FarmersReportWithPOPs(req.query, req.body);
      return res.json(data);
    } catch (err) {
      next(err);
    }
  });

  app.post("/syncofflineData", UserAuth, async (req, res, next) => {
    try {
      const data = await service.UpdateOrCreatePops(req);
      return res.json(data);
    } catch (error) {
      if (error.code === 11000 && error.keyPattern) {
        res
          .status(400)
          .json({
            error: `${Object.keys(error.keyPattern)[0]} already exists`,
          });
      } else if (error.name === "ValidationError") {
        return res.status(400).json({ error: error.message });
      } else {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    }
  });


};
