const Repository = require("../database/models/village");
const { removeDuplicateObjects } = require("../utils");

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
      const { stateId, districtId, blockId } = userInputs;
      const check = await Repository.findOne({
        stateId,
        districtId,
        blockId,
        $expr: {
          $eq: [{ $toLower: "$name" }, userInputs.name.toLowerCase()],
        },
      });
      if (check) {
        return { status: false, msg: "Village already exists" };
      } else {
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
    const data = await Repository.findOneAndDelete({ id });
    if (data) {
      return { status: true, msg: "Deleted successfully", data };
    } else {
      return { status: false, msg: "Failed to delete" };
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
          name: {
            $regex: search,
            $options: "i",
          },
        },
        {
          blockName: {
            $regex: search,
            $options: "i",
          },
        },
        {
          districtName: {
            $regex: search,
            $options: "i",
          },
        },
        {
          stateName: {
            $regex: search,
            $options: "i",
          },
        },
      ];
      delete query.search;
    }
    const data = all
      ? await Repository.find(query).sort({ name: 1 })
      : await Repository.find(query).sort({ name: 1 }).limit(limit).skip(skip);
    const count = await Repository.find(query).countDocuments();
    if (data) {
      const newData = data.map((i) => {
        return { ...i._doc, villageId: i.id };
      });
      const res = search ? removeDuplicateObjects(newData, "id") : newData;
      const total = count;
      // console.log(count,"===count")
      // // const total = search ? res.length : count;

      // // const total =  count;
      return { status: true, msg: "Featched successfully", data: res, total };
    } else {
      return { status: false, msg: "Failed to fetch" };
    }
  }

  async Multi(query) {
    const data = await Repository.find({
      blockId: { $in: query },
      status: true,
    });
    if (data) {
      return { status: true, msg: "Fetched successfully", data };
    } else {
      return { status: false, msg: "Failed to fetch" };
    }
  }
  async villageReport(body) {
    const { stateIds, districtIds, blockIds } = body;
    let query = {};

    if (stateIds && stateIds.length > 0) {
      query.stateId = { $in: stateIds };
    }
    if (districtIds && districtIds.length > 0) {
      query.districtId = { $in: districtIds };
    }
    if (blockIds && blockIds.length > 0) {
      query.blockId = { $in: blockIds };
    }

    const data = await Repository.find(query);
    let villagesExcel = [];

    if (data) {
      data.forEach((village) => {
        villagesExcel.push({
          name: village.name,
          state: village.stateName,
          district: village.districtName,
          block: village.blockName,
        });
      });
      return { status: true, msg: "Fetched successfully", data: villagesExcel };
    } else {
      return { status: false, msg: "Failed to fetch" };
    }
  }
}

module.exports = Service;
