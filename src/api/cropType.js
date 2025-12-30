const StateService = require("../services/cropType-service");
const UserAuth = require("./middlewares/auth");
const { v4: uuidv4 } = require('uuid');


module.exports = (app) => {

  const service = new StateService();

  // To listen

  app.post("/cropType", UserAuth, async (req, res, next) => {
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
        res.status(400).json({ error: `${Object.keys(error.keyPattern)[0]} already exists` });
      } else if (error.name === 'ValidationError') {
        return res.status(400).json({ error: error.message });
      } else {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    }
  });

  app.delete("/cropType", UserAuth, async (req, res, next) => {
    try {
      const { id } = req.query;
      const data = await service.HardDelete(id);
      return res.json(data);
    } catch (err) {
      next(err);
    }
  });

  app.get("/cropTypes", UserAuth, async (req, res, next) => {
    try {
      const data = await service.Get(req.query);
      return res.json(data);
    } catch (err) {
      next(err);
    }
  });
};
