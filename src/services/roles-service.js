const Repository = require("../database/models/roles");
const UserRepository = require("../database/models/user");
const { removeDuplicateObjects } = require('../utils');

class Service {

    async Create(userInputs, id) {
        const exist = await Repository.find({ id: { $ne: id }, name: userInputs.name });
        if (exist.length) {
            return { status: false, msg: 'Already exist' };
        }
        if (id) {
            const data = await Repository.findOneAndUpdate({ id }, { $set: userInputs }, { new: true, useFindAndModify: false });
            if (data) {
                await UserRepository.updateMany({ roleId: id }, { $set: { roleName: data.name, userPermissions: data.userPermissions } });
                return { status: true, msg: 'Updated successfully', data };
            } else {
                return { status: false, msg: 'Failed to add' };
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

    async HardDelete(id) {
        const data = await Repository.findOneAndDelete({ id });
        if (data) {
            return { status: true, msg: 'Deleted successfully', data };
        } else {
            return { status: false, msg: 'Failed to delete' };
        }
    }

    async Get(query) {
        const { size = 20, page = 1, search } = query
        const limit = parseInt(size);
        const skip = (page - 1) * size;
        // query.status = query.status ? query.status : true;
        if (size) delete query.size;
        if (page) delete query.page;
        if (search) {
            query['$or'] = [
                {
                    name: {
                        $regex: search,
                        $options: 'i',
                    },
                },
            ];
            delete query.search;
        }
        const count = await Repository.find(query).countDocuments();
        const data = await Repository.find(query).sort({ createdAt: -1 }).limit(limit).skip(skip);
        if (data) {
            const res = search ? removeDuplicateObjects(data, 'id') : data;
            const total = search ? res.length : count;
            return { status: true, msg: 'Featched successfully', data: res, total };
        } else {
            return { status: false, msg: 'Failed to fetch' };
        }
    }
}

module.exports = Service;
