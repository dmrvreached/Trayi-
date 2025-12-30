const Repository = require("../database/models/storage");
const operationDate = require('../utils/functions/updateOperationDates');
const { POP_RESOURCES_DATA } = require('../config/index')


class Service {

    async Create(userInputs, id) {
        if (id) {
            const data = await Repository.findOneAndUpdate({ id }, { $set: userInputs },
                { new: true, useFindAndModify: false });
            if (data) {
                const { status, msg } = await operationDate(data, POP_RESOURCES_DATA.storage)
                if (!status) {
                    return { status: true, msg: 'Failed to Note operation date. please update the data with same values', errorMsg: msg, data };
                }
                return { status: true, msg: 'Updated successfully', data };
            } else {
                return { status: false, msg: 'Failed to update' };
            }
        } else {
            const data = await Repository.create(userInputs);
            if (data) {
                const { status, msg } = await operationDate(data, POP_RESOURCES_DATA.storage)
                if (!status) {
                    return { status: true, msg: 'Failed to Note operation date. please update the data with same values', errorMsg: msg, data };
                }
                return { status: true, msg: 'Added successfully', data };
            } else {
                return { status: false, msg: 'Failed to add' };
            }
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
        const count = await Repository.find(query).countDocuments();
        const data = await Repository.find(query).sort({ createdAt: -1 }).limit(limit).skip(skip);
        if (data) {
            return { status: true, msg: 'Fetched successfully', data, count };
        } else {
            return { status: false, msg: 'Failed to fetch' };
        }
    }
}

module.exports = Service;
