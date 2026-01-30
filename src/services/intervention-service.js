const Repository = require("../database/models/intervention");
const ProjectRepository = require("../database/models/projects");
const { removeDuplicateObjects } = require('../utils');

class Service {

    async Create(userInputs, id) {
        const { cropId, cropName, isBaselineDefault } = userInputs;
        if (id) {
            const data = await Repository.findOneAndUpdate({ id }, { $set: userInputs }, { new: true, useFindAndModify: false });
            if(!data){
                return { status: false, msg: 'Failed to Update' };
            }
            await ProjectRepository.updateMany(
            {
                "crops.interventions.interventionId": id
            },
            {
                $set: {
                "crops.$[].interventions.$[intervention].isBaselineDefault": userInputs.isBaselineDefault,
                "crops.$[].interventions.$[intervention].interventionName": userInputs.name,
                "crops.$[].interventions.$[intervention].status": userInputs.status
                }
            },
            {
                arrayFilters: [
                { "intervention.interventionId": id }
                ]
            }
            );
            return { status: true, msg: 'Updated successfully', data };
        } else {
            let exist;
            if (isBaselineDefault === true) {
                exist = await Repository.find({ cropId, cropName, isBaselineDefault })
            }
            if (exist && exist.length) {
                return { status: false, msg: 'Baseline Intervention is already Created for this season' };
            }
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
        const { size = 20, page = 1 , search} = query
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
                {
                    cropTypeName: {
                        $regex: search,
                        $options: 'i',
                    },
                },
                {
                    cropName: {
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
            //let order the data based on the under data.pop.map(sno)
            data.forEach(intervention => {
                if (intervention.pop && intervention.pop.length > 0) {
                    intervention.pop.sort((a, b) => {
                        return a.sno.localeCompare(b.sno, undefined, { numeric: true });
                    });
                }
            });
            const total = search ? res.length : count;
            return { status: true, msg: 'Featched successfully', data: res, total };
        } else {
            return { status: false, msg: 'Failed to fetch' };
        }
    }

    async Multi(query) {

        const data = await Repository.find({
            cropId: { $in: query }
        });
        if (data) {
            return { status: true, msg: 'Fetched successfully', data };
        } else {
            return { status: false, msg: 'Failed to fetch' };
        }
    }
}

module.exports = Service;
