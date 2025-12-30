const Repository = require("../database/models/block");
const VillageRepository = require("../database/models/village");

const { removeDuplicateObjects } = require('../utils');

class Service {

    async Create(userInputs, id) {
        const exist = await Repository.findOne({ name: userInputs.name, stateId: userInputs.stateId, districtId: userInputs.districtId });
        if (exist) {
            return { status: false, msg: 'Already exist' };
        }
        if (id) {
            const data = await Repository.findOneAndUpdate({ id }, { $set: userInputs }, { new: true, useFindAndModify: false });
            if (data) {
                return { status: true, msg: 'Updated successfully', data };
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

    async HardDelete(id) {
        const data = await Repository.findOneAndDelete({ id });
        if (data) {
            const villages = await VillageRepository.find({ blockId: id });
            if (villages && villages.length) {
                for (const village of villages) {
                    await VillageRepository.findOneAndDelete({ id: village.id });
                }
            }
            return { status: true, msg: 'Deleted successfully', data };
        } else {
            return { status: false, msg: 'Failed to delete' };
        }
    }

    async Get(query) {
        let { size, page, search } = query
        let all = true;
        if (size || page) {
            all = false;
        }
        const limit = parseInt(size);
        const skip = (page - 1) * size;
        if (size) delete query.size;
        if (page) delete query.page;
        if (search) {
            query['$or'] = [
                {
                    name: {
                        $regex: search,
                        $options: 'i',
                    },
                }, {
                    districtName: {
                        $regex: search,
                        $options: 'i',
                    },
                }, {
                    stateName: {
                        $regex: search,
                        $options: 'i',
                    },
                },
            ];
            delete query.search;
        }
        const data = all
            ?  await Repository.find(query).sort({ name: 1 })
            : await Repository.find(query).sort({ name: 1 }).limit(limit).skip(skip);
        const count = await Repository.find(query).countDocuments();
        if (data) {
            const newData = data.map(i => { return { ...i._doc, blockId: i.id } })
            const res = search ? removeDuplicateObjects(newData, 'id') : newData;
            const total =  count;
            return { status: true, msg: 'Featched successfully', data: res, total };
        } else {
            return { status: false, msg: 'Failed to fetch' };
        }
    }

    async Multi(query) {
        // Find documents in Repository collection matching the criteria
        const data = await Repository.find({
            districtId: { $in: query }, // Find documents where districtId is in the array query
            status: true // Find documents where status is true
        });
        if (data) {
            return { status: true, msg: 'Fetched successfully', data };
        } else {
            return { status: false, msg: 'Failed to fetch' };
        }

    }
}

module.exports = Service;
