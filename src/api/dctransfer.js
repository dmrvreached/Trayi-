const Service = require("../services/dctransfer-service");
const UserAuth = require("./middlewares/auth");
const { v4: uuidv4 } = require("uuid");

module.exports = (app) => {
  const service = new Service();

  app.post("/dctransfer", UserAuth, async (req, res, next) => {
    try {
      const { id } = req.query;
      const { _id, fullName } = req.user;
      let inputs = req.body;
      if (inputs.dc_transfer_from_id == inputs.dc_transfer_to_id) {
        return res
          .status(400)
          .json({
            error: "DC Transfer From and DC Transfer To cannot be same",
          });
      }
      if (id) {
        inputs.updatedByName = fullName;
        inputs.updatedById = _id;
      } else {
        inputs.addedByName = fullName;
        inputs.addedById = _id;
      }
      const data = await service.Create(inputs, id);
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

  app.get("/dctransfer", UserAuth, async (req, res, next) => {
    try {
      const data = await service.Get(req.query);
      return res.json(data);
    } catch (err) {
      next(err);
    }
  });
};
