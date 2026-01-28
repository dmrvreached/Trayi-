const ClientRepository = require("../database/models/clients");
const DCRepository = require("../database/models/dataCollector");
const Version = require("../database/models/version");
const FarmerRepository = require("../database/models/farmerDetails");
const PlotRepository = require("../database/models/plotDetails");
const SeasonRepository = require("../database/models/seasonDetails");
const SoilInformationRepository = require("../database/models/soilInformation");
const ProjectRepository = require("../database/models/projects");
const VillageRepository = require("../database/models/village");
const InterventionRepository = require("../database/models/intervention");
const operationDate = require("../utils/functions/updateOperationDates");
const Repository = require("../database/models/harvesting");
const { uploadFile } = require("../utils/functions/blobStorage");
const { removeFieldsFromObject, convertToCamelCase } = require("../utils");
const exportToExcel = require("../utils/functions/reports");
const { RESOURCES_DATA, POP_RESOURCES_DATA } = require("../config/index");
const moment = require("moment");

// All Business logic will be here
class Service {
  async Count(clientId) {
    // Initialize data with default values
    let data = {
      projects: 0,
      dataCollector: 0,
      farmer: 0,
      plots: 0,
      seasons: 0,
      acres: 100,
    };

    // If clientId is provided, fetch details related to that client
    if (clientId) {
      // Fetch client details based on clientId
      const clientDetails = await ClientRepository.findOne({ id: clientId });

      // If client details exist and they have associated projects
      if (clientDetails && clientDetails.projects.length > 0) {
        // Update projects count based on the number of projects associated with the client
        data.projects += clientDetails.projects.length;

        // Loop through each project of the client
        for (const project of clientDetails.projects) {
          // Fetch data collectors associated with the current project
          const DCdetails = await DCRepository.find({
            projects: {
              $elemMatch: {
                projectId: project.projectId,
              },
            },
          });

          // Update data collector count based on the number of data collectors found
          data.dataCollector += DCdetails.length;

          // Fetch farmers associated with the current project
          const farmerDetails = await FarmerRepository.find({
            projectId: project.projectId,
          });

          // Update farmer count based on the number of farmers found
          data.farmer += farmerDetails.length;

          // Loop through each farmer to fetch plots and seasons counts
          for (const f of farmerDetails) {
            // Update plots count based on the number of plots associated with the farmer
            data.plots += await PlotRepository.countDocuments({
              farmerId: f.id,
            });

            // Update seasons count based on the number of seasons associated with the farmer
            data.seasons += await SeasonRepository.countDocuments({
              farmerId: f.id,
            });
          }
        }
      }
    } else {
      // If clientId is not provided, fetch counts for all entities without client-specific filtering
      const client = await ClientRepository.countDocuments();
      const dataCollector = await DCRepository.countDocuments();
      const farmer = await FarmerRepository.countDocuments();
      const plots = await PlotRepository.countDocuments();
      const seasons = await SeasonRepository.countDocuments();
      const projects = await ProjectRepository.countDocuments();

      // Update data with counts fetched from repositories
      data = {
        farmer,
        projects,
        dataCollector,
        client,
        plots,
        seasons,
        acres: 100,
      };
    }

    // Check if data is populated (i.e., operation successful)
    if (data) {
      return { status: true, msg: "Fetched successfully", data };
    } else {
      return { status: false, msg: "Failed" };
    }
  }

  async UploadBulk(files) {
    // Initialize an array to store uploaded file data
    const data = [];

    // Loop through each file in the files array
    for (const file of files) {
      // Upload each file asynchronously and push the result to the data array
      data.push(await uploadFile(file));
    }

    // Check if data array is populated (i.e., files were uploaded successfully)
    if (data) {
      // Return success status along with uploaded data
      return { status: true, msg: "Uploaded successfully", data };
    } else {
      // Return failure status if data array is empty or falsy (though this scenario is unlikely with an array)
      return { status: false, msg: "Failed" };
    }
  }

  async Upload(file) {
    // Upload the file asynchronously and wait for the result
    const data = await uploadFile(file);

    // Check if data is truthy (indicating successful upload)
    if (data) {
      // Return success status along with uploaded data
      return { status: true, msg: "Uploaded successfully", data };
    } else {
      // Return failure status if data is falsy (indicating upload failure)
      return { status: false, msg: "Failed" };
    }
  }

  async Report(query, body) {
    // Destructuring query and body parameters
    const { resource = "dataCollector", clientId } = query;
    const { start, end, filters } = body;
    let params;

    // Setting up params based on start and end dates if provided
    if (start && end) {
      params = {
        ...filters,
        createdAt: {
          $gte: new Date(`${start}T00:00:00.000Z`),
          $lte: new Date(`${end}T23:59:59.999Z`),
        },
      };
    }

    // Initializing data and headers arrays
    let data = [];
    let headers = [];
    let Database;

    try {
      // Attempting to load the appropriate Database model based on resource
      Database = require(`../database/models/${resource}`);
    } catch (error) {
      // Handling resource loading error
      return { status: false, msg: "resource not found", error };
    }

    // If clientId is provided, fetch client details
    if (clientId) {
      const clientDetails = await ClientRepository.findOne({ id: clientId });
      if (clientDetails) {
        // Iterating through client's projects
        for (const project of clientDetails.projects) {
          if (resource === "dataCollector") {
            // Adding project filter for dataCollector resource
            params.projects = {
              $elemMatch: {
                projectId: project.projectId,
              },
            };
            // Fetching data based on params
            const find = await Database.find(params);
            if (find && find.length) {
              find.forEach((i, n) => {
                let res = i._doc;
                // Adding identifiers and formatting specific to resource type
                if (resource === "dataCollector")
                  (res.DCId = "DC" + String(n + 1).padStart(4, "0")),
                    (res = { DCId: res.DCId, ...res });
                if (resource === "clients")
                  (res.CLId = "CL" + String(n + 1).padStart(4, "0")),
                    (res = { CLId: res.CLId, ...res });
                // Adding project names if available
                if (i.projects && i.projects.length) {
                  i.projects.forEach((p, i) => {
                    res["project" + (i + 1)] = p.name;
                  });
                }
                // Removing unnecessary fields from the result object
                res = removeFieldsFromObject(res, [
                  "photo",
                  "referancePhoto",
                  "projects",
                  "plotBoundries",
                  "projectId",
                  "plotId",
                  "baselineSeasonId",
                  "dynamicSeasonId",
                  "farmerId",
                  "dcId",
                  "roleId",
                  "id",
                  "stateId",
                  "districtId",
                  "blockId",
                  "interventionId",
                  "cropId",
                  "cropTypeId",
                ]);
                data.push(res);
                // Collecting headers dynamically
                Object.keys(res).forEach((key) => {
                  if (!headers.includes(key)) {
                    headers.push(key);
                  }
                });
              });
            }
          } else {
            // Fetching data for other resources (projects, farmerDetails, etc.)
            let find = [];
            const farmerDetails = await FarmerRepository.find({
              ...params,
              projectId: project.projectId,
            });
            if (resource === "projects") {
              params.id = project.projectId;
              find = await Database.find(params);
            } else if (resource === "farmerDetails") {
              find = farmerDetails;
            } else {
              // Handling nested arrays of data for other resource types
              let arrayOfArrays = [];
              for (const f of farmerDetails) {
                arrayOfArrays.push(
                  await Database.find({ ...params, farmerId: f.id })
                );
              }
              find = [].concat(...arrayOfArrays);
            }
            if (find && find.length) {
              find.forEach((i, n) => {
                let res = i._doc;
                // Adding identifiers and formatting
                if (resource === "dataCollector")
                  (res.DCId = "DC" + String(n + 1).padStart(4, "0")),
                    (res = { DCId: res.DCId, ...res });
                if (resource === "clients")
                  (res.CLId = "CL" + String(n + 1).padStart(4, "0")),
                    (res = { CLId: res.CLId, ...res });
                // Adding project names if available
                if (i.projects && i.projects.length) {
                  i.projects.forEach((p, i) => {
                    res["project" + (i + 1)] = p.name;
                  });
                }
                // Removing unnecessary fields
                res = removeFieldsFromObject(res, [
                  "photo",
                  "referancePhoto",
                  "projects",
                  "plotBoundries",
                  "projectId",
                  "plotId",
                  "baselineSeasonId",
                  "dynamicSeasonId",
                  "farmerId",
                  "dcId",
                  "roleId",
                  "id",
                  "stateId",
                  "districtId",
                  "blockId",
                  "interventionId",
                  "cropId",
                  "cropTypeId",
                ]);
                data.push(res);
                // Collecting headers dynamically
                Object.keys(res).forEach((key) => {
                  if (!headers.includes(key)) {
                    headers.push(key);
                  }
                });
              });
            }
          }
        }
      }
    } else {
      // Fetching data if clientId is not provided
      const find = await Database.find(params);
      if (find && find.length) {
        find.forEach((i, n) => {
          let res = i._doc;
          // Adding identifiers and formatting
          if (resource === "dataCollector")
            (res.DCId = "DC" + String(n + 1).padStart(4, "0")),
              (res = { DCId: res.DCId, ...res });
          if (resource === "clients")
            (res.CLId = "CL" + String(n + 1).padStart(4, "0")),
              (res.clientId = res.id),
              (res = { clientId: res.clientId, CLId: res.CLId, ...res });
          // Adding project names if available
          if (i.projects && i.projects.length) {
            i.projects.forEach((p, i) => {
              res["project" + (i + 1)] = p.name;
            });
          }
          // Removing unnecessary fields
          res = removeFieldsFromObject(res, [
            "photo",
            "referancePhoto",
            "userPermissions",
            "projects",
            "fieldCollectorIncharge",
            "plotBoundries",
            "projectId",
            "plotId",
            "baselineSeasonId",
            "dynamicSeasonId",
            "farmerId",
            "dcId",
            "roleId",
            "id",
            "stateId",
            "districtId",
            "blockId",
            "interventionId",
            "cropId",
            "cropTypeId",
          ]);
          data.push(res);
          // Collecting headers dynamically
          Object.keys(res).forEach((key) => {
            if (!headers.includes(key)) {
              headers.push(key);
            }
          });
        });
      }
    }

    // Uncomment the line below to export data to Excel
    // await exportToExcel(data, resource)

    // Returning response based on data availability
    if (data) {
      return { status: true, msg: "Fetched successfully", headers, data };
    } else {
      return { status: false, msg: "Failed" };
    }
  }

  async Labels(query) {
    // Initializing variables
    let Database;
    const { resource } = query;

    try {
      // Attempting to load the appropriate Database model based on resource
      Database = require(`../database/models/${resource}`);
    } catch (error) {
      // Handling resource loading error
      return { status: false, msg: "resource not found", error };
    }

    // Fields to exclude from the query result
    const includedFields = {
      __v: 0,
      _id: 0,
      otp: 0,
      JWT_token: 0,
      deviceToken: 0,
      password: 0,
      isDeleted: 0,
      emailVerification: 0,
      phoneVerification: 0,
      photo: 0,
      blockId: 0,
      roleId: 0,
      districtId: 0,
      stateId: 0,
      cropTypeId: 0,
      cropId: 0,
      dcId: 0,
      projectId: 0,
      updatedByName: 0,
      addedById: 0,
      updatedAt: 0,
      updatedById: 0,
      updatedByName: 0,
    };

    // Fetching a single document from the Database with specified fields excluded
    const find = await Database.findOne({}, includedFields);

    // Extracting keys from the document's _doc property
    const data = Object.keys(find._doc);

    // Returning response based on data availability
    if (data) {
      return { status: true, msg: "Fetched successfully", data };
    } else {
      return { status: false, msg: "Failed" };
    }
  }

  async Resource(query) {
    // Initialize an empty array to store data
    let data = [];

    // Determine the resource object based on query.isPOP flag
    let resource = query.isPOP
      ? { ...POP_RESOURCES_DATA, ...RESOURCES_DATA }
      : RESOURCES_DATA;

    // If clientId is provided in query, fetch client details and counts
    if (query.clientId) {
      // Fetch client details based on clientId
      const clientDetails = await ClientRepository.findOne({
        id: query.clientId,
      });

      // Initialize counters for data collectors (DC) and farmers
      let dcCount = 0;
      let farmerCount = 0;

      // Iterate through client's projects to count DCs and farmers
      for (const p of clientDetails.projects) {
        // Count data collectors (DC) for each project
        dcCount += await DCRepository.countDocuments({
          projects: { $elemMatch: { projectId: p.projectId } },
        });

        // Count farmers for each project
        farmerCount += await FarmerRepository.countDocuments({
          projectId: p.projectId,
        });
      }

      // Push data for each resource type related to client projects
      data.push(
        {
          name: "dataCollector",
          label: "Data Collectors",
          active: dcCount,
        },
        {
          name: "farmerDetails",
          label: "Farmer Details",
          active: farmerCount,
        },
        {
          name: "projects",
          label: "Projects",
          active: clientDetails.projects.length,
        }
      );
    } else {
      // If clientId is not provided, iterate through resources in 'resource' object
      for (const key of Object.keys(resource)) {
        let Database;
        try {
          // Attempt to load the database model based on the resource key
          Database = require(`../database/models/${key}`);
        } catch (error) {
          // Handle error if resource loading fails
          return { status: false, msg: `Error loading ${key} resource`, error };
        }

        // Count total documents in the database model
        const totalCount = await Database.find().countDocuments();

        // Push data for each resource type
        data.push({
          name: key,
          label: resource[key],
          active: totalCount,
        });
      }
    }

    // Return response based on whether data array has elements
    if (data.length > 0) {
      return { status: true, msg: "Fetched successfully", data };
    } else {
      return { status: false, msg: "No resources found" };
    }
  }

  async DCData(id) {
    try {
      // Find data collector (DC) by id
      const dc = await DCRepository.findOne({ id });

      // If DC is not found, return error message
      if (!dc) {
        return { status: false, msg: "DC not found" };
      }

      // Remove sensitive fields from DC document
      let data = removeFieldsFromObject({ ...dc._doc }, [], false);
      let projects = [];
      let seasonIds = [];

      // If DC is associated with projects, fetch project details
      if (!!dc.projects.length) {
        for (const proj of dc.projects) {
          // Find project data by project id
          const projectsData = await ProjectRepository.findOne({
            id: proj.projectId,
          });

          if (projectsData) {
            // Remove sensitive fields from project document
            let project = removeFieldsFromObject(
              { ...projectsData._doc, farmers: [] },
              [],
              false
            );
            const crops = [];
            const regions = [];

            // Process each region in the project
            for (const region of project.regions) {
              // Map block IDs within the region
              const blockIds = region.blocks.map((block) => block.blockId);

              // Find villages associated with block IDs
              const getVillages = await VillageRepository.find({
                blockId: { $in: blockIds },
              });

              // Modify village data and add to region
              region.villages = getVillages.map((v) => {
                return {
                  blockId: v.blockId,
                  villageName: v.name,
                  villageId: v.id,
                  status: v.status,
                };
              });

              // Add modified region to regions array
              regions.push(region);
            }

            // Update project's regions with modified data
            project.regions = regions;

            // Process each crop in the project
            for (const pc of project.crops) {
              const popInterventions = [];

              // Process each intervention associated with the crop
              for (const iv of pc.interventions) {
                // Find intervention details by intervention ID
                const intervention = await InterventionRepository.findOne({
                  id: iv.interventionId,
                });

                // If intervention exists, add to popInterventions array
                intervention ? popInterventions.push(intervention) : null;
              }

              // Add crop with interventions to crops array
              crops.push({ ...pc._doc, interventions: popInterventions });
            }

            // Update project's crops with modified data
            project.crops = crops;

            // Fetch farmers associated with the project and DC
            const farmersData = await FarmerRepository.find({
              projectId: proj.projectId,
              dcId: id,
            });

            // Process each farmer
            for (const f of farmersData) {
              // Remove sensitive fields from farmer document
              let farmer = removeFieldsFromObject(
                { ...f._doc, plots: [] },
                [],
                false
              );
              const plots = await PlotRepository.find({ farmerId: f.id });

              // Process each plot associated with the farmer
              for (const p of plots) {
                // Remove sensitive fields from plot document
                let plot = removeFieldsFromObject(
                  { ...p._doc, soilInformations: [], seasons: [] },
                  [],
                  false
                );

                // Fetch soil information associated with the plot
                const soilInformations = await SoilInformationRepository.find({
                  plotId: p.id,
                });

                // Fetch seasons associated with the plot
                const seasons = await SeasonRepository.find({ plotId: p.id });

                // Process each soil information
                for (const l of soilInformations) {
                  plot.soilInformations.push(
                    removeFieldsFromObject({ ...l._doc }, [], false)
                  );
                }

                // Process each season
                for (const s of seasons) {
                  // Add season ID to seasonIds array
                  seasonIds.push(s.id);

                  // Find intervention details by intervention ID
                  const intervention = await InterventionRepository.findOne({
                    id: s.interventionId,
                  });

                  // Process each POP (Proof of Practice) associated with intervention
                  const popPromises = intervention.pop.map(async (pop) => {
                    let Database;
                    try {
                      // Load database model for POP
                      Database = require(`../database/models/${pop.popName}`);
                      // Find POP document by season ID
                      const find = await Database.findOne({ seasonId: s.id });

                      // Return status message based on POP submission
                      if (find) {
                        return {
                          status: true,
                          name: pop.popName,
                          msg: `${pop.popName} is submitted`,
                        };
                      }
                      return {
                        status: false,
                        name: pop.popName,
                        msg: `${pop.popName} is not submitted`,
                      };
                    } catch (error) {
                      console.log(error);
                    }
                  });

                  // Add season details to plot's seasons array
                  plot.seasons.push({
                    ...removeFieldsFromObject(s._doc, [], false),
                    seasonId: s.id,
                    farmerName: f.farmerName,
                    farmerCode: f.farmerCode,
                    interventionDetails: intervention ? intervention : [],
                    popStatus: await Promise.all(popPromises),
                  });
                }

                // Add plot to farmer's plots array
                farmer.plots.push(plot);
              }

              // Add farmer to project's farmers array
              project.farmers.push(farmer);
            }

            // Add project to projects array
            projects.push(project);
          }
        }

        // Update data object with projects information
        data.projects = projects;
      }

      // Return successful response with fetched data and season IDs
      return { status: true, msg: "Fetched successfully", data, seasonIds };
    } catch (error) {
      // Return error response if an error occurs
      return { status: false, msg: "An error occurred", error };
    }
  }

  async DCDataUpdate(id) {
    try {
      // Find data collector (DC) by id
      const dc = await DCRepository.findOne({ id }).lean(); // Use .lean() to avoid Mongoose metadata

      // If DC is not found, return error message
      if (!dc) {
        return { status: false, msg: "DC not found" };
      }

      // Remove sensitive fields from DC document
      let data = removeFieldsFromObject(dc, [], false);
      let projects = [];
      let seasonIds = [];

      // If DC is associated with projects, fetch project details
      if (dc.projects.length > 0) {
        const projectIds = dc.projects.map((proj) => proj.projectId);

        // Fetch all projects in one call
        const projectsData = await ProjectRepository.find({
          id: { $in: projectIds },
        }).lean(); // Use .lean() to return plain JavaScript objects

        if (projectsData.length > 0) {
          // Collect all relevant IDs for villages, interventions, farmers, and plots in parallel
          let blockIds = [];
          let cropInterventionIds = [];
          let farmerIds = [];
          let plotIds = [];

          for (const project of projectsData) {
            for (const region of project.regions || []) {
              blockIds.push(
                ...(region.blocks || []).map((block) => block.blockId)
              );
            }
            for (const crop of project.crops || []) {
              cropInterventionIds.push(
                ...(crop.interventions || []).map((iv) => iv.interventionId)
              );
            }
          }

          // Fetch villages, interventions, and farmers in parallel
          const [villages, interventions, farmersData] = await Promise.all([
            VillageRepository.find({ blockId: { $in: blockIds } }).lean(), // .lean() for plain objects
            InterventionRepository.find({
              id: { $in: cropInterventionIds },
            }).lean(), // .lean() for plain objects
            FarmerRepository.find({
              projectId: { $in: projectIds },
              dcId: id,
            }).lean(), // .lean() for plain objects
          ]);

          const villageMap = {};
          villages.forEach((village) => {
            villageMap[village.blockId] = villageMap[village.blockId] || [];
            villageMap[village.blockId].push({
              blockId: village.blockId,
              villageName: village.name,
              villageId: village.id,
              status: village.status,
            });
          });

          const interventionMap = {};
          interventions.forEach((intervention) => {
            interventionMap[intervention.id] = intervention;
          });

          farmersData.forEach((farmer) => {
            farmerIds.push(farmer.id);
          });

          // Fetch all plots in one go
          const plots = await PlotRepository.find({
            farmerId: { $in: farmerIds },
          }).lean(); // .lean() for plain objects
          plots.forEach((plot) => {
            plotIds.push(plot.id);
          });

          // Fetch soil information and seasons in parallel
          const [soilInformations, seasons] = await Promise.all([
            SoilInformationRepository.find({ plotId: { $in: plotIds } }).lean(), // .lean() for plain objects
            SeasonRepository.find({ plotId: { $in: plotIds } }).lean(), // .lean() for plain objects
          ]);

          const soilInfoMap = {};
          soilInformations.forEach((soilInfo) => {
            soilInfoMap[soilInfo.plotId] = soilInfoMap[soilInfo.plotId] || [];
            soilInfoMap[soilInfo.plotId].push(soilInfo);
          });

          const seasonMap = {};
          const seasonInterventionIds = [];
          seasons.forEach((season) => {
            seasonMap[season.plotId] = seasonMap[season.plotId] || [];
            seasonMap[season.plotId].push(season);
            seasonIds.push(season.id);
            seasonInterventionIds.push(season.interventionId);
          });

          // Fetch interventions related to the seasons
          const seasonInterventions = await InterventionRepository.find({
            id: { $in: seasonInterventionIds },
          }).lean(); // .lean() for plain objects
          const seasonInterventionMap = {};
          seasonInterventions.forEach((intervention) => {
            seasonInterventionMap[intervention.id] = intervention;
          });

          // Process the projects, farmers, plots, and interventions
          for (const project of projectsData) {
            const projectData = removeFieldsFromObject(
              { ...project, farmers: [] }, // No _doc, just plain objects
              [],
              false
            );

            // Process regions
            projectData.regions = (project.regions || []).map((region) => ({
              ...region,
              villages: (region.blocks || []).reduce((acc, block) => {
                return acc.concat(villageMap[block.blockId] || []);
              }, []), // Ensure that the villages array is populated
            }));

            // Process crops and interventions
            projectData.crops = (project.crops || []).map((crop) => ({
              ...crop,
              interventions: (crop.interventions || []).map(
                (iv) => interventionMap[iv.interventionId]
              ),
            }));

            // Process farmers and plots
            // Process farmers and plots
            // Process farmers and plots
            projectData.farmers = farmersData
              .filter((farmer) => farmer.projectId === project.id)
              .map((farmer) => {
                const farmerData = removeFieldsFromObject(farmer, [], false); // No _doc, just plain objects
                farmerData.plots = (
                  plots.filter((plot) => plot.farmerId === farmer.id) || []
                ).map((plot) => {
                  const plotData = removeFieldsFromObject(plot, [], false);
                  plotData.soilInformations = soilInfoMap[plot.id] || [];

                  // Add full farmer details to each season within plotData.seasons
                  plotData.seasons =
                    seasonMap[plot.id]?.map((season) => ({
                      ...season,
                      ...farmer, // Spread the entire farmer object here
                      interventionDetails:
                        seasonInterventionMap[season.interventionId] || {},
                      popStatus: seasonInterventionMap[season.interventionId]
                        ? seasonInterventionMap[season.interventionId].pop.map(
                            (pop) => {
                              return {
                                status: true,
                                name: pop.popName,
                                msg: `${pop.popName} is submitted`,
                              };
                            }
                          )
                        : [],
                    })) || [];

                  return plotData;
                });
                return farmerData;
              });

            projects.push(projectData);
          }

          // Update data object with projects information
          data.projects = projects;
        }
      }

      // Return successful response with fetched data and season IDs
      return { status: true, msg: "Fetched successfully", data, seasonIds };
    } catch (error) {
      // Return error response if an error occurs
      return { status: false, msg: "An error occurred", error };
    }
  }
  // async POPData(seasonIds, manditaryData = false) {
  //   // Initialize an empty array to store data
  //   let data = [];

  //   // Iterate through each season ID in seasonIds array
  //   for (const id of seasonIds) {
  //     // Initialize an empty object for storing results related to each season ID
  //     let result = {};

  //     // Iterate through each key in POP_RESOURCES_DATA object
  //     for (const key of Object.keys(POP_RESOURCES_DATA)) {
  //       let Database;
  //       try {
  //         // Attempt to load the database model for current key
  //         Database = require(`../database/models/${key}`);
  //       } catch (error) {
  //         // Return error response if loading database model fails
  //         return { status: false, msg: `Error loading ${key} resource`, error };
  //       }

  //       // Find document in database model based on seasonId
  //       const res = await Database.findOne({ seasonId: id });

  //       // If mandatory data is specified and document is found
  //       if (res && manditaryData) {
  //         // Merge manditaryData with fields removed from res._doc
  //         result[key] = {
  //           ...manditaryData,
  //           ...removeFieldsFromObject(res._doc, [
  //             "id",
  //             "seasonId",
  //             "plotId",
  //             "farmerId",
  //           ]),
  //         };
  //       } else {
  //         // If mandatory data is not specified or document is not found, add result with removed fields
  //         res
  //           ? (result[key] = removeFieldsFromObject({ ...res._doc }, [], false))
  //           : null;
  //       }
  //     }

  //     // Push result object for current season ID to data array
  //     data.push(result);
  //   }

  //   // Return success or failure response based on whether data array has elements
  //   if (!!data) {
  //     return { status: true, msg: "Fetched successfully", data };
  //   } else {
  //     return { status: false, msg: "No resources found" };
  //   }
  // }
  async POPData(seasonIds, manditaryData = false) {
    // Check if seasonIds is valid
    if (!Array.isArray(seasonIds) || seasonIds.length === 0) {
      return { status: false, msg: "Invalid or empty seasonIds provided" };
    }

    try {
      const data = [];
      const allResults = {};

      // Batch fetch all resources for the provided seasonIds
      for (const key of Object.keys(POP_RESOURCES_DATA)) {
        try {
          const Database = require(`../database/models/${key}`);

          // Fetch all resources for the given seasonIds
          const resources = await Database.find({
            seasonId: { $in: seasonIds },
          });

          // Group results by seasonId
          resources.forEach((res) => {
            const seasonId = res.seasonId;
            if (!allResults[seasonId]) {
              allResults[seasonId] = {};
            }
            allResults[seasonId][key] = manditaryData
              ? {
                  ...manditaryData,
                  ...removeFieldsFromObject(res._doc, [
                    "id",
                    "seasonId",
                    "plotId",
                    "farmerId",
                  ]),
                }
              : removeFieldsFromObject(res._doc, [], false);
          });
        } catch (error) {
          return { status: false, msg: `Error loading ${key} resource`, error };
        }
      }

      // Format the final response for each seasonId
      seasonIds.forEach((seasonId) => {
        data.push(allResults[seasonId] || {});
      });

      // Return success or failure response based on whether data array has elements
      return data.length > 0
        ? { status: true, msg: "Fetched successfully", data }
        : { status: false, msg: "No resources found" };
    } catch (error) {
      return {
        status: false,
        msg: "An error occurred while fetching data",
        error,
      };
    }
  }
  //filter based on the state id district id block id village id
  async DCDataUpdateFilter(req) {
    try {
      const {
        stateId,
        districtId,
        blockId,
        villageId,
        cultivationYear,
        seasonName,
      } = req.body; // Expecting villageId to be an array
      const id = req.query.id ? req.query.id : req.user.id;

      // Find data collector (DC) by id
      const dc = await DCRepository.findOne({ id }).lean();

      // If DC is not found, return error message
      if (!dc) {
        return { status: false, msg: "DC not found" };
      }

      if (
        !stateId ||
        !districtId ||
        !blockId ||
        !villageId ||
        !Array.isArray(villageId) ||
        !cultivationYear ||
        !seasonName
      ) {
        return {
          status: false,
          msg: `Missing required parameters or villageId must be an array`,
        };
      }

      // Ensure village-based filtering is strictly applied
      const validVillages = await VillageRepository.find({
        id: { $in: villageId },
      }).lean();
      const validVillageIds = validVillages.map((village) => village.id);

      if (validVillageIds.length === 0) {
        return {
          status: false,
          msg: "No valid villages found for the provided villageId(s)",
        };
      }

      // Remove sensitive fields from DC document
      let data = removeFieldsFromObject(dc, [], false);
      let projects = [];
      let seasonIds = [];

      // If DC is associated with projects, fetch project details
      if (dc.projects.length > 0) {
        const projectIds = dc.projects.map((proj) => proj.projectId);

        // Fetch all projects in one call
        const projectsData = await ProjectRepository.find({
          id: { $in: projectIds },
        }).lean();

        if (projectsData.length > 0) {
          let blockIds = [];
          let cropInterventionIds = [];
          let farmerIds = [];
          let plotIds = [];

          for (const project of projectsData) {
            for (const region of project.regions || []) {
              blockIds.push(
                ...(region.blocks || []).map((block) => block.blockId)
              );
            }
            for (const crop of project.crops || []) {
              cropInterventionIds.push(
                ...(crop.interventions || []).map((iv) => iv.interventionId)
              );
            }
          }

          // Fetch villages, interventions, and farmers in parallel
          const [villages, interventions, farmersData] = await Promise.all([
            VillageRepository.find({
              blockId: { $in: blockIds },
              id: { $in: validVillageIds },
            }).lean(),
            InterventionRepository.find({
              id: { $in: cropInterventionIds },
            }).lean(),
            FarmerRepository.find({
              projectId: { $in: projectIds },
              dcId: id,
              villageId: { $in: validVillageIds },
            }).lean(),
          ]);

          const villageMap = {};
          villages.forEach((village) => {
            villageMap[village.blockId] = villageMap[village.blockId] || [];
            villageMap[village.blockId].push({
              blockId: village.blockId,
              villageName: village.name,
              villageId: village.id,
              status: village.status,
            });
          });

          const interventionMap = {};
          interventions.forEach((intervention) => {
            interventionMap[intervention.id] = intervention;
          });

          farmersData.forEach((farmer) => {
            farmerIds.push(farmer.id);
          });

          // Fetch all plots in one go
          const plots = await PlotRepository.find({
            farmerId: { $in: farmerIds },
          }).lean();
          plots.forEach((plot) => {
            plotIds.push(plot.id);
          });

          // Fetch soil information and seasons in parallel
          const [soilInformations, seasons] = await Promise.all([
            SoilInformationRepository.find({ plotId: { $in: plotIds } }).lean(),
            SeasonRepository.find({
              plotId: { $in: plotIds },
              cultivationYear: cultivationYear,
              seasonName: seasonName,
            }).lean(),
          ]);

          const soilInfoMap = {};
          soilInformations.forEach((soilInfo) => {
            soilInfoMap[soilInfo.plotId] = soilInfoMap[soilInfo.plotId] || [];
            soilInfoMap[soilInfo.plotId].push(soilInfo);
          });

          const seasonMap = {};
          const seasonInterventionIds = [];
          seasons.forEach((season) => {
            seasonMap[season.plotId] = seasonMap[season.plotId] || [];
            seasonMap[season.plotId].push(season);
            seasonIds.push(season.id);
            seasonInterventionIds.push(season.interventionId);
          });

          // Fetch interventions related to the seasons
          const seasonInterventions = await InterventionRepository.find({
            id: { $in: seasonInterventionIds },
          }).lean();
          const seasonInterventionMap = {};
          seasonInterventions.forEach((intervention) => {
            seasonInterventionMap[intervention.id] = intervention;
          });

          // Process the projects, farmers, plots, and interventions
          for (const project of projectsData) {
            const projectData = removeFieldsFromObject(
              { ...project, farmers: [] }, // No _doc, just plain objects
              [],
              false
            );

            // Process regions
            projectData.regions = (project.regions || []).map((region) => ({
              ...region,
              villages: (region.blocks || []).reduce((acc, block) => {
                return acc.concat(villageMap[block.blockId] || []);
              }, []), // Ensure that the villages array is populated
            }));

            // Process crops and interventions
            projectData.crops = (project.crops || []).map((crop) => ({
              ...crop,
              interventions: (crop.interventions || []).map(
                (iv) => interventionMap[iv.interventionId]
              ),
            }));

            // Process farmers and plots
            projectData.farmers = farmersData
              .filter((farmer) => farmer.projectId === project.id)
              .map((farmer) => {
                const farmerData = removeFieldsFromObject(farmer, [], false); // No _doc, just plain objects
                farmerData.aadhaarPhoto = farmer?.aadhaarPhoto?.url || "";
                farmerData.plots = (
                  plots.filter((plot) => plot.farmerId === farmer.id) || []
                ).map((plot) => {
                  const plotData = removeFieldsFromObject(plot, [], false);
                  plotData.soilInformations = soilInfoMap[plot.id] || [];

                  // Add full farmer details to each season within plotData.seasons
                  plotData.seasons =
                    seasonMap[plot.id]?.map((season) => ({
                      ...season,
                      ...farmer, // Spread the entire farmer object here
                      interventionDetails:
                        seasonInterventionMap[season.interventionId] || {},
                      popStatus: seasonInterventionMap[season.interventionId]
                        ? seasonInterventionMap[season.interventionId].pop.map(
                            (pop) => {
                              return {
                                status: true,
                                name: pop.popName,
                                msg: `${pop.popName} is submitted`,
                              };
                            }
                          )
                        : [],
                    })) || [];

                  return plotData;
                });
                return farmerData;
              });

            projects.push(projectData);
          }

          // Update data object with projects information
          data.projects = projects;
        }
      }

      // Return successful response with fetched data and season IDs
      return { status: true, msg: "Fetched successfully", data, seasonIds };
    } catch (error) {
      // Return error response if an error occurs
      console.error("Error fetching data: ", error);
      return { status: false, msg: "An error occurred", error };
    }
  }

  async UpdateOrCreatePops(req) {
    // Extract user details from request
    const { _id, fullName } = req.user;

    // Extract offlineData from request body
    const { offlineData } = req.body;

    // Check if offlineData exists
    if (!!offlineData) {
      // Iterate through each key in offlineData object
      for (const key of Object.keys(offlineData)) {
        let Database;
        try {
          // Load database model for current key
          Database = require(`../database/models/${key}`);

          // Iterate through each entry (inputs) in offlineData[key] array
          for (const inputs of offlineData[key]) {
            // Check if inputs contain an id field to determine if data exists
            const exist = inputs.id
              ? await Database.findOne({ id: inputs.id })
              : null;

            // If data exists (update operation)
            if (exist) {
              // Update metadata fields
              inputs.updatedByName = fullName;
              inputs.updatedById = _id;

              // Update document in database and retrieve updated data
              const data = await Database.findOneAndUpdate(
                { id: exist.id },
                { $set: inputs },
                { new: true, useFindAndModify: false }
              );

              // Handle successful update
              if (data) {
                // Handle operations associated with data
                if (data.operations && data.operations.length > 0) {
                  for (const operation of data.operations) {
                    // Call operationDate function to update operation details
                    const { status, msg } = await operationDate(
                      {
                        id: operation.objectId,
                        dateOfOperation:
                          operation.operationItems.dateOfOperation ||
                          operation.operationItems.dateOfApplication,
                        updatedAt: data.updatedAt,
                        seasonId: data.seasonId,
                      },
                      POP_RESOURCES_DATA[key] + ` (${operation.operationName})`
                    );

                    // Return error if operationDate fails
                    if (!status) {
                      return {
                        status: true,
                        msg:
                          "Failed to Note operation date. please update the data with same values",
                        errorMsg: msg,
                        data,
                      };
                    }
                  }
                } else {
                  // Call operationDate function for data without operations
                  const { status, msg } = await operationDate(
                    data,
                    POP_RESOURCES_DATA[key]
                  );

                  // Return error if operationDate fails
                  if (!status) {
                    return {
                      status: true,
                      msg:
                        "Failed to Note operation date. please update the data with same values",
                      errorMsg: msg,
                      data,
                    };
                  }
                }
              } else {
                // Return error if update fails
                return { status: false, msg: "Failed to update" };
              }
            } else {
              // Check if seasonId exists to determine if season data exists
              const ifSeasonExist = inputs.seasonId
                ? await Database.find({ seasonId: inputs.seasonId })
                : null;

              // If season data exists (update operation)
              if (ifSeasonExist && ifSeasonExist.length) {
                // Update metadata fields
                inputs.updatedByName = fullName;
                inputs.updatedById = _id;

                // Update document in database and retrieve updated data
                const data = await Database.findOneAndUpdate(
                  { seasonId: inputs.seasonId },
                  { $set: inputs },
                  { new: true, useFindAndModify: false }
                );

                // Handle successful update
                if (data) {
                  // Handle operations associated with data
                  if (data.operations && data.operations.length > 0) {
                    for (const operation of data.operations) {
                      // Call operationDate function to update operation details
                      const { status, msg } = await operationDate(
                        {
                          id: operation.objectId,
                          dateOfOperation:
                            operation.operationItems.dateOfOperation ||
                            operation.operationItems.dateOfApplication,
                          updatedAt: data.updatedAt,
                          seasonId: data.seasonId,
                        },
                        POP_RESOURCES_DATA[key] +
                          ` (${operation.operationName})`
                      );

                      // Return error if operationDate fails
                      if (!status) {
                        return {
                          status: true,
                          msg:
                            "Failed to Note operation date. please update the data with same values",
                          errorMsg: msg,
                          data,
                        };
                      }
                    }
                  } else {
                    // Call operationDate function for data without operations
                    const { status, msg } = await operationDate(
                      data,
                      POP_RESOURCES_DATA[key]
                    );

                    // Return error if operationDate fails
                    if (!status) {
                      return {
                        status: true,
                        msg:
                          "Failed to Note operation date. please update the data with same values",
                        errorMsg: msg,
                        data,
                      };
                    }
                  }
                } else {
                  // Return error if update fails
                  return { status: false, msg: "Failed to update" };
                }
              } else {
                // Data doesn't exist (create operation)

                // Update metadata fields
                inputs.addedByName = fullName;
                inputs.addedById = _id;

                // Create new document in database
                const data = await Database.create(inputs);

                // Handle successful creation
                if (data) {
                  // Handle operations associated with data
                  if (data.operations && data.operations.length > 0) {
                    for (const operation of data.operations) {
                      // Call operationDate function to update operation details
                      const { status, msg } = await operationDate(
                        {
                          id: operation.objectId,
                          dateOfOperation:
                            operation.operationItems.dateOfOperation ||
                            operation.operationItems.dateOfApplication,
                          updatedAt: data.updatedAt,
                          seasonId: data.seasonId,
                        },
                        POP_RESOURCES_DATA[key] +
                          ` (${operation.operationName})`
                      );

                      // Return error if operationDate fails
                      if (!status) {
                        return {
                          status: true,
                          msg:
                            "Failed to Note operation date. please update the data with same values",
                          errorMsg: msg,
                          data,
                        };
                      }
                    }
                  } else {
                    // Call operationDate function for data without operations
                    const { status, msg } = await operationDate(
                      data,
                      POP_RESOURCES_DATA[key]
                    );

                    // Return error if operationDate fails
                    if (!status) {
                      return {
                        status: true,
                        msg:
                          "Failed to Note operation date. please update the data with same values",
                        errorMsg: msg,
                        data,
                      };
                    }
                  }
                } else {
                  // Return error if creation fails
                  return { status: false, msg: "Failed to add" };
                }
              }
            }
          }
        } catch (error) {
          // Return error if loading database model fails
          return { status: false, msg: `Error loading ${key} resource`, error };
        }
      }
      // Return success message if all operations are successful
      return { status: true, msg: "Data Synced" };
    } else {
      // Return error if offlineData is empty
      return { status: false, msg: "Got empty data" };
    }
  }
// old one
 async FarmersReportWithPOPs(query, body) {
    try {
      const {
        start,
        end,
        projectIds,
        // cropId,
        // cropTypeId,
        cultivationYear,
        seasonName,
      } = body;
      const { clientId } = query;
      let params = { ...query };

      // Adjust query parameters based on date range if provided
      if (start && end) {
        params.createdAt = {
          $gte: new Date(`${start}T00:00:00.000Z`),
          $lte: new Date(`${end}T23:59:59.999Z`),
        };
      }
      // Add projectIds filter if provided
      if (projectIds && projectIds.length > 0) {
        params.projectId = { $in: projectIds };
      }

      // Initialize arrays to store fetched data
      const dataCollections = {
        
        registration: [],
        farmers: [],
        plotDetails: [],
        soliInformations: [],
        farmOperations: [],
        seedDetails: [],
        sowing: [],
        fertilizerApplications: [],
        pumpDetails: [],
        irrigation: [],
        weeding: [],
        ammendments:[],
        irrigationFieldObservation: [],
        cropProtection: [],
        cropAttributes: [],
        harvesting: [],
        threshing: [],
        drying: [],
        storage: [],
        seasons: [],
        transplanting: [],
        finalSubmission: [],
      };
      let projectNames = [];
      let projectsData = await ProjectRepository.find({
        id: { $in: projectIds },
      });
      for (const project of projectsData) {
        projectNames.push(project.name);
      }
      // Function to process and push data to respective collections
      const pushData = (collection, data) => {
        dataCollections[collection].push(data);
      };

      // Helper function to fetch and format data for a farmer
      const fetchFarmerData = async (farmer, commonFields) => {
        let cultivationData;
        const plotDetails = await PlotRepository.find({ farmerId: farmer.id });
        for (const plot of plotDetails) {
          const soilInformationData = await SoilInformationRepository.find({
            plotId: plot.id,
          });
          for (const soilInfo of soilInformationData) {
            const seasonsData = await SeasonRepository.find({
              plotId: plot.id,
              // cropTypeId: cropTypeId,
              // cropId: cropId,
              seasonName: seasonName,
              cultivationYear: cultivationYear,
            });
            for (const season of seasonsData) {
              cultivationData = await this.CultivationReportCost(season.id);

              commonFields = {
                ...commonFields,
                "Plot code": plot.plotCode,
                "Data type (Baseline/Dynamic)":
                  season?.seasonType == 0 ? "Baseline" : "Dynamic",
                "Area Under Project": parseFloat(
                  plot.totalAreaUnderProjectInAcres
                ),
                "Cultivation Year": season?.cultivationYear,
                "Crop season": season?.seasonName,
                "crop type": season.cropTypeName,
                "Crop name": season.cropName,
                Intervention: season.interventionName,
              };
              const popsData = await this.POPData([season.id], commonFields);
              processPopData(popsData, commonFields);
            }
            pushData(
              "soliInformations",
              formatSoilInformation(soilInfo, commonFields)
            );

            pushData(
              "finalSubmission",
              formatFinalSubmission(cultivationData, commonFields)
            );
          }
          pushData("plotDetails", formatPlotDetails(plot, commonFields));
        }
        pushData("farmers", formatFarmer(farmer, commonFields));
        pushData("registration", formatRegistration(farmer, commonFields));
      };

      // Function to process and format POP data
      const processPopData = (popsData, commonFields) => {
        for (const pop of popsData.data) {
          const processingFunctions = {
            cropProtection: processCropProtection,
            farmOperations: processFarmOperations,
            fertilizerApplications: processFertilizerApplications,
            irrigation: processIrrigation,
            pumpdetails: processIrrigation,
            seedDetails: processSeedDetails,
            sowing: processSowing,
            ammendments: processAmmendments,
            weeding: processWeeding,
            cropAttributes: processCropAttributes,
            drying: processDrying,
            harvesting: processHarvesting,
            threshing: processThreshing,
            storage: processStorage,
            transplanting: processTransplanting,
            irrigationFieldObservation:processIrrigationFieldObservation
          };

          for (const [key, func] of Object.entries(processingFunctions)) {
            if (pop[key]) func(pop[key], commonFields);
          }
        }
      };

      // Individual processing functions for each data type
      const processCropProtection = (data, commonFields) => {
        for (const operation of data.operations) {
          for (const chemical of operation.operationItems.chemicals) {
            pushData(
              "cropProtection",
              formatOperationData(
                chemical,
                commonFields,
                operation,
                "Crop Protection"
              )
            );
          }
        }
      };

      const processFarmOperations = (data, commonFields) => {
        for (const operation of data.operations) {
          pushData(
            "farmOperations",
            formatOperationData(
              null,
              commonFields,
              operation,
              "Farm Operations"
            )
          );
        }
      };
      const processAmmendments = (data, commonFields) => {
        pushData("ammendments", formatAmmendments(data, commonFields));
      }
      const processFertilizerApplications = (data, commonFields) => {
        for (const operation of data.operations) {
          for (const fertilizer of operation.operationItems.fertilizer) {
            pushData(
              "fertilizerApplications",
              formatOperationData(
                fertilizer,
                commonFields,
                operation,
                "Fertilizer Applications"
              )
            );
          }
        }
      };

      const processIrrigation = (data, commonFields) => {
        for (const operation of data.operations) {
          const irrigationDetails = {
            ...commonFields,
            "Date of Operation": moment(
              operation.operationItems?.dateOfOperation
            ).format("DD-MM-YYYY"),
            "How Many Hours/Irrigation": Number(
              operation.operationItems?.howManyHoursForIrrigation
            ),
            "Unit Cost/Acre": operation.operationItems?.unitCostPerAcre || "", // Providing default value if not available
            "No. of Labour for Irrigation":
              operation.operationItems?.noOFLaboursForIrrigation || "", // Providing default value if not available
            "Upload date": moment(operation.createdAt).format("DD-MM-YYYY"),
            "Referance Image": operation?.operationItems?.referancePhoto?.url
              ? operation?.operationItems?.referancePhoto?.url
              : "",
            "Wages/Day (Male)": operation.operationItems?.wagesPerDayPerMale,
          "Wages/Day (Female)": operation.operationItems?.wagesPerDayPerFemale,
          "Domestic Male": operation.operationItems?.domesticMaleLabours,
          "Hired Male": operation.operationItems?.hiredMaleLabours,
          "Domestic Female": operation.operationItems?.domesticFemaleLabours,
          "Hired Female": operation.operationItems?.hiredFemaleLabours,
            "Place of Irrigation ": operation?.operationName || "",
          };
          let pumpDetails = {
            ...commonFields,
            "Number of Days Under Submerged Condition":
              data?.howManyDaysYouWillKeepLandUnderSubmergedCondition || "",
            "Is Controlled Irrigation Facility Available": data?.isControlledIrrigationFaclitiesAvalible
              ? "Yes"
              : "No",
            "Is Controlled Drainage Facility Available": data?.isControlledDrainageFaclitiesAvalible
              ? "Yes"
              : "No",
            "Duration of Flooding Pre-Plantation Days":data?.durationOfFloodingPrePlantationDays||"",
            "Pump Type": data?.pumpType || "",
            "Pump Company Name": data?.pumpCompanyName || "",
            "Pump HP": data?.pumpHP || "",
            "Source of Irrigation": data?.sourceOfIrrigation || "",
            "Diameter of Bore Outlet Pipe (Inch)":
              data?.diameterOfBoreOutletPipePumpInInches || "",
            "Depth of Borewell": data?.depthOfBorewell || "",
            "Upload date": moment(data.createdAt).format("DD-MM-YYYY"),
          };
          pushData("pumpDetails", pumpDetails);
          pushData("irrigation", irrigationDetails);
        }
      };
      
      const processSeedDetails = (data, commonFields) => {
        pushData("seedDetails", formatSeedDetails(data, commonFields));
      };
      const processTransplanting = (data, commonFields) => {
        pushData("transplanting", formatTransplanting(data, commonFields));
      }
      const processSowing = (data, commonFields) => {
        pushData("sowing", formatSowing(data, commonFields));
      };
      const processIrrigationFieldObservation = (data, commonFields) => {
        pushData("irrigationFieldObservation", formatIrrigationFieldObservation(data, commonFields));
      }
      const processWeeding = (data, commonFields) => {
        pushData("weeding", formatWeeding(data, commonFields));
      };

      const processCropAttributes = (data, commonFields) => {
        pushData("cropAttributes", formatCropAttributes(data, commonFields));
      };

      const processDrying = (data, commonFields) => {
        pushData("drying", formatDrying(data, commonFields));
      };

      const processHarvesting = (data, commonFields) => {
        pushData("harvesting", formatHarvesting(data, commonFields));
      };

      const processThreshing = (data, commonFields) => {
        pushData("threshing", formatThreshing(data, commonFields));
      };

      const processStorage = (data, commonFields) => {
        pushData("storage", formatStorage(data, commonFields));
      };

       // Formatting functions
    const formatIrrigationFieldObservation = (data, commonFields) => {
    const observations = data?.irrigation_field_observations || [];

    // defaults
    let wetDate = "";
    let dryDate = "";
    let wetImage = "";
    let dryImage = "";
    let waterLoggedImage = "";
    let waterDepth = "";

    observations.forEach((obs) => {
      switch (obs.observation_type) {
        case "Wet":
          wetDate = obs?.date
            ? moment(obs.date).format("DD-MM-YYYY")
            : "";
          wetImage = obs?.photograph?.url || "";
          break;

        case "Dry":
          dryDate = obs?.date
            ? moment(obs.date).format("DD-MM-YYYY")
            : "";
          dryImage = obs?.photograph?.url || "";
          break;

        case "Water logged":
          waterLoggedImage = obs?.photograph?.url || "";
          waterDepth = obs?.water_depth_cm ?? "";
          break;

        default:
          break;
      }
    });

    return {
      ...commonFields,

      "Wet - Date of Operation": wetDate,
      "Wet - Image": wetImage,
      "Dry - Date of Operation": dryDate,
      "Dry - Image": dryImage,

      "Water Logged Image": waterLoggedImage,
      "Water Depth in Plot (in cm)": waterDepth,

      "Upload date": moment(data.createdAt).format("DD-MM-YYYY"),
    };
};
const formatAmmendments = (data, commonFields) => {
  const amendmentFields = {};

  // Always include this
  amendmentFields["Used Amendments"] =
    data.haveYouUsedAmendments ? "Yes" : "No";

  // If amendments not used, return early

  data?.amendments_last_3yrs
    ?.sort((a, b) => a.year - b.year)
    ?.forEach((yearEntry) => {
      const year = yearEntry.year;

      yearEntry?.inputs?.forEach((input) => {
        const inputName = input.input_type
          .replace(/\//g, " ")
          .toUpperCase();

        const key = `Year ${year} - ${inputName} (Qty)`;
        amendmentFields[key] = input.quantity ?? "";
      });
    });

  return {
    ...commonFields,
    ...amendmentFields,
    "Upload date": moment(data.createdAt).format("DD-MM-YYYY"),
  };
};


     
      const formatOperationData = (item, commonFields, operation, type) => {
        return {
          ...commonFields,
          "Operation Type": type,
          "Operation Name": operation.operationName,
          "Date of Operation": moment(
            operation.operationItems?.dateOfOperation
          ).format("DD-MM-YYYY"),
          "Problem Type": operation.operationItems?.problemType,
          "Problem Name": operation.operationItems?.problemName,
          "Chemical/Fertilizer Name":
            item?.chemicalName || item?.nameOfTheFertilizer,
          Cost: item?.costOfChemical || item?.costOfTheFertilizer,
          "Quantity/Acre": item?.quantityPerAcre,
          Unit: item?.unit,
          "Tank Capacity": operation?.operationItems?.tankCapacity || "",
          Contractual: operation.operationItems?.contractual,
          "Cost/Acre": operation.operationItems?.costPerAcre,
          "Machine Type": operation.operationItems?.machineType,
          "Machine Applicapble": operation.operationItems?.isMachineHired,
          "Brand of Machine": operation.operationItems?.brandOfMachine|| "",
          "Machine Status":
            operation.operationItems?.isMachineHired == true
              ? "Hired"
              : "Owned",
          "Machine Cost/Acre": operation.operationItems?.machineRentPerAcre,
          "Wages/Day (Male)": operation.operationItems?.wagesPerDayPerMale,
          "Wages/Day (Female)": operation.operationItems?.wagesPerDayPerFemale,
          "Domestic Male": operation.operationItems?.domesticMaleLabours,
          "Hired Male": operation.operationItems?.hiredMaleLabours,
          "Domestic Female": operation.operationItems?.domesticFemaleLabours,
          "Hired Female": operation.operationItems?.hiredFemaleLabours,
          Images: operation.operationItems?.referancePhoto?.url
            ? operation.operationItems?.referancePhoto?.url
            : "",
          "Upload date": moment(operation.createdAt).format("DD-MM-YYYY"),
        };
      };

      const formatSoilInformation = (soilInfo, commonFields) => {
        return {
          ...commonFields,
          "Soil Test": soilInfo.isSoilTest,
          "Soil Texture": soilInfo.soilTexture,
          "pH Level": soilInfo.phLevel,
          "Bulk Density": soilInfo.bulkDensity,
          "Organic Carbon": soilInfo.oraganicCorbon,
          "Total N": soilInfo.totalN,
          "Available-P": soilInfo.availableP,
          "Available-K": soilInfo.availableK,
          "Available-Zn": soilInfo.availableZn,
          "Available-Mg": soilInfo.availableMg,
          "Available-S": soilInfo.availableS,
          "Available-Fe": soilInfo.availableFe,
          "Available-CU": soilInfo.availableCU,
          "Available-Mn": soilInfo.availableMn,
          "Available-Ca": soilInfo.availableCa,
          "Available-B": soilInfo.availableB,
          "Upload date": moment(soilInfo.createdAt).format("DD-MM-YYYY"),
        };
      };
      const formatFinalSubmission = (costData, commonFields) => {
        return {
          ...commonFields,
          totalCost: costData?.data?.reduce((acc, item) => acc + item.cost, 0),
          ...costData?.data?.reduce((acc, item) => {
            acc[convertToCamelCase(item.popName)] = item.cost;
            return acc;
          }, {}),
        };
      };


      const formatPlotDetails = (plot, commonFields) => {
        return {
          ...commonFields,
          // "Plot Code": plot.plotCode,
          "Landmark/Address": plot.landmarkOrAddress,
          Latitude: plot.latitude,
          Longitude: plot.longitude,
          "Plot Boundaries": plot.plotBoundries && plot.plotBoundries.length > 0 
            ? plot.plotBoundries.map(boundary => `Lat: ${boundary.latitude}, Lng: ${boundary.longitude}`).join('; ')
            : '',
          "Total Land Owned (Acres)": parseFloat(plot.totalLandOwnedInAcres),
          "Leased Land": parseFloat(plot.leasedLand),
          "Total Leased Land (Acres)": parseFloat(plot.totalLeasedLandInAcres),
          "Leased Land Cost/Plot/Year (Rs.)": plot.leasedLandCostPerAcreForYear,
          "Leased Land Period (Months)": plot.leasedLandPeriod,
          "Upload date": moment(plot.createdAt).format("DD-MM-YYYY"),
          // "Area Under Project": parseFloat(plot.totalAreaUnderProjectInAcres),
        };
      };

      const formatFarmer = (farmer, commonFields) => {
        return {
          ...commonFields,
          "Mobile Number": farmer.farmerMobile,
          "Postal Code": farmer.villageCode,
          Gender: farmer.gender,
          Age: farmer.age,
          "Education (Years)": farmer.educationInYears,
          "Marital Status": farmer.maritalStatus,
          "Family Size": farmer.familySize,
          "Farm experience (in years)": farmer.farmExperience,
          "Membership in Farmers’ Organization":
            farmer.membershipInFamilysOriganization == true ? "YES" : "NO",
          "Distance to Main Road": farmer.distanceToTheMainRoad,
          "Distance to Main Market": farmer.distanceToTheMainMarketYard,
          "Kisan Credit Card (KCC)":
            farmer.havingKisanCreditCard == true ? "YES" : "NO",
          "Opted for Institutional Crop Loan":
            farmer.optedForInstitutionalCropLoanInThisCroppingSeason == true
              ? "YES"
              : "NO",
          "Opted for Crop Insurance":
            farmer.optedForCropInsurance == true ? "YES" : "NO",
          "Assured Irrigation":
            farmer.havingAssuredIrrigation == true ? "YES" : "NO",
          Livestock: farmer.havingLiveStock == true ? "YES" : "NO",
          "Off-Farm Income": farmer.addOffFarmIncome == true ? "YES" : "NO",
          "Job Card Under MGNREGA":
            farmer.havingAJobCardUnderMGNREGA == true ? "YES" : "NO",
          Television: farmer.havingTelevision == true ? "YES" : "NO",
          Smartphone: farmer.havingSmartPhone == true ? "YES" : "NO",
          "Bank Account": farmer.havingBankAccount == true ? "YES" : "NO",
          "Bank Name": farmer.bankName,
          "Branch Name": farmer.branchName,
          "IFSC Code": farmer.ifscCode,
          "Account Number": farmer.accountNumber,
          "Upload date": moment(farmer.createdAt).format("DD-MM-YYYY"),
          "Aadhaar Number": farmer.aadhaarNumber,
          "Aadhaar Photo": farmer.aadhaarPhoto?.url,
        };
      };

      const formatRegistration = (farmer, commonFields) => {
        return {
          ...commonFields,
          "Date of Registration": moment(farmer.dateOfRegistration).format(
            "DD-MM-YYYY"
          ),
          "Farmer Category": farmer.farmerCategory,
          "Mobile Number": farmer.farmerMobile,
          "Upload date": moment(farmer.createdAt).format("DD-MM-YYYY"),
        };
      };

      const formatSeedDetails = (seedDetails, commonFields) => {
        return {
          ...commonFields,
          "Seed Variety": seedDetails.seedVariety,
          "Seed Quantity (Kg/Acre)": seedDetails.seedQuantityPerAcre,
          "Amount Incurred for Seed (Rs/Kg)":
            seedDetails.amountAcurredForSeedInKG,
          "Seed Treatment": seedDetails.seedTreatment,
          "Type of Seed Treatment": seedDetails.typeOfSeedTreatment,
          "Name of Seed Treatment":
            seedDetails.nameOfTheChemicalOrBioagentUsedForSeedTreatment,
          "Upload date": moment(seedDetails.createdAt).format("DD-MM-YYYY"),
          "Refernce Image": seedDetails?.referncePhoto?.url
            ? seedDetails?.referncePhoto?.url
            : "",
        };
      };

      const formatSowing = (sowing, commonFields) => {
        return {
          ...commonFields,
          "Date of Operation": moment(sowing.dateOfOperation).format(
            "DD-MM-YYYY"
          ),
          "Method of Sowing": sowing.methodOfSowing,
          Contractual: sowing.contractual,
          "Cost/Acre": sowing.costPerAcre,
          "Brand of Machine": sowing.brandOfMachine,
          "Machine Type": sowing.machineType,
          "Is Machine": sowing.isMachine,
          "Machine Applicapble": sowing.isMachineHired,
          "Machine Status": sowing.isMachineHired ? "Hired" : "Owned",
          "Machine Cost/Acre": sowing.machineCostPerAcre,
          "Wages/Day (Male)": sowing.wagesPerDayPerMale,
          "Wages/Day (Female)": sowing.wagesPerDayPerFemale,
          "Domestic Males": sowing.domesticMaleLabours,
          "Hired Males": sowing.hiredMaleLabours,
          "Domestic Females": sowing.domesticFemaleLabours,
          "Hired Females": sowing.hiredFemaleLabours,
          "Upload date": moment(sowing.createdAt).format("DD-MM-YYYY"),
          "Refernce Image": sowing?.referancePhoto?.url
            ? sowing?.referancePhoto?.url
            : "",
          "Plot Document Image": sowing?.plotDocumentPhoto?.url
            ? sowing?.plotDocumentPhoto?.url
            : "",
          "Plot Live Photo": sowing?.plotLivePhoto?.url
            ? sowing?.plotLivePhoto?.url
            : "",
        };
      };

      const formatWeeding = (weeding, commonFields) => {
        return {
          ...commonFields,
          "Date of Operation": moment(weeding.dateOfOperation).format(
            "DD-MM-YYYY"
          ),
          Contractual: weeding.contractual,
          "Cost/Acre": weeding.costPerAcre,
          "Brand of Machine": weeding.brandOfMachine,
          "Machine Applicapble": weeding.isMachineHired,
          "Machine Status": weeding.isMachineHired ? "Hired" : "Owned",
          "Machine Type": weeding.machineType,
          "Machine Cost/Acre": weeding.machineRentPerAcre,
          "Wages/Day (Male)": weeding.wagesPerDayPerMale,
          "Wages/Day (Female)": weeding.wagesPerDayPerFemale,
          "Domestic Males": weeding.domesticMaleLabours,
          "Hired Males": weeding.hiredMaleLabours,
          "Domestic Females": weeding.domesticFemaleLabours,
          "Hired Females": weeding.hiredFemaleLabours,
          "Upload date": moment(weeding.createdAt).format("DD-MM-YYYY"),
          "Refernce Image": weeding?.referncePhoto?.url
            ? weeding?.referncePhoto?.url
            : " ",
        };
      };

      const formatCropAttributes = (cropAttributes, commonFields) => {
        return {
          ...commonFields,
          "Sowing Depth (Cms)": cropAttributes.sowingDepthInCms,
          "Crop Density (Row-Row) (Cms)":
            cropAttributes.cropDensityRowToRowInCms,
          "Crop Density (Plant-Plant) (Cms)":
            cropAttributes.cropDensityPlantToPlantInCms,
          "Plant Height - 30 Days (Cms)":
            cropAttributes.plantHeightAfter30DaysInCms,
          "Plant Height - 60 Days (Cms)":
            cropAttributes.plantHeightAfter60DaysInCms,
          "Plant Height - 90 Days (Cms)":
            cropAttributes.plantHeightAfter90DaysInCms,
          "50% Flowering/Anthesis Date":
            cropAttributes.daysTo50PercentFlowering,
          "Number of Tillers/Hill": cropAttributes.numberOfTillersOrHill,
          "Number of Panicles/Hill": cropAttributes.numberOfPaniclesOrHill,
          "Number of Filled Grains/Panicle":
            cropAttributes.numberOfFilledGrainsPerPanicle,
          "Above Ground Biomass (3 Sqm Area) (Kg)": parseFloat(
            cropAttributes.aboveGroundBioMass3SquareMeterPerArea
          ),
          "Grain Yield (3 Sqm Area) (Kg)": parseFloat(
            cropAttributes.grainYieldIn3SqmPerArea
          ),
          "Yield/Acre (Quintals)": parseFloat(
            cropAttributes.yieldPerAcreInQuintals
          ),

          "Upload date": moment(cropAttributes.createdAt).format("DD-MM-YYYY"),
          "Plant Height After 30 Days (Cms) Image": cropAttributes
            ?.plantHeightAfter30DaysInCmsPhoto?.url
            ? cropAttributes?.plantHeightAfter30DaysInCmsPhoto?.url
            : "",

          "Plant Height After 60 Days (Cms) Image": cropAttributes
            ?.plantHeightAfter60DaysInCmsPhoto?.url
            ? cropAttributes?.plantHeightAfter60DaysInCmsPhoto.url
            : "",

          "Plant Height After 90 Days (Cms) Image": cropAttributes
            ?.plantHeightAfter90DaysInCmsPhoto?.url
            ? cropAttributes.plantHeightAfter90DaysInCmsPhoto.url
            : "",
          "Flowering/Anthesis date (>50%)":
            cropAttributes.floweringOrAnthesisDateGreaterThen50Field,

          "50% Flowering/Anthesis Date Image": cropAttributes
            ?.floweringOrAnthesisDateGreaterThen50FieldPhoto?.url
            ? cropAttributes?.floweringOrAnthesisDateGreaterThen50FieldPhoto
                ?.url
            : "",
        };
      };

      const formatDrying = (drying, commonFields) => {
        return {
          ...commonFields,
          "Is Drying Done": drying.isDrying,
          "Date of Operation": moment(drying.dateOfOperation).format(
            "DD-MM-YYYY"
          ),
          Contractual: drying.contractual,
          "Cost/Acre": drying.costPerAcre,
          "Brand of Machine": drying.brandOfMachine,
          "Machine Type": drying.machineType,
          "Machine Applicapble": drying.isMachineHired,
          "Machine Status": drying.isMachineHired ? "Hired" : "Owned",
          "Machine Cost/Acre": drying.machineRentPerAcre,
          "Wages/Day (Male)": drying.wagesPerDayPerMale,
          "Wages/Day (Female)": drying.wagesPerDayPerFemale,
          "Domestic Males": drying.domesticMaleLabours,
          "Hired Males": drying.hiredMaleLabours,
          "Domestic Females": drying.domesticFemaleLabours,
          "Hired Females": drying.hiredFemaleLabours,
          "Upload date": moment(drying.createdAt).format("DD-MM-YYYY"),
          "Reference Image": drying?.referancePhoto?.url
            ? drying?.referancePhoto?.url
            : "",
        };
      };
      const formatTransplanting = (transplanting, commonFields) => {
        return {
          ...commonFields,
          "Date of Operation": moment(transplanting.dateOfOperation).format(
            "DD-MM-YYYY"
          ),
          contractual: transplanting.contractual,
          "Machine Applicapble": transplanting.isMachineHired,
          "Machine Status": transplanting.isMachineHired ? "Hired" : "Owned",
          "Brand of Machine": transplanting.brandOfMachine,
          "Machine Type": transplanting.machineType,
          "Wages/Day (Male)": transplanting.wagesPerDayPerMale,
          "Wages/Day (Female)": transplanting.wagesPerDayPerFemale,
          "Domestic Males": transplanting.domesticMaleLabours,
          "Hired Males": transplanting.hiredMaleLabours,
          "Domestic Females": transplanting.domesticFemaleLabours,
          "Hired Females": transplanting.hiredFemaleLabours,
          "Reference Image": transplanting?.referencePhoto?.url
            ? transplanting?.referencePhoto?.url
            : "",
          "Upload date": moment(transplanting.createdAt).format("DD-MM-YYYY"),
        }
      }
      const formatHarvesting = (harvesting, commonFields) => {
         const residueData = harvesting?.residue_management_last_3yrs?.[0];

  // default residue values
  const residueFields = {
    "Residue Management Year": residueData?.year || "",
    "Removed from Field (%)": "",
    "Soil Incorporation (%)": "",
    "Stubble Burning (%)": "",
    "Fodder for Cattle (%)": "",
    "Chemical Treatment (%)": "",
  };

  // map methods to columns
  residueData?.management_methods?.forEach((item) => {
    switch (item.method) {
      case "Removed from field":
        residueFields["Removed from Field (%)"] = item.percentage;
        break;
      case "Soil Incorporation":
        residueFields["Soil Incorporation (%)"] = item.percentage;
        break;
      case "Stubble Burning":
        residueFields["Stubble Burning (%)"] = item.percentage;
        break;
      case "Fodder for Cattle":
        residueFields["Fodder for Cattle (%)"] = item.percentage;
        break;
      case "Chemical Treatment":
        residueFields["Chemical Treatment (%)"] = item.percentage;
        break;
      default:
        break;
    }
  });
        return {
          ...commonFields,
          "Date of Operation": moment(harvesting.dateOfOperation).format(
            "DD-MM-YYYY"
          ),
          contractual: harvesting.contractual,
          "Residue Management": harvesting.residueManagement,
          "Residue Management": harvesting.residueManagement,
          ...residueFields,
          "Brand of Machine": harvesting.brandOfMachine,
          "Machine Type": harvesting.machineType,
          "Machine Applicapble": harvesting.isMachineHired,
          "Machine Status": harvesting.isMachineHired ? "Hired" : "Owned",
          "Machine Cost/Acre": harvesting.machineRentPerAcre,
          "Wages/Day (Male)": harvesting.wagesPerDayPerMale,
          "Wages/Day (Female)": harvesting.wagesPerDayPerFemale,
          "Domestic Males": harvesting.domesticMaleLabours,
          "Hired Males": harvesting.hiredMaleLabours,
          "Domestic Females": harvesting.domesticFemaleLabours,
          "Hired Females": harvesting.hiredFemaleLabours,
          "Upload date": moment(harvesting.createdAt).format("DD-MM-YYYY"),
          "Reference Image": harvesting?.referencePhoto?.url
            ? harvesting?.referencePhoto?.url
            : "",
        };
      };

      const formatThreshing = (threshing, commonFields) => {
        return {
          ...commonFields,
          "Is Threshing Done": threshing.isThreshing,
          "Date of Operation": moment(threshing.dateOfOperation).format(
            "DD-MM-YYYY"
          ),
          Contractual: threshing.contractual,
          "Cost/Acre": threshing.costPerAcre,
          "Brand of Machine": threshing.brandOfMachine,
          "Machine Type": threshing.machineType,
          "Machine Status": threshing.isMachineHired ? "Hired" : "Owned",
          "Machine Cost/Acre": threshing.machineRentPerAcre,
          "Wages/Day (Male)": threshing.wagesPerDayPerMale,
          "Wages/Day (Female)": threshing.wagesPerDayPerFemale,
          "Domestic Males": threshing.domesticMaleLabours,
          "Hired Males": threshing.hiredMaleLabours,
          "Domestic Females": threshing.domesticFemaleLabours,
          "Hired Females": threshing.hiredFemaleLabours,
          "Upload date": moment(threshing.createdAt).format("DD-MM-YYYY"),
          "Reference Image": threshing?.referencePhoto?.url
            ? threshing?.referencePhoto?.url
            : "",
        };
      };

      const formatStorage = (storage, commonFields) => {
        return {
          ...commonFields,
          "Date of Operation": moment(storage.dateOfOperation).format(
            "DD-MM-YYYY"
          ),
          "Net Economic Yield After Drying (Quintal/Acre)":
            storage.netEconomicYieldAfterDrying,
          "Selling Price of Quintal (Rs/Quintal)":
            storage.sellingPriceOfQuintal,
          "Total Amount for Purchasing the Material (Rs/Acre)":
            storage.totalAmountForPurchasingTheMaterial,
          "Transportation Cost Used": storage.transportationCostUsed,
          "Packing Cost/Acre": storage.packingCostPerAcre,
          Contractual: storage.contractual,
          "Wages/Day (Male)": storage.wagesPerDayPerMale,
          "Wages/Day (Female)": storage.wagesPerDayPerFemale,
          "Domestic Males": storage.domesticMaleLabours,
          "Hired Males": storage.hiredMaleLabours,
          "Domestic Females": storage.domesticFemaleLabours,
          "Hired Females": storage.hiredFemaleLabours,
          "Material Used for Storage": storage.materialUsed,
          "Chemical Treatment for Storage":
            storage.chemicalTreatmentStoragePurpose,
          "Total Amount for Purchasing the Material (Rs/Acre)":
            storage.totalAmountForPurchasingTheMaterial,
          "Transportation CostFor Using Vehicle":
            storage.transportationCostForUsingVehicle,
          "Do You Any Chemical Treatment For The Storage":
            storage.doYouUseAnyChemicalTreatmentForTheStoragePurpose,
          "Transportation Cost From Harvest To Storage":
            storage.transportationCostFromHarvestToStorage,

          "Is Storage Applicapble": storage.isStorage,
          Contractual: storage.contractual,
          "Cost/Acre": storage.costPerAcre,

          "Upload date": moment(storage.createdAt).format("DD-MM-YYYY"),
          "Reference Image": storage?.referencePhoto?.url
            ? storage.referencePhoto.url
            : "",
        };
      };

      // Fetching data if clientId is provided
      if (clientId) {
        const clientDetails = await ClientRepository.findOne({ id: clientId });
        for (const project of clientDetails.projects) {
          // params.projectId = project.projectId;
          delete params.clientId;

          const farmersData = await FarmerRepository.find(params);
          for (const farmer of farmersData) {
            const commonFields = {
              Project: farmer.projectName,
              State: farmer.stateName,
              "Field Officer": farmer.dcName,
              "Farmer Code": farmer.farmerCode,
              "Name of the farmer": farmer.farmerName,
              District: farmer.districtName,
              Block: farmer.blockName,
              Village: farmer.villageName,
            };
            await fetchFarmerData(farmer, commonFields);
          }
        }
      } else {
        const farmersData = await FarmerRepository.find(params);
        for (const farmer of farmersData) {
          const commonFields = {
            Project: farmer.projectName,
            State: farmer.stateName,
            "Field Officer": farmer.dcName,
            "Farmer Code": farmer.farmerCode,
            "Name of the farmer": farmer.farmerName,
            District: farmer.districtName,
            Block: farmer.blockName,
            Village: farmer.villageName,
          };
          await fetchFarmerData(farmer, commonFields);
        }
      }

      return {
        status: true,
        msg: "Fetched successfully",
        data: dataCollections,
        projectNames: projectNames,
      };
    } catch (error) {
      console.log(error, "==errortext");
      return { status: false, msg: "An error occurred", error: error.message };
    }
  }
//new one


  async UpdateAllForSingleDatabase() {
    // Update all documents in the Repository collection
    const updateResult = await Repository.updateMany(
      {},
      {
        $set: {
          referancePhoto: {
            originalName: null, // Resetting originalName to null
            blobName: null, // Resetting blobName to null
            url: null, // Resetting url to null
            timeStamp: null, // Resetting timeStamp to null
            coords: null, // Resetting coords to null
          },
        },
      }
    );

    // If update was successful, return success message and update result
    if (updateResult) {
      return { status: true, msg: "Featched successfully", updateResult };
    } else {
      // If no documents were updated (though unlikely with updateMany), return user not found message
      return { status: false, msg: "User not found" };
    }
  }

  async CultivationReportCost(seasonId) {
    let data = [];

    // Check if seasonId is provided
    if (!seasonId) {
      return { status: false, msg: "SeasonId Missed!" };
    }

    // Iterate through keys of POP_RESOURCES_DATA
    for (const key of Object.keys(POP_RESOURCES_DATA)) {
      let Database;

      try {
        // Dynamically require the database model based on key
        Database = require(`../database/models/${key}`);
      } catch (error) {
        // If there's an error loading the resource, return error message
        return { status: false, msg: `Error loading ${key} resource`, error };
      }

      // Find document in Database model where seasonId matches
      const res = await Database.findOne({ seasonId });
      let total = 0;

      if (res) {
        // Calculate total cost based on operations data or specific fields in the document
        if (res.operations) {
          for (let operation of res.operations) {
            let op = operation.operationItems;
            // Sum up costs for chemicals, fertilizer, unit cost, fuel cost, contractual costs, and hired machine costs
            total += op?.chemicals?.length
              ? op.chemicals.reduce(
                  (av, cv) => av + Number(cv.costOfChemical),
                  0
                )
              : 0;
            total += op?.fertilizer?.length
              ? op.fertilizer.reduce(
                  (av, cv) => av + Number(cv.costOfTheFertilizer),
                  0
                )
              : 0;
            total += op.unitCostPerAcre ? Number(op.unitCostPerAcre) : 0;
            total += op.fuelCostPerAcre ? Number(op.fuelCostPerAcre) : 0;
            total += op.contractual ? Number(op.costPerAcre) : 0;
            total += op.isMachineHired ? Number(op.machineRentPerAcre) : 0;

            // Calculate labor costs if labor is involved
            if (op.isLabour) {
              let hiredMaleLaboursFee = 0;
              let hiredFemaleLaboursFee = 0;
              let domesticMaleLaboursFee = 0;
              let domesticFemaleLaboursFee = 0;

              if (op.hiredMaleLabours)
                hiredMaleLaboursFee =
                  Number(op.hiredMaleLabours) * Number(op.wagesPerDayPerMale);
              if (op.hiredFemaleLabours)
                hiredFemaleLaboursFee =
                  Number(op.hiredFemaleLabours) *
                  Number(op.wagesPerDayPerFemale);
              if (op.domesticMaleLabours)
                domesticMaleLaboursFee =
                  Number(op.domesticMaleLabours) *
                  Number(op.wagesPerDayPerMale);
              if (op.domesticFemaleLabours)
                domesticFemaleLaboursFee =
                  Number(op.domesticFemaleLabours) *
                  Number(op.wagesPerDayPerFemale);

              total +=
                hiredMaleLaboursFee +
                hiredFemaleLaboursFee +
                domesticFemaleLaboursFee +
                domesticMaleLaboursFee;
            }
          }
        } else {
          // Calculate total cost based on specific fields in the document
          total += res.contractual ? Number(res.costPerAcre) : 0;
          total += res.isMachineHired ? Number(res.machineRentPerAcre) : 0;
          total += res.seedQuantityPerAcre
            ? Number(res.amountAcurredForSeedInKG) *
              Number(res.seedQuantityPerAcre)
            : 0;
          // total += res.seedBioChemicalQuantity
          //   ? Number(res.seedBioChemicalQuantityamountUsedForInKG) *
          //     Number(res.seedBioChemicalQuantity)
          //   : 0;
          total += res?.chemicalBioAgentCostPerAcre
            ? Number(res.chemicalBioAgentCostPerAcre)
            : 0;
          total += res.transportationCostForUsingVehicle
            ? Number(res.transportationCostForUsingVehicle)
            : 0;
          total += res.totalAmountForPurchasingTheMaterialPerAcre
            ? Number(res.totalAmountForPurchasingTheMaterialPerAcre)
            : 0;
          total += res.transportationCostFromHarvestToStorage
            ? Number(res.transportationCostFromHarvestToStorage)
            : 0;
          total += res.packingCostPerAcre ? Number(res.packingCostPerAcre) : 0;

          // Calculate labor costs if labor is involved
          if (res.isLabour) {
            let hiredMaleLaboursFee = 0;
            let hiredFemaleLaboursFee = 0;
            let domesticMaleLaboursFee = 0;
            let domesticFemaleLaboursFee = 0;

            if (res.hiredMaleLabours)
              hiredMaleLaboursFee =
                Number(res.hiredMaleLabours) * Number(res.wagesPerDayPerMale);
            if (res.hiredFemaleLabours)
              hiredFemaleLaboursFee =
                Number(res.hiredFemaleLabours) *
                Number(res.wagesPerDayPerFemale);
            if (res.domesticMaleLabours)
              domesticMaleLaboursFee =
                Number(res.domesticMaleLabours) *
                Number(res.wagesPerDayPerMale);
            if (res.domesticFemaleLabours)
              domesticFemaleLaboursFee =
                Number(res.domesticFemaleLabours) *
                Number(res.wagesPerDayPerFemale);

            total +=
              hiredMaleLaboursFee +
              hiredFemaleLaboursFee +
              domesticFemaleLaboursFee +
              domesticMaleLaboursFee;
          }
        }

        // Push data object with POP name and total cost to data array
        data.push({ popName: key, cost: total });
      } else {
        // If no document found, push default data object with cost 0 to data array
        data.push({ popName: key, cost: 0 });
      }
    }

    // Return success message and data array
    return { status: true, msg: "Fetched successfully", data };
  }
  //version check Api
  async versionCheck() {
    let versionchcek = await Version.findOne();
    console.log(versionchcek, "-------------------");
    if (versionchcek) {
      return {
        status: true,
        msg: "Version Number Matched",
        data: versionchcek,
      };
    } else {
      return { status: false, msg: "Version Number Not Matched" };
    }
  }
}

module.exports = Service;
