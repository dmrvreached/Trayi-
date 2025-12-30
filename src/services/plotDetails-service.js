const Repository = require("../database/models/plotDetails");
const SeasonRepository = require("../database/models/seasonDetails");
const DateRepository = require("../database/models/operationDates");
const SoilRepository = require("../database/models/soilInformation");
const { RESOURCES_DATA, POP_RESOURCES_DATA } = require("../config/index");

class Service {
  async Create(userInputs, id) {
    if (id) {
      const data = await Repository.findOneAndUpdate(
        { id },
        { $set: userInputs },
        { new: true, useFindAndModify: false }
      );
      if (data) {
        return { status: true, msg: "Updated successfully", data };
      } else {
        return { status: false, msg: "Failed to update" };
      }
    } else {
      const exist = await Repository.findOne({
        latitude: userInputs.latitude,
        longitude: userInputs.longitude,
      });
      if (exist) {
        return { status: false, msg: "Plot already exists at this location" };
      } else {
        const plots = await Repository.find({
          farmerId: userInputs.farmerId,
        }).countDocuments();
        userInputs.plotCode = `plot-${plots + 1}(${
          userInputs.totalAreaUnderProjectInAcres
        })`;
        const data = await Repository.create(userInputs);
        if (data) {
          return { status: true, msg: "Added successfully", data };
        } else {
          return { status: false, msg: "Failed to add" };
        }
      }
    }
  }

  async HardDelete(id) {
    // Find and delete main data entry with matching `id`
    const data = await Repository.findOneAndDelete({ id });

    // Check if main data deletion was successful
    if (data) {
      // If main data deletion was successful, proceed with related deletions

      // Delete associated soil data based on `plotId`
      await SoilRepository.findOneAndDelete({ plotId: id });

      // Find all seasons related to the `plotId`
      const seasons = await SeasonRepository.find({ plotId: id });

      // Check if there are seasons found
      if (seasons && seasons.length) {
        // Loop through each season found
        for (const season of seasons) {
          // Delete the season entry
          const deletedSeason = await SeasonRepository.findOneAndDelete({
            id: season.id,
          });

          // Check if season deletion was successful
          if (deletedSeason) {
            // If season deletion was successful, delete associated data in other repositories

            // Loop through keys in POP_RESOURCES_DATA (assumed to be constants for different resources)
            for (const key of Object.keys(POP_RESOURCES_DATA)) {
              let Database;
              try {
                // Load the appropriate database model dynamically
                Database = require(`../database/models/${key}`);
              } catch (error) {
                // Handle error if model loading fails
                return {
                  status: false,
                  msg: `Error loading ${key} resource`,
                  error,
                };
              }

              // Delete entries related to the current season in the loaded database model
              await Database.findOneAndDelete({ seasonId: season.id });
            }

            // Also delete dates related to the current season
            await DateRepository.findOneAndDelete({ seasonId: season.id });
          }
        }
      }

      // Return success message after all deletions
      return { status: true, msg: "Deleted successfully", data };
    } else {
      // Return failure message if main data deletion fails
      return { status: false, msg: "Failed to delete" };
    }
  }

  async Get(query) {
    const { size = 20, page = 1 } = query;
    const limit = parseInt(size);
    const skip = (page - 1) * size;
    if (size) delete query.size;
    if (page) delete query.page;
    const count = await Repository.find(query).countDocuments();
    const data = await Repository.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);
    if (data) {
      return { status: true, msg: "Fetched successfully", data, count };
    } else {
      return { status: false, msg: "Failed to fetch" };
    }
  }

  async UpdateAll(req) {
    // Destructure `user` object from request
    const { _id, fullName } = req.user;

    // Destructure `offlineData` from request body
    const { offlineData } = req.body;

    // Check if `offlineData` array has any elements
    if (!!offlineData.length) {
      // Loop through each `inputs` object in `offlineData`
      for (const inputs of offlineData) {
        // Check if `inputs` has an `id` property
        const exist = inputs.id
          ? await Repository.findOne({ id: inputs.id })
          : null;

        // If `inputs` with matching `id` exists, update it
        if (exist) {
          // Update `updatedByName` and `updatedById` with current user details
          inputs.updatedByName = fullName;
          inputs.updatedById = _id;

          // Find and update the existing data with `inputs`
          const data = await Repository.findOneAndUpdate(
            { id: exist.id },
            { $set: inputs },
            { new: true, useFindAndModify: false }
          );

          // Check if update was successful
          if (!data) {
            return { status: false, msg: "Failed to update" };
          }
        } else {
          // If `inputs` does not have an `id`, it's a new entry

          // Count existing plots for the farmer to generate `plotCode`
          const plots = await Repository.find({
            farmerId: inputs.farmerId,
          }).countDocuments();

          // Update `addedByName`, `addedById`, and generate `plotCode`
          inputs.addedByName = fullName;
          inputs.addedById = _id;
          inputs.plotCode = `plot-${plots + 1}(${
            inputs.totalAreaUnderProjectInAcres
          })`;

          // Create a new entry in the repository with `inputs`
          const data = await Repository.create(inputs);

          // Check if creation was successful
          if (!data) {
            return { status: false, msg: "Failed to add" };
          }
        }
      }
      // Return success message after syncing all data
      return { status: true, msg: "Data Synced" };
    } else {
      // Return error message if `offlineData` is empty
      return { status: false, msg: "Got empty data" };
    }
  }
}

module.exports = Service;
