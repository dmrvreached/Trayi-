const Service = require("../services/dataCollector-service");
const UserAuth = require("./middlewares/auth");
const { v4: uuidv4 } = require('uuid');


module.exports = (app) => {

  const service = new Service();

  app.post("/dataCollector", UserAuth, async (req, res, next) => {
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

  app.post("/dataCollector/loginWithOTP", async (req, res, next) => {
    try {
      const data = await service.SignInWithOTP(req.body);
      return res.json(data);
    } catch (err) {
      next(err);
    }
  });

  app.post("/dataCollector/verifyNumber", async (req, res, next) => {
    try {
      const data = await service.VerifyNumber(req.body);
      return res.json(data);
    } catch (err) {
      next(err);
    }
  });

  app.post("/dataCollector/verifyEmail", async (req, res, next) => {
    try {
      const data = await service.VerifyEmail(req.body);
      return res.json(data);
    } catch (err) {
      next(err);
    }
  });

  app.post("/dataCollector/login", async (req, res, next) => {
    try {
      const data = await service.SignIn(req.body);
      return res.json(data);
    } catch (err) {
      next(err);
    }
  });

  app.delete("/dataCollector", UserAuth, async (req, res, next) => {
    try {
      const data = await service.HardDelete(req.query);
      return res.json(data);
    } catch (err) {
      next(err);
    }
  });

  app.get("/dataCollectors", UserAuth, async (req, res, next) => {
    try {
      const data = await service.Get(req.query);
      // const data = await service.UpdateAll()
      return res.json(data);
    } catch (err) {
      next(err);
    }
  });

  app.get("/dataCollector/projects", UserAuth, async (req, res, next) => {
    try {
      const { id } = req.user;
      const data = await service.Project(id);
      return res.json(data);
    } catch (err) {
      next(err);
    }
  });
};
