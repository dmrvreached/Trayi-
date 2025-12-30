const Repository = require("../database/models/state");
const DistrictRepository = require("../database/models/district");
const BlockRepository = require("../database/models/block");
const VillageRepository = require("../database/models/village");
const { removeDuplicateObjects } = require('../utils');

class Service {

    async Create(userInputs, id) {
        if (id) {
            const data = await Repository.findOneAndUpdate({ id }, { $set: userInputs }, { new: true, useFindAndModify: false });
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

    async HardDelete(id) {
        const data = await Repository.findOneAndDelete({ id });
        if (data) {
            const districts = await DistrictRepository.find({ stateId: id });
            if (districts && districts.length) {
                for (const district of districts) {
                    await DistrictRepository.findOneAndDelete({ id: district.id });
                }
            }
            const blocks = await BlockRepository.find({ stateId: id });
            if (blocks && blocks.length) {
                for (const block of blocks) {
                    await BlockRepository.findOneAndDelete({ id: block.id });
                }
            }
            const villages = await VillageRepository.find({ stateId: id });
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
                },
            ];
            delete query.search;
        }
        const count = await Repository.find(query).countDocuments();
        const data = all
            ? await Repository.find(query).sort({ name: 1 })
            : await Repository.find(query).sort({ name: 1 }).limit(limit).skip(skip)
        if (data) {
            const newData = data.map(i => { return { ...i._doc, stateId: i.id } })
            const res = search ? removeDuplicateObjects(newData, 'id') : newData;
            const total = count;
            return { status: true, msg: 'Featched successfully', data: res, total };
        } else {
            return { status: false, msg: 'Failed to fetch' };
        }
    }
}

module.exports = Service;
