const Repository = require("../../database/models/farmerDetails");

const generateFarmerCode = async (project, state, district, block) => {
    try {
        // Get current date to format as part of the farmer code
        const currentDate = new Date();
        const formattedDate = currentDate.toLocaleString('default', { month: 'short' }).toUpperCase() + currentDate.getFullYear().toString().substr(-2);

        // Create a substring from project, state, district, and block initials
        const substring = `${project.substring(0, 2).toUpperCase()}/${state.substring(0, 2).toUpperCase()}/${district.substring(0, 3).toUpperCase()}/${block.substring(0, 3).toUpperCase()}`;

        // Find the latest farmer entry that matches the substring pattern
        const latestFarmer = await Repository.findOne({ farmerCode: new RegExp('^' + substring) }).sort({ createdAt: -1 });

        let farmerId = 1;
        if (latestFarmer) {
            // Extract the farmer ID part from the latest farmer code and increment
            const latestFarmerId = latestFarmer.farmerCode.split('/').pop();
            farmerId = parseInt(latestFarmerId) + 1;
        }

        // Format the final farmer code including substring, date, and padded farmer ID
        return `${substring}/${formattedDate}/${String(farmerId).padStart(4, '0')}`;

    } catch (error) {
        // Return error if there's an exception
        return error;
    }
};

module.exports = generateFarmerCode;
