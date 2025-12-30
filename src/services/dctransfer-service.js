const Repository = require("../database/models/dctransfers");
const DcRepository = require("../database/models/dataCollector");
const farmersRepository = require("../database/models/farmerDetails");
const { removeDuplicateObjects } = require("../utils");

class Service {
  async Create(userInputs, id) {
    console.log(userInputs, "===userInputs");
    const exist = await DcRepository.findOne({
      id: userInputs.dc_transfer_from_id,
    });
    if (exist) {
      const farmers = await farmersRepository.find({
        dcId: userInputs.dc_transfer_from_id,
      });
      if (farmers.length == 0) {
        return { status: false, msg: "Farmers not found" };
      } else {
        const farmerIds = await Promise.all(userInputs.farmers.map(async (f) => f.farmerId));
        const existingFarmers = await farmersRepository.find({
          dcId: userInputs.dc_transfer_from_id,
          id: { $in: farmerIds },
        });
        const updateFarmers = await farmersRepository.updateMany(
          {
            dcId: userInputs.dc_transfer_from_id,
            id: { $in: farmerIds },
          },
          {
            $set: {
              dcId: userInputs.dc_transfer_to_id,
              dcName: userInputs.dc_transfer_to_name,
            },
          }
        );
        console.log("Update result:", updateFarmers);
        if (updateFarmers.modifiedCount > 0) {
          const data = await Repository.create(userInputs);
          if (data) {
            return { status: true, msg: "Added successfully", data };
          } else {
            return { status: false, msg: "Failed to add" };
          }
        } else {
          return { status: false, msg: "Failed to add farmers" };
        }
      }
    } else {
      return { status: false, msg: "Source Data collector not found" };
    }
  }
  async Get(query) {
    let { size, page, search } = query;
    let all = true;
    if (size || page) {
      all = false;
    }
    const limit = parseInt(size);
    const skip = (page - 1) * size;
    if (size) delete query.size;
    if (page) delete query.page;
    if (search) {
      query["$or"] = [
        {
          dc_transfer_from_name: {
            $regex: search,
            $options: "i",
          },
        },
        {
          dc_transfer_to_name: {
            $regex: search,
            $options: "i",
          },
        },
        {
          dc_transfer_from_phone_number: {
            $regex: search,
            $options: "i",
          },
        },
        {
          dc_transfer_to_phone_number: {
            $regex: search,
            $options: "i",
          },
        },
        {
          dc_transfer_from_email: {
            $regex: search,
            $options: "i",
          },
        },
        {
          dc_transfer_to_email: {
            $regex: search,
            $options: "i",
          },
        },
      ];
      delete query.search;
    }
    const data = all
      ? await Repository.find(query).sort({ dc_transfer_from_name: 1 })
      : await Repository.find(query)
          .sort({ dc_transfer_from_name: 1 })
          .limit(limit)
          .skip(skip);
    const count = await Repository.find(query).countDocuments();
    if (data) {
      const newData = data.map((i) => {
        return { ...i._doc, blockId: i.id };
      });
      const res = search ? removeDuplicateObjects(newData, "id") : newData;
      const total = count;
      return { status: true, msg: "Featched successfully", data: res, total };
    } else {
      return { status: false, msg: "Failed to fetch" };
    }
  }
}

module.exports = Service;
