
const Repository = require("../database/models/farmOperations");
const operationDate = require('../utils/functions/updateOperationDates');
const { POP_RESOURCES_DATA } = require('../config/index')
const { v4: uuidv4 } = require('uuid');

class Service {

    async Create(userInputs, id, newItem, objectId) {
        let results;
        if (id) {
            if (newItem) {
                const data = await Repository.findOne({ id });
                userInputs.objectId = uuidv4();
                data.operations.push(userInputs)
                data.save();
                results = { status: true, msg: 'New Item successfully', data };
            } else if (objectId) {
                userInputs.objectId = objectId;
                const data = await Repository.findOneAndUpdate(
                    { id: id, 'operations.objectId': objectId },
                    { $set: { 'operations.$': userInputs } },
                    { new: true, useFindAndModify: false } // Set useFindAndModify to false to use native findOneAndUpdate
                );
                if (data) {
                    results = { status: true, msg: 'Objected Updated successfully', data };
                } else {
                    results = { status: false, msg: 'Failed to update' };
                }
            } else {
                const data = await Repository.findOneAndUpdate({ id }, { $set: userInputs },
                    { new: true, useFindAndModify: false });
                if (data) {
                    results = { status: true, msg: 'Updated successfully', data };
                } else {
                    results = { status: false, msg: 'Failed to update' };
                }
            }
        } else {
            if (userInputs.operations.length > 0) {
                userInputs.operations.map(operation => {
                    operation.objectId = uuidv4();
                })
            }
            const data = await Repository.create(userInputs);
            if (data) {
                results = { status: true, msg: 'Added successfully', data };
            } else {
                results = { status: false, msg: 'Failed to add' };
            }
        }
        if (results.status) {
            for (const operation of results.data.operations) {
                if (operation.operationItems.dateOfOperation) {
                    const { status, msg } = await operationDate(
                        {
                            id: operation.objectId,
                            dateOfOperation: operation.operationItems.dateOfOperation,
                            seasonId: results.data.seasonId,
                        },
                        POP_RESOURCES_DATA.farmOperations + ` (${operation.operationName})`
                    )
                    if (!status) {
                        return { status: true, msg: 'Failed to Note operation date. please update the data with same values', errorMsg: msg, data: results.data };
                    }
                }
            }
            return results;
        } else {
            return results;
        }
    }

    async HardDelete(id) {
        const data = await Repository.findOneAndDelete({ id });
        if (data) {
            return { status: true, msg: 'Deleted successfully', data };
        } else {
            return { status: false, msg: 'Failed to delete' };
        }
    }

    async Get(query) {
        const { size = 20, page = 1 } = query
        const limit = parseInt(size);
        const skip = (page - 1) * size;
        if (size) delete query.size;
        if (page) delete query.page;
        const data = await Repository.find(query).sort({ createdAt: -1 }).limit(limit).skip(skip);
        const count = await Repository.find(query).countDocuments();
        if (data) {
            return { status: true, msg: 'Fetched successfully', data, count };
        } else {
            return { status: false, msg: 'Failed to fetch' };
        }
    }
}

module.exports = Service;
