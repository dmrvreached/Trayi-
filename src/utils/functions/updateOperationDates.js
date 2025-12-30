const Repository = require('../../database/models/operationDates'); // Importing the operationDates model from database
const { dateValidate, removeDuplicateObjects } = require('../index'); // Importing dateValidate function and removeDuplicateObjects function from index.js
const { POP_RESOURCES_DATA } = require('../../config/index'); // Importing POP_RESOURCES_DATA from config

async function updateOperationDates(data, popName) {
    try {
        // Check if operation dates exist for the given seasonId
        const exist = await Repository.findOne({ seasonId: data.seasonId });

        // Determine valid date based on input or updatedAt field
        const validDate = dateValidate(data.dateOfOperation ? data.dateOfOperation : new Date(data.updatedAt));

        if (exist) {
            // If operation dates exist for seasonId, find if popId already exists in dateArray
            const find = exist.dateArray.find(item => item.popId === data.id);

            if (find) {
                // If popId exists in dateArray, update its details
                if (POP_RESOURCES_DATA.drying === popName || POP_RESOURCES_DATA.threshing === popName || POP_RESOURCES_DATA.storage === popName) {
                    // Handle specific POP resources data scenarios
                    if (data.isThreshing || data.isStorage || data.isDrying) {
                        // Update existing entry in dateArray
                        exist.dateArray.map((i) => {
                            if (i.popId === data.id) {
                                i.popName = popName;
                                i.date = validDate;
                                i.activities = `${popName} collected`;
                            }
                        });
                    } else {
                        // Remove entry from dateArray if specific conditions are not met
                        exist.dateArray = exist.dateArray.filter((i) => {
                            if (i.popId === data.id) {
                                return true;
                            }
                            return false;
                        });
                    }
                } else {
                    // Update existing entry in dateArray (default scenario)
                    exist.dateArray.map((i) => {
                        if (i.popId === data.id) {
                            i.popName = popName;
                            i.date = validDate;
                            i.activities = `${popName} collected`;
                        }
                    });
                }
            } else {
                // If popId does not exist in dateArray, add a new entry
                if (POP_RESOURCES_DATA.drying === popName || POP_RESOURCES_DATA.threshing === popName || POP_RESOURCES_DATA.storage === popName) {
                    // Handle specific POP resources data scenarios
                    if (data.isThreshing || data.isStorage || data.isDrying) {
                        // Add new entry to dateArray
                        exist.dateArray.push({
                            popId: data.id,
                            popName: popName,
                            date: validDate,
                            activities: `${popName} collected`
                        });
                    }
                } else {
                    // Add new entry to dateArray (default scenario)
                    exist.dateArray.push({
                        popId: data.id,
                        popName: popName,
                        date: validDate,
                        activities: `${popName} collected`
                    });
                }
            }

            // Remove duplicates from dateArray based on popName
            exist.dateArray = removeDuplicateObjects(exist.dateArray, "popName");

            // Save updated operation dates
            await exist.save();
            return { status: true, msg: 'Updated successfully' };
        } else {
            // If operation dates do not exist for the given seasonId
            return { status: true, msg: 'Operation dates not found for this season/Plot' };
        }
    } catch (error) {
        // Catch any errors that occur during the process
        console.log(error);
        return { status: false, msg: 'Something went wrong', error };
    }
}

module.exports = updateOperationDates; // Export the updateOperationDates function
