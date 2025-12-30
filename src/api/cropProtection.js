
const Service = require("../services/cropProtection-service");
const UserAuth = require("./middlewares/auth");
const { v4: uuidv4 } = require('uuid');

module.exports = (app) => {

    const service = new Service();

    // To listen

    app.post("/cropProtection", UserAuth, async (req, res, next) => {
        try {
            const { id, newItem, objectId } = req.query;
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
            const data = await service.Create(inputs, id, newItem, objectId);
            return res.json(data);
        } catch (error) {
            if (error.code === 11000 && error.keyPattern) {
                res.status(400).json({ error: Object.keys(error.keyPattern)[0] + ' already exists' });
            } else if (error.name === 'ValidationError') {
                return res.status(400).json({ error: error.message });
            } else {
                console.error(error);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        }
    });

    app.delete("/cropProtection", UserAuth, async (req, res, next) => {
        try {
            const { id } = req.query;
            const data = await service.HardDelete(id);
            return res.json(data);
        } catch (err) {
            next(err);
        }
    });

    app.get("/cropProtection", UserAuth, async (req, res, next) => {
        try {
            const data = await service.Get(req.query);
            return res.json(data);
        } catch (err) {
            next(err);
        }
    });
};
