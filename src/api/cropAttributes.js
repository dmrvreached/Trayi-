
const Service = require("../services/cropAttributes-service");
const UserAuth = require("./middlewares/auth");
const { v4: uuidv4 } = require('uuid');
const {uploadFile} = require('../utils/functions/blobStorage')
const multer = require('multer');
const upload = multer().any();

module.exports = (app) => {

    const service = new Service();

    // To listen

    app.post("/cropAttributes", UserAuth, upload, async (req, res, next) => {
        try {
            const { id } = req.query;
            const { _id, fullName } = req.user;
            let inputs = req.body;
            let files = req.files;
            if (id) {
                inputs.updatedByName = fullName;
                inputs.updatedById = _id;
            } else {
                inputs.id = uuidv4();
                inputs.addedByName = fullName;
                inputs.addedById = _id;
            }
            if (files && files.length) {
                await Promise.all(
                    files.map(async (file) => {
                        const data = await uploadFile(file)
                        inputs[file.fieldname] = data;
                    })
                );
            }
               if (inputs.last_3yrs_history && typeof inputs.last_3yrs_history === 'string') {
        try {
            inputs.last_3yrs_history = JSON.parse(inputs.last_3yrs_history);
        } catch (e) {
            return res.status(400).json({ error: 'Invalid last_3yrs_history format' });
        }
    }

            const data = await service.Create(inputs, id);
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

    app.delete("/cropAttributes", UserAuth, async (req, res, next) => {
        try {
            const { id } = req.query;
            const data = await service.HardDelete(id);
            return res.json(data);
        } catch (err) {
            next(err);
        }
    });

    app.get("/cropAttributes", UserAuth, async (req, res, next) => {
        try {
            const data = await service.Get(req.query);
            return res.json(data);
        } catch (err) {
            next(err);
        }
    });
};
