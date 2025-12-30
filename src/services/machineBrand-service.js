const Repository = require("../database/models/machineBrand");
const { removeDuplicateObjects } = require("../utils");

class Service {
  async Create(userInputs, id) {
    const exist = await Repository.findOne({
      name: userInputs.name,
      machineTypeId: userInputs.machineTypeId,
    });
    if (exist) {
      return { status: false, msg: "Already exist" };
    }
    if (id) {
      const data = await Repository.findOneAndUpdate(
        { id },
        { $set: userInputs },
        { new: true, useFindAndModify: false }
      );
      if (data) {
        return { status: true, msg: "Updated successfully", data };
      } else {
        return { status: false, msg: "Failed to Update" };
      }
    } else {
      const data = await Repository.create(userInputs);
      if (data) {
        return { status: true, msg: "Added successfully", data };
      } else {
        return { status: false, msg: "Failed to add" };
      }
    }
  }

  async HardDelete(id) {
    const data = await Repository.findOneAndDelete({ id });
    if (data) {
      return { status: true, msg: "Deleted successfully", data };
    } else {
      return { status: false, msg: "Failed to delete" };
    }
  }

  async Get(query) {
    const { size = 20, page = 1, search, machineTypeId } = query;
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
          machineTypeName: {
            $regex: search,
            $options: "i",
          },
        },
        {
          machineTypeId: {
            $regex: machineTypeId,
            $options: "i",
          },
        },
      ];
      delete query.search;
    }
    let data = await Repository.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);
    const count = await Repository.find(query).countDocuments();
    if (data) {
      const res = search ? removeDuplicateObjects(data, "id") : data;
      const total = search ? res.length : count;
      return { status: true, msg: "Featched successfully", data: res, total };
    } else {
      return { status: false, msg: "Failed to fetch" };
    }
  }

  async Multi(query) {
    // Find documents in Repository collection matching the criteria
    const data = await Repository.find({
      machineTypeId: { $in: query }, // Find documents where machineTypeId is in the array query
    });
    if (data) {
      return { status: true, msg: "Fetched successfully", data };
    } else {
      return { status: false, msg: "Failed to fetch" };
    }
  }
}

module.exports = Service;
