
const Repository = require("../database/models/notification");
const Role = require("../database/models/roles");
const DataCollector = require("../database/models/dataCollector");
const User = require("../database/models/user");
const Client = require("../database/models/clients");
const { convertToLowerCase, removeDuplicateObjects } = require('../utils');
const notification = require('../utils/functions/fcm');

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
            const role = await Role.findOne({ id: userInputs.roleId });

            // Check if role with given roleId exists
            if (!role) {
                return { status: false, msg: 'Invalid' };
            }

            // Create a new document in Repository with user inputs
            const data = await Repository.create(userInputs);

            // If creation of data is successful
            if (data) {
                let devices;

                // Check role name (case insensitive) and find corresponding devices
                if (role && convertToLowerCase(role.name) === 'datacollector') {
                    devices = await DataCollector.find({ roleId: data.roleId });
                } else if (role && convertToLowerCase(role.name) === 'client') {
                    devices = await Client.find({ roleId: data.roleId });
                } else {
                    devices = await User.find({ roleId: data.roleId });
                }

                // If devices are found
                if (!!devices.length) {
                    // Iterate through each device
                    for (let i = 0; i < devices.length; i++) {
                        // Prepare notification message
                        const message = {
                            to: devices[i].deviceToken,
                            notification: {
                                title: data.title,
                                body: data.description,
                            }
                        };

                        // Send notification to device
                        await notification(message);
                    }
                }

                // Return success message and created data
                return { status: true, msg: 'Added successfully', data };
            } else {
                // Return failure message if data creation fails
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
        if (size) delete query.size;
        if (page) delete query.page;
        if (search) {
            query['$or'] = [
                {
                    title: {
                        $regex: search,
                        $options: 'i',
                    },
                    description: {
                        $regex: search,
                        $options: 'i',
                    },
                },
            ];
            delete query.search;
        }
        let data = await Repository.find(query).sort({ createdAt: -1 }).limit(limit).skip(skip);
        const count = await Repository.find(query).countDocuments();
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
