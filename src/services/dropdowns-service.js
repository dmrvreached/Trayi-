const Repository = require("../database/models/dropdowns");

class Service {

    async Create(userInputs, id) {
        if (id) {
            const data = await Repository.findOneAndUpdate({ id },{ $set: userInputs },{ new: true, useFindAndModify: false });
            if (data) {
                return { status: true, msg: 'Update successfully', data };
            } else {
                return { status: false, msg: 'Failed to update' };
            }
        } else {
            const data = await Repository.create(userInputs);
            if (data) {
                return { status: true, msg: 'Added successfully', data };
            } else {
                return { status: false, msg: 'Failed to add' };
            }
        }
    }

    async HardDelete(query) {
        const data = await Repository.findOneAndDelete(query);
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
        query.status = query.status ? query.status : true;
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
