
const Repository = require("../database/models/cropProtection");
const operationDate = require('../utils/functions/updateOperationDates');
const { POP_RESOURCES_DATA } = require('../config/index')
const { v4: uuidv4 } = require('uuid');


class Service {
    async Create(userInputs, id, newItem, objectId) {
        let results;

        // Check if `id` is provided
        if (id) {
            // Update an existing item

            // Check if `newItem` flag is true
            if (newItem) {
                // Create a new item operation

                // Find the existing data by `id`
                const data = await Repository.findOne({ id });

                // Assign a new unique `objectId` using uuidv4()
                userInputs.objectId = uuidv4();

                // Add the new operation to the existing `data`
                data.operations.push(userInputs);

                // Save the updated `data`
                data.save();

                // Prepare results for successful addition
                results = { status: true, msg: 'New Item successfully', data };
            } else if (objectId) {
                // Update an existing operation with specified `objectId`

                // Set `objectId` in `userInputs`
                userInputs.objectId = objectId;

                // Find and update the specific operation
                const data = await Repository.findOneAndUpdate(
                    { id: id, 'operations.objectId': objectId },
                    { $set: { 'operations.$': userInputs } },
                    { new: true, useFindAndModify: false } // Ensure to use native findOneAndUpdate
                );

                // Check if update was successful
                if (data) {
                    results = { status: true, msg: 'Object Updated successfully', data };
                } else {
                    results = { status: false, msg: 'Failed to update' };
                }
            } else {
                // Update the main `userInputs` for the entire item

                // Find and update the item
                const data = await Repository.findOneAndUpdate(
                    { id },
                    { $set: userInputs },
                    { new: true, useFindAndModify: false }
                );

                // Check if update was successful
                if (data) {
                    results = { status: true, msg: 'Updated successfully', data };
                } else {
                    results = { status: false, msg: 'Failed to update' };
                }
            }
        } else {
            // Create a new item

            // Ensure operations have unique `objectId` if provided
            if (userInputs.operations.length > 0) {
                userInputs.operations.map(operation => {
                    operation.objectId = uuidv4();
                });
            }

            // Create new item using `userInputs`
            const data = await Repository.create(userInputs);

            // Check if creation was successful
            if (data) {
                results = { status: true, msg: 'Added successfully', data };
            } else {
                results = { status: false, msg: 'Failed to add' };
            }
        }

        // Post-processing: Check and update operation dates
        if (results.status) {
            for (const operation of results.data.operations) {
                if (operation.operationItems.dateOfOperation) {
                    // Call operationDate function to handle operation date
                    const { status, msg } = await operationDate(
                        {
                            id: operation.objectId,
                            dateOfOperation: operation.operationItems.dateOfOperation,
                            seasonId: results.data.seasonId,
                        },
                        POP_RESOURCES_DATA.cropProtection + ` (${operation.operationName})`
                    );

                    // Handle failure case if operation date update fails
                    if (!status) {
                        return { status: true, msg: 'Failed to Note operation date. Please update the data with same values', errorMsg: msg, data: results.data };
                    }
                }
            }
            return results; // Return results if all operations are successful
        } else {
            return results; // Return failure results if initial operation failed
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
