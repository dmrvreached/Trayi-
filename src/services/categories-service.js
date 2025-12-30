const Repository = require("../database/models/categories");
const { convertToCamelCase, removeDuplicateObjects } = require('../utils')
const { v4: uuidv4 } = require('uuid');

class CategoriesService {

    async Create(userInputs, id) {
        const fieldsArray = [];
        if (id) {
            if (userInputs.modelName) {
                return { status: false, msg: `Model name can't be modified` };
            };
            userInputs.fields.map(async (item) => {
                item.fieldId = item.fieldId ? item.fieldId : uuidv4();
                fieldsArray.push(item.fieldName)
                item.fieldName = convertToCamelCase(item?.fieldName);
                return item;
            })
            const data = await Repository.findOneAndUpdate({ id }, { $set: userInputs }, { new: true, useFindAndModify: false });
            if (data) {
                // model(data.modelName, data.fields)
                return { status: true, msg: 'Update successfully', data, fieldsArray };
            } else {
                return { status: false, msg: 'Failed to update' };
            }
        } else {
            userInputs.modelName = convertToCamelCase(userInputs.modelName)
            userInputs.fields.map((item) => {
                item.fieldName = convertToCamelCase(item?.fieldName)
                fieldsArray.push(item.fieldName)
                item.fieldId = uuidv4();
                return item;
            })
            const data = await Repository.create(userInputs);
            if (data) {
                return { status: true, msg: 'Added successfully', data, fieldsArray };
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
        const fields = [];
        const { size = 20, page = 1, search } = query
        const limit = parseInt(size);
        const skip = (page - 1) * size;
        if (size) delete query.size;
        if (page) delete query.page;
        if (search) {
            query['$or'] = [
                {
                    modelName: {
                        $regex: search,
                        $options: 'i',
                    },
                },
            ];
            delete query.search;
        }
        const data = await Repository.find(query).sort({ createdAt: -1 }).limit(limit).skip(skip)
        const count = await Repository.find(query).countDocuments();

        if (data) {
            const res = search ? removeDuplicateObjects(data, 'id') : data;
            const total = search ? res.length : count;
            res.forEach((item) => {
                let arr = [];
                item.fields.forEach((field) => {
                    arr.push(field.fieldName)
                })
                fields.push(arr)
            })
            return { status: true, msg: 'Featched successfully', data: res, total };
        } else {
            return { status: false, msg: 'Failed to fetch' };
        }
    }
}

module.exports = CategoriesService;
