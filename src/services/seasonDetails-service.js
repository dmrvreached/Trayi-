const Repository = require("../database/models/seasonDetails");
const PlotRepository = require("../database/models/plotDetails");
const FarmerRepository = require("../database/models/farmerDetails");
const InterventionRepository = require("../database/models/intervention");
const DateRepository = require("../database/models/operationDates");
const { RESOURCES_DATA, POP_RESOURCES_DATA } = require("../config/index");
const { v4: uuidv4 } = require("uuid");

class Service {
  async Create(userInputs, id) {
    const { seasonType, plotId, cultivationYear, seasonName } = userInputs;

    if (id) {
      // Update existing season if ID is provided
      const data = await Repository.findOneAndUpdate(
        { id },
        { $set: userInputs },
        { new: true, useFindAndModify: false }
      );
      if (data) {
        let params = {};

        // Check if the season is dynamic and update plot accordingly
        if (data.isDynamicSeasonCompleted) {
          params.isDynamicOngoing = false;
          params.isDynamicStatus = "COMPLETED";
          params.dynamicSeasonId = null;
          await PlotRepository.findOneAndUpdate(
            { id: data.plotId, dynamicSeasonId: data.id },
            { $set: params },
            { new: true, useFindAndModify: false }
          );
        } else if (data.isBaselineSeasonCompleted) {
          // Check if the season is baseline and update plot accordingly
          params.isBaselineCompleted = true;
          params.isBaselineStatus = "COMPLETED";
          params.baselineSeasonId = null;
          await PlotRepository.findOneAndUpdate(
            { id: data.plotId, baselineSeasonId: data.id },
            { $set: params },
            { new: true, useFindAndModify: false }
          );
        }

        return { status: true, msg: "Updated successfully", data };
      } else {
        return { status: false, msg: "Failed to update" };
      }
    } else {
      // Check if a season already exists for the given plot
      const exist = await Repository.find({
        seasonType,
        plotId,
        cultivationYear,
        seasonName,
      });
      if (exist && exist.length) {
        return {
          status: false,
          msg: "Season is already created for this plot",
        };
      }

      // Create a new season if no ID is provided
      const data = await Repository.create(userInputs);
      if (data) {
        let params = {};

        // Update plot status based on the season type
        if (data.seasonType === 1) {
          // Assuming seasonType 1 represents dynamic season
          params.isDynamicOngoing = true;
          params.isDynamicStatus = "ONGOING";
          params.dynamicSeasonId = data.id;

          // Create a new entry in DateRepository for dynamic season
          await DateRepository.create({
            seasonId: data.id,
            plotId: data.plotId,
            farmerId: data.farmerId,
            dateArray: [],
            id: uuidv4(),
            addedByName: userInputs.addedByName,
            addedById: userInputs.addedById,
          });
        } else {
          // For baseline season, update baseline status
          params.isBaselineStatus = "ONGOING";
          params.baselineSeasonId = data.id;
        }

        // Update plot with the new season information
        await PlotRepository.findOneAndUpdate(
          { id: data.plotId },
          { $set: params },
          { new: true, useFindAndModify: false }
        );

        return { status: true, msg: "Added successfully", data };
      } else {
        return { status: false, msg: "Failed to add" };
      }
    }
  }

  async HardDelete(id) {
    const data = await Repository.findOneAndDelete({ id });
    if (data) {
      for (const key of Object.keys(POP_RESOURCES_DATA)) {
        let Database;
        try {
          Database = require(`../database/models/${key}`);
        } catch (error) {
          return { status: false, msg: `Error loading ${key} resource`, error };
        }
        await Database.findOneAndDelete({ seasonId: id });
      }
      await DateRepository.findOneAndDelete({ seasonId: id });
      let params = {};
      if (data.seasonType === 1) {
        params.isDynamicOngoing = false;
        params.isDynamicStatus = "NOT_CREATED";
        params.dynamicSeasonId = null;
      } else {
        params.isBaselineStatus = "NOT_CREATED";
        params.baselineSeasonId = null;
      }
      await PlotRepository.findOneAndUpdate(
        { id: data.plotId },
        { $set: params },
        { new: true, useFindAndModify: false }
      );
      return { status: true, msg: "Deleted successfully", data };
    } else {
      return { status: false, msg: "Failed to delete" };
    }
  }

  async Get(query) {
    const { id, isSubmit } = query;
    if (isSubmit) {
      const season = await Repository.findOne({ id });
      if (season) {
        const intervention = await InterventionRepository.findOne({
          id: season.interventionId,
        });
        const popPromises = intervention.pop.map(async (pop) => {
          const Database = require(`../database/models/${pop.popName}`);
          const find = await Database.findOne({ seasonId: id });
          if (find) {
            return { status: true, msg: `${pop.popName} is created` };
          }
          return { status: false, msg: `${pop.popName} is not created` };
        });
        const popResults = await Promise.all(popPromises);
        const msg = popResults.find((error) => error.status == false);
        console.log("msg", msg);
        if (!msg) {
          let params = {};
          if (season.seasonType === 1) {
            season.isDynamicSeasonCompleted = true;
            await season.save();
            params.isDynamicOngoing = false;
            params.isDynamicStatus = "COMPLETED";
            params.dynamicSeasonId = "";
          } else {
            season.isBaselineSeasonCompleted = true;
            await season.save();
            params.isBaselineCompleted = true;
            params.isBaselineStatus = "COMPLETED";
            params.baselineSeasonId = "";
          }
          await PlotRepository.findOneAndUpdate(
            { id: season.plotId },
            { $set: params },
            { new: true, useFindAndModify: false }
          );
          return { status: true, msg: "All POPs are completed", data: season };
        } else {
          return msg;
        }
      } else {
        return { status: false, msg: "Season not found" };
      }
    } else {
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
        let newData;
        if (Object.keys(query).length) {
          newData = await Promise.all(
            data.map(async (item) => {
              const farmer = await FarmerRepository.findOne({
                id: item.farmerId,
              });
              const intervention = await InterventionRepository.findOne({
                id: item.interventionId,
              });
             // Inside the map function, after getting intervention
const popPromises = intervention.pop
  .sort((a, b) => parseInt(a.sno) - parseInt(b.sno)) // Sort by sno
  .map(async (pop) => {
    const Database = require(`../database/models/${pop.popName}`);
    const find = await Database.findOne({ seasonId: id });
    if (find) {
      return {
        status: true,
        name: pop.popName,
        sno: pop.sno, // Include sno for reference
        msg: `${pop.popName} is submited`,
      };
    }
    return {
      status: false,
      name: pop.popName,
      sno: pop.sno, // Include sno for reference
      msg: `${pop.popName} is not submited`,
    };
  });
              return {
                ...item.toObject(),
                seasonId: item.id,
                farmerName: farmer ? farmer.farmerName : "",
                farmerCode: farmer ? farmer.farmerCode : "",
                interventionDetails: intervention ? intervention : "",
                popStatus: await Promise.all(popPromises),
              };
            })
          );
        }
          return {
          status: true,
          msg: "Fetched successfully",
          data: newData ? newData : data,
          count,
        };
      } else {
        return { status: false, msg: "Failed to fetch" };
      }
    }
  }

  // async UpdateAll(req) {
  //     const { _id, fullName } = req.user; // Extract user information from request
  //     const { offlineData } = req.body; // Extract offlineData from request body

  //     if (!!offlineData.length) { // Check if offlineData array is not empty
  //         for (const userInputs of offlineData) {
  //             const { seasonType, plotId, cultivationYear, seasonName } = userInputs;

  //             // Check if the season entry exists by ID
  //             const exist = userInputs.id ? await Repository.findOne({ id: userInputs.id }) : null;

  //             if (exist) { // Update existing season if it exists
  //                 userInputs.updatedByName = fullName;
  //                 userInputs.updatedById = _id;

  //                 // Update season in Repository
  //                 const data = await Repository.findOneAndUpdate(
  //                     { id: userInputs.id },
  //                     { $set: userInputs },
  //                     { new: true, useFindAndModify: false }
  //                 );

  //                 if (data) {
  //                     let params = {};

  //                     // Check if the season is dynamic and update plot accordingly
  //                     if (data.isDynamicSeasonCompleted) {
  //                         params.isDynamicOngoing = false;
  //                         params.isDynamicStatus = 'COMPLETED';
  //                         params.dynamicSeasonId = null;
  //                         await PlotRepository.findOneAndUpdate(
  //                             { id: data.plotId, dynamicSeasonId: data.id },
  //                             { $set: params },
  //                             { new: true, useFindAndModify: false }
  //                         );
  //                     } else if (data.isBaselineSeasonCompleted) {
  //                         // Check if the season is baseline and update plot accordingly
  //                         params.isBaselineCompleted = true;
  //                         params.isBaselineStatus = 'COMPLETED';
  //                         params.baselineSeasonId = null;
  //                         await PlotRepository.findOneAndUpdate(
  //                             { id: data.plotId, baselineSeasonId: data.id },
  //                             { $set: params },
  //                             { new: true, useFindAndModify: false }
  //                         );
  //                     }
  //                 } else {
  //                     return { status: false, msg: 'Failed to update' };
  //                 }
  //             } else { // Create new season if it doesn't exist
  //                 userInputs.addedByName = fullName;
  //                 userInputs.addedById = _id;

  //                 // Check if a season already exists for the given plot
  //                 const exist = await Repository.find({ seasonType, plotId, cultivationYear, seasonName });
  //                 if (exist && exist.length) {
  //                     return { status: false, msg: 'Season is already created for this plot' };
  //                 }

  //                 // Create new season in Repository
  //                 const data = await Repository.create(userInputs);
  //                 if (data) {
  //                     let params = {};

  //                     // Update plot status based on the season type
  //                     if (data.seasonType === 1) { // Assuming seasonType 1 represents dynamic season
  //                         params.isDynamicOngoing = true;
  //                         params.isDynamicStatus = 'ONGOING';
  //                         params.dynamicSeasonId = data.id;

  //                         // Create a new entry in DateRepository for dynamic season
  //                         await DateRepository.create({
  //                             seasonId: data.id,
  //                             plotId: data.plotId,
  //                             farmerId: data.farmerId,
  //                             dateArray: [],
  //                             id: uuidv4(),
  //                             addedByName: userInputs.addedByName,
  //                             addedById: userInputs.addedById,
  //                         });
  //                     } else {
  //                         // For baseline season, update baseline status
  //                         params.isBaselineStatus = 'ONGOING';
  //                         params.baselineSeasonId = data.id;
  //                     }

  //                     // Update plot with the new season information
  //                     await PlotRepository.findOneAndUpdate(
  //                         { id: data.plotId },
  //                         { $set: params },
  //                         { new: true, useFindAndModify: false }
  //                     );
  //                 } else {
  //                     return { status: false, msg: 'Failed to add' };
  //                 }
  //             }
  //         }
  //         return { status: true, msg: 'Data Synced' };
  //     } else {
  //         return { status: false, msg: 'Got empty data' };
  //     }
  // }
  async UpdateAll(req) {
    const { _id, fullName } = req.user; // Extract user information from request
    const { offlineData } = req.body; // Extract offlineData from request body

    if (!!offlineData.length) {
      // Check if offlineData array is not empty
      let skippedRecords = 0; // To count the skipped records

      for (const userInputs of offlineData) {
        const { seasonType, plotId, cultivationYear, seasonName } = userInputs;

        // Check if the season entry exists by ID
        const exist = userInputs.id
          ? await Repository.findOne({ id: userInputs.id })
          : null;

        if (exist) {
          // Update existing season if it exists
          userInputs.updatedByName = fullName;
          userInputs.updatedById = _id;

          // Update season in Repository
          const data = await Repository.findOneAndUpdate(
            { id: userInputs.id },
            { $set: userInputs },
            { new: true, useFindAndModify: false }
          );

          if (data) {
            let params = {};

            // Check if the season is dynamic and update plot accordingly
            if (data.isDynamicSeasonCompleted) {
              params.isDynamicOngoing = false;
              params.isDynamicStatus = "COMPLETED";
              params.dynamicSeasonId = null;
              await PlotRepository.findOneAndUpdate(
                { id: data.plotId, dynamicSeasonId: data.id },
                { $set: params },
                { new: true, useFindAndModify: false }
              );
            } else if (data.isBaselineSeasonCompleted) {
              // Check if the season is baseline and update plot accordingly
              params.isBaselineCompleted = true;
              params.isBaselineStatus = "COMPLETED";
              params.baselineSeasonId = null;
              await PlotRepository.findOneAndUpdate(
                { id: data.plotId, baselineSeasonId: data.id },
                { $set: params },
                { new: true, useFindAndModify: false }
              );
            }
          } else {
            skippedRecords++;
          }
        } else {
          // Create new season if it doesn't exist
          userInputs.addedByName = fullName;
          userInputs.addedById = _id;

          // Check if a season already exists for the given plot
          const existingSeason = await Repository.find({
            seasonType,
            plotId,
            cultivationYear,
            seasonName,
          });
          if (existingSeason && existingSeason.length) {
            skippedRecords++; // Skip the record without showing an error
            continue; // Skip the creation of this season and move to the next one
          }

          // Create new season in Repository
          const data = await Repository.create(userInputs);
          if (data) {
            let params = {};

            // Update plot status based on the season type
            if (data.seasonType === 1) {
              // Assuming seasonType 1 represents dynamic season
              params.isDynamicOngoing = true;
              params.isDynamicStatus = "ONGOING";
              params.dynamicSeasonId = data.id;

              // Create a new entry in DateRepository for dynamic season
              await DateRepository.create({
                seasonId: data.id,
                plotId: data.plotId,
                farmerId: data.farmerId,
                dateArray: [],
                id: uuidv4(),
                addedByName: userInputs.addedByName,
                addedById: userInputs.addedById,
              });
            } else {
              // For baseline season, update baseline status
              params.isBaselineStatus = "ONGOING";
              params.baselineSeasonId = data.id;
            }

            // Update plot with the new season information
            await PlotRepository.findOneAndUpdate(
              { id: data.plotId },
              { $set: params },
              { new: true, useFindAndModify: false }
            );
          } else {
            skippedRecords++;
          }
        }
      }

      // Return success message with information on skipped records
      if (skippedRecords > 0) {
        return {
          status: true,
          msg: `Data Synced with ${skippedRecords} skipped records`,
        };
      }
      return { status: true, msg: "Data Synced" };
    } else {
      return { status: false, msg: "Got empty data" };
    }
  }
}

module.exports = Service;
