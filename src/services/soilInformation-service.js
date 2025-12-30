
const Repository = require("../database/models/soilInformation");
const PlotRepository = require("../database/models/plotDetails");

class Service {

    async Create(userInputs, id) {
        if (id) {
            const data = await Repository.findOneAndUpdate({ id }, { $set: userInputs },
                { new: true, useFindAndModify: false });
            if (data) {
                return { status: true, msg: 'Updated successfully', data };
            } else {
                return { status: false, msg: 'Failed to update' };
            }
        } else {
            const data = await Repository.create(userInputs);
            if (data) {
                await PlotRepository.findOneAndUpdate(
                    { id: data.plotId }, { $set: { isSoliTestCompleted: true } },
                    { new: true, useFindAndModify: false }
                )
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
            return { status: true, msg: 'Fetched successfully', data, count};
        } else {
            return { status: false, msg: 'Failed to fetch' };
        }
    }

    async UpdateAll(req) {
        const { _id, fullName } = req.user;
        const { offlineData } = req.body;
        if (!!offlineData.length) {
            for (const inputs of offlineData) {
                const exist = inputs.id ? await Repository.findOne({ id: inputs.id }) : null;
                if (exist) {
                    inputs.updatedByName = fullName;
                    inputs.updatedById = _id;
                    const data = await Repository.findOneAndUpdate({ id: exist.id }, { $set: inputs },
                        { new: true, useFindAndModify: false });
                    if (!data) {
                        return { status: false, msg: 'Failed to update' };
                    }
                } else {
                    inputs.addedByName = fullName;
                    inputs.addedById = _id;
                    const data = await Repository.create(inputs);
                    if (!data) {
                        return { status: false, msg: 'Failed to add' };
                    }
                }
            }
            return { status: true, msg: 'Data Synced' };
        } else {
            return { status: false, msg: 'Got empty data' };
        }
    }
}

module.exports = Service;
