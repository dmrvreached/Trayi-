const UserService = require("../services/user-service");
const UserAuth = require("./middlewares/auth");
const { v4: uuidv4 } = require('uuid');

module.exports = (app) => {

  const service = new UserService();

  // To listen

  app.post("/createnewadmin", UserAuth, async (req, res, next) => {
    try {
      const inputs = req.body;
      const { _id, fullName } = req.user;
      inputs.id = uuidv4();
      inputs.addedByName = fullName;
      inputs.addedById = _id;
      const data = await service.SignUp(inputs)
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

  app.post("/loginWithOTP", async (req, res, next) => {
    try {
      const data = await service.SignInWithOTP(req.body);
      return res.json(data);
    } catch (err) {
      next(err);
    }
  });

  app.post("/verifyNumber", async (req, res, next) => {
    try {
      const data = await service.VerifyNumber(req.body);
      return res.json(data);
    } catch (err) {
      next(err);
    }
  });

  app.post("/verifyEmail", async (req, res, next) => {
    try {
      const data = await service.VerifyEmail(req.body);

      return res.json(data);

    } catch (err) {
      next(err);
    }
  });

  app.post("/login", async (req, res, next) => {
    try {

      const data = await service.SignIn(req.body);

      return res.json(data);
    } catch (err) {
      next(err);
    }
  });

  app.post("/update", UserAuth, async (req, res, next) => {
    try {
      const { _id, fullName } = req.user;
      const { id } = req.query;
      const userId = id ? id : req.user.id;
      const inputs = req.body;
      inputs.updatedByName = fullName;
      inputs.updatedById = _id;
      const data = await service.Update(userId, inputs);

      return res.json(data);
    } catch (err) {
      next(err);
    }
  });

  app.delete("/delete", UserAuth, async (req, res, next) => {
    try {
      const { id } = req.query;
      const userId = id ? id : req.user.id;
      const data = await service.HardDelete(userId);
      return res.json(data);
    } catch (err) {
      next(err);
    }
  });

  app.get("/profile", UserAuth, async (req, res, next) => {
    try {
      const { id } = req.query;
      const userId = id ? id : req.user.id;
      const data = await service.GetProfile(userId);
      return res.json(data);
    } catch (err) {
      next(err);
    }
  });

  app.get("/alladminusers", UserAuth, async (req, res, next) => {
    try {
      const data = await service.Get(req.query);
      return res.json(data);
    } catch (err) {
      next(err);
    }
  });
};
