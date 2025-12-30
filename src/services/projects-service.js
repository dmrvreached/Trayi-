const Repository = require("../database/models/projects");
const DCRepository = require("../database/models/dataCollector");
const InterventionRepository = require("../database/models/intervention");
const VillageRepository = require("../database/models/village");
const { v4: uuidv4 } = require("uuid");
const { removeDuplicateObjects } = require("../utils");

class Service {
  async Create(userInputs, id) {
    for (const region of userInputs.regions) {
      for (const district of region.districts) {
        const blocks = region.blocks.filter(
          (b) => b.districtId === district.districtId
        );
        if (blocks.length === 0) {
          return {
            status: false,
            msg: "Please add atleast one block for each district",
          };
        }
      }
    }

    for (const crop of userInputs.crops) {
      for (const c of crop.crops) {
        const interventions = crop.interventions.filter(
          (i) => i.cropId === c.cropId
        );
        if (interventions.length === 0) {
          return {
            status: false,
            msg: "Please add atleast one intervention for each crops",
          };
        }
      }
    }
    for (let i = 0; i < userInputs.regions.length; i++) {
      let item = userInputs.regions[i];
      item.id = uuidv4();
      const blockIds = item.blocks.map((block) => block.blockId);
      const getVillages = await VillageRepository.find({
        blockId: { $in: blockIds },
      });
      item.villages = getVillages.map((v) => {
        return {
          blockId: v.blockId,
          villageName: v.name,
          villageId: v.id,
          status: v.status,
        };
      });
    }
    userInputs.crops.map((item) => {
      item.id = item.id ?? uuidv4();
      return item;
    });
    if (id) {
      const data = await Repository.findOneAndUpdate(
        { id },
        { $set: userInputs },
        { new: true, useFindAndModify: false }
      );
      if (data) {
        let districtIds = [];
        let blockIds = [];
        data.regions.map((r) => {
          r.districts.map((d) => districtIds.push(d.districtId));
          r.blocks.map((b) => blockIds.push(b.blockId));
        });
        const DCs = await DCRepository.find({
          $and: [
            { districtId: { $in: districtIds } },
            { blockId: { $in: blockIds } },
          ],
        });
        if (DCs && DCs.length) {
          await Promise.all(
            DCs.map(async (dc) => {
              dc.projects.map((s) => {
                if (s.projectId === data.id) {
                  s.status = data.status;
                }
              });
              await dc.save();
            })
          );
        }
        return { status: true, msg: "Updated successfully", data };
      } else {
        return { status: false, msg: "Failed to update" };
      }
    } else {
      const data = await Repository.create(userInputs);
      if (data) {
        if (data.status === true) {
          let districtIds = [];
          let blockIds = [];
          data.regions?.map((r) => {
            r.districts.map((d) => districtIds.push(d.districtId));
            r.blocks.map((b) => blockIds.push(b.blockId));
          });
          const DCs = await DCRepository.find({
            $and: [
              { districtId: { $in: districtIds } },
              { blockId: { $in: blockIds } },
            ],
          });
          if (DCs && DCs.length) {
            await Promise.all(
              DCs.map(async (dc) => {
                dc.projects.push({
                  name: data.name,
                  projectId: data.id,
                  status: true,
                });
                await dc.save();
              })
            );
          }
        }
        return { status: true, msg: "Added successfully", data };
      } else {
        return { status: false, msg: "Failed to add" };
      }
    }
  }

  async HardDelete(id) {
    const data = await Repository.findOneAndDelete({ id });

    if (!data) {
      return { status: false, msg: "Failed to delete" };
    }

    let districtIds = [];
    let blockIds = [];

    data.regions.forEach((r) => {
      r.districts.forEach((d) => districtIds.push(d.districtId));
      r.blocks.forEach((b) => blockIds.push(b.blockId));
    });

    const DCs = await DCRepository.find({
      $and: [
        { districtId: { $in: districtIds } },
        { blockId: { $in: blockIds } },
      ],
    });

    if (DCs && DCs.length) {
      await Promise.all(
        DCs.map(async (dc) => {
          dc.projects = dc.projects.filter((s) => s.projectId !== data.id);
          await dc.save();
        })
      );
    }

    return { status: true, msg: "Deleted successfully", data };
  }

  async Get(query) {
    const {
      id,
      states,
      stateId,
      districtId,
      blockId,
      cropTypes,
      cropTypeId,
      cropId,
      isBaselineDefault,
      search,
    } = query;
    if (stateId && districtId && blockId) {
      const data = await Repository.find({
        regions: { $elemMatch: { stateId: stateId } },
        regions: {
          $elemMatch: { districts: { $elemMatch: { districtId: districtId } } },
        },
        regions: {
          $elemMatch: { blocks: { $elemMatch: { blockId: blockId } } },
        },
      });
      if (data) {
        return { status: true, msg: "Featched successfully", data };
      } else {
        return { status: false, msg: "Failed to fetch" };
      }
    }
    const project = await Repository.findOne({ id });

    if (states) {
      return {
        status: true,
        msg: "Fetched successfully",
        data: project.regions.map((p) => ({
          stateName: p.stateName,
          stateId: p.stateId,
        })),
      };
    }

    if (stateId) {
      const selectedRegion = project.regions.find((c) => c.stateId === stateId);
      return selectedRegion
        ? {
            status: true,
            msg: "Fetched successfully",
            data: selectedRegion.districts,
          }
        : { status: false, msg: "Failed to fetch" };
    }

    if (districtId) {
      const selectedDistrict = project.regions.flatMap((c) =>
        c.blocks.filter((b) => b.districtId === districtId)
      );
      return selectedDistrict
        ? { status: true, msg: "Fetched successfully", data: selectedDistrict }
        : { status: false, msg: "Failed to fetch" };
    }

    if (cropTypes) {
      return {
        status: true,
        msg: "Fetched successfully",
        data: project.crops.map((c) => ({
          cropTypeName: c.cropTypeName,
          cropTypeId: c.cropTypeId,
        })),
      };
    }

    if (cropTypeId && !cropId) {
      const selectedCropType = project.crops.find(
        (c) => c.cropTypeId === cropTypeId
      );
      return selectedCropType
        ? {
            status: true,
            msg: "Fetched successfully",
            data: selectedCropType.crops,
          }
        : { status: false, msg: "Failed to fetch" };
    }

    if (isBaselineDefault !== undefined && cropId) {
      const selectedInterventions = project.crops.flatMap((c) =>
        c.interventions.filter((i) => {
          return (
            i.cropId === cropId &&
            i.isBaselineDefault === JSON.parse(isBaselineDefault)
          );
        })
      );
      if (!selectedInterventions)
        return { status: false, msg: "No matching interventions found" };
      const interventionDetails = [];
      for (const iv of selectedInterventions) {
        const intervention = await InterventionRepository.findOne({
          id: iv.interventionId,
        });
        interventionDetails.push({
          interventionId: intervention.id,
          interventionName: intervention.name,
          ...intervention._doc,
        });
      }
      return {
        status: true,
        msg: "Fetched successfully",
        data: interventionDetails,
      };
    }
    const { size = 20, page = 1 } = query;
    const limit = parseInt(size);
    const skip = (page - 1) * size;
    if (size) delete query.size;
    if (page) delete query.page;
    if (search) {
      query["$or"] = [
        {
          name: {
            $regex: search,
            $options: "i",
          },
        },
        {
          typeOfPractice: {
            $regex: search,
            $options: "i",
          },
        },
        {
          shortName: {
            $regex: search,
            $options: "i",
          },
        },
        {
          crops: {
            $elemMatch: {
              interventions: {
                $elemMatch: {
                  interventionName: {
                    $regex: search,
                    $options: "i",
                  },
                },
              },
            },
          },
        },
        {
          crops: {
            $elemMatch: {
              cropTypeName: {
                $regex: search,
                $options: "i",
              },
            },
          },
        },
      ];
      delete query.search;
    }
    const count = await Repository.find(query).countDocuments();
    const data = await Repository.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);
    if (data) {
      const res = search ? removeDuplicateObjects(data, "id") : data;
      const total = search ? res.length : count;
      return { status: true, msg: "Featched successfully", data: res, total };
    } else {
      return { status: false, msg: "Failed to fetch" };
    }
  }
  async GetDcData(query) {
    const { size, page, dcId } = query;
    const limit = parseInt(size);
    const skip = (page - 1) * size;
    if (size) delete query.size;
    if (page) delete query.page;
    const data = await DCRepository.aggregate([
      { $match: { id: dcId } },
      {
        $project: {
          projects: {
            $slice: ["$projects", skip, limit],
          },
        },
      },
      {
        $addFields: {
          total: { $size: "$projects" },
        },
      },
    ]);
    if (data) {
      let res =  removeDuplicateObjects(data, "id") ;
      delete res[0]._id;
      return { status: true, msg: "Featched successfully", data: res };
    } else {
      return { status: false, msg: "Failed to fetch" };
    }
  }
}

module.exports = Service;
