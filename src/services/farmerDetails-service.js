const Repository = require("../database/models/farmerDetails");
const {
  removePrefix,
  addPrefix,
  generateRandomNumber,
  GenerateSignature,
  removeDuplicateObjects,
} = require("../utils");
const sendSMS = require("../utils/functions/sms");
const generateFarmerCode = require("../utils/functions/generateFarmerCode");
const generateFarmerAgreementPDF = require("../utils/functions/generateFarmerAgreementPDF");
const { uploadPDFBuffer } = require("../utils/functions/blobStorage");
const PlotRepository = require("../database/models/plotDetails");
const SeasonRepository = require("../database/models/seasonDetails");
const DateRepository = require("../database/models/operationDates");
const SoilRepository = require("../database/models/soilInformation");
const { RESOURCES_DATA, POP_RESOURCES_DATA } = require("../config/index");

class Service {
  async Create(userInputs, id) {
    if (id) {
      if (userInputs.farmerMobile) {
        userInputs.farmerMobile = addPrefix(userInputs.farmerMobile);
        const exist = await Repository.findOne({
          id: { $ne: id },
          farmerMobile: addPrefix(userInputs.farmerMobile),
          projectId: userInputs.projectId,
        });
        if (exist) {
          return {
            status: false,
            msg: "Farmer mobile number already exist in this project",
            data: exist,
          };
        }
      }

      // Generate PDF if farmer accepts terms and conditions
      if (userInputs.farmer_accept_terms_conditions === true) {
        try {
          const existingFarmer = await Repository.findOne({ id });
          const farmerData = { ...existingFarmer.toObject(), ...userInputs };
          
          // Generate PDF buffer
          const pdfBuffer = await generateFarmerAgreementPDF(farmerData);
          
          // Upload to Azure Blob Storage
          const fileName = `${farmerData.farmerCode || id}_agreement.pdf`;
          const pdfUrl = await uploadPDFBuffer(pdfBuffer, fileName);
          
          // Add the PDF URL to userInputs
          userInputs.farmer_agreement_url = pdfUrl;
        } catch (pdfError) {
          console.error('Error generating farmer agreement PDF:', pdfError);
          // Continue with update even if PDF generation fails
        }
      }

      const data = await Repository.findOneAndUpdate(
        { id },
        { $set: userInputs },
        { new: true, useFindAndModify: false }
      );
      if (data) {
        // Convert data to plain object and modify aadhaarPhoto
        const responseData = data.toObject();
        responseData.aadhaarPhoto = (data.aadhaarPhoto && data.aadhaarPhoto.url) ? data.aadhaarPhoto.url : "";
        return { status: true, msg: "Updated successfully", data: responseData };
      } else {
        return { status: false, msg: "Failed to update" };
      }
    } else {
      const {
        farmerMobile,
        stateName,
        districtName,
        blockName,
        projectId,
        aadhaarNumber,
      } = userInputs;
      // const exist = await Repository.findOne({ farmerMobile: addPrefix(farmerMobile), projectId });
      const exist = await Repository.findOne({
        farmerMobile: addPrefix(farmerMobile),
      });
      const aadhaarExist = await Repository.findOne({ aadhaarNumber });
      if (exist && aadhaarExist) {
        return {
          status: false,
          msg:
            "Farmer mobile number and Aadhaar number already exist in this project",
        };
      }
      let otp = await generateRandomNumber(4);
      let farmerCode = await generateFarmerCode(
        "Regenerative agriculture",
        stateName,
        districtName,
        blockName
      );
      userInputs.farmerMobile = addPrefix(farmerMobile);
      userInputs.otp = otp;
      userInputs.farmerCode = farmerCode;
      const data = await Repository.create(userInputs);
      if (data) {
        // Convert data to plain object and modify aadhaarPhoto
        const responseData = data.toObject();
        responseData.aadhaarPhoto = (data.aadhaarPhoto && data.aadhaarPhoto.url) ? data.aadhaarPhoto.url : "";
        return { status: true, msg: "Added successfully", data: responseData };
      } else {
        return { status: false, msg: "Failed to add" };
      }
    }
  }

  async HardDelete(id) {
    const data = await Repository.findOneAndDelete({ id });
    if (data) {
      const plots = await PlotRepository.find({ farmerId: id });
      if (plots && plots.length) {
        for (const plot of plots) {
          await PlotRepository.findOneAndDelete({ id: plot.id });
          await SoilRepository.findOneAndDelete({ plotId: plot.id });
          const seasons = await SeasonRepository.find({ plotId: plot.id });
          if (seasons && seasons.length) {
            for (const season of seasons) {
              const deletedSeason = await SeasonRepository.findOneAndDelete({
                id: season.id,
              });
              if (deletedSeason) {
                for (const key of Object.keys(POP_RESOURCES_DATA)) {
                  let Database;
                  try {
                    Database = require(`../database/models/${key}`);
                  } catch (error) {
                    return {
                      status: false,
                      msg: `Error loading ${key} resource`,
                      error,
                    };
                  }
                  await Database.findOneAndDelete({ seasonId: season.id });
                }
              }
              await DateRepository.findOneAndDelete({ seasonId: season.id });
            }
          }
        }
      }
      return { status: true, msg: "Deleted successfully", data };
    } else {
      return { status: false, msg: "Failed to delete" };
    }
  }

  async VerifyNumber({ phone, otp }) {
    const data = await Repository.findOne({
      farmerMobile: addPrefix(phone),
      otp,
    });
    if (data) {
      data.phoneVerification = true;
      data.save();
      const token = await GenerateSignature({
        id: data.id,
        _id: data._id,
        phone: data.farmerMobile,
        fullName: data.farmerName,
      });
      return { status: true, msg: "Verified", data: { token, data } };
    } else {
      return { status: false, msg: "Invalid OTP!" };
    }
  }

  async SignInWithOTP({ phone }) {
    const data = await Repository.findOne({ farmerMobile: addPrefix(phone) });

    if (data) {
      let otp = await generateRandomNumber(4);
      await sendSMS(phone, otp);
      data.otp = otp;
      data.phoneVerification = false;
      data.save();
      return {
        status: true,
        msg: `Otp Has Been Sent To ${phone
          .toString()
          .substring(0, 4)}XXXXX${phone
          .toString()
          .slice(-2)}, Please verify OTP`,
        otp,
      };
    }
    return { status: false, msg: `${phone} Not found` };
  }

  async Get(query) {
    const { size, page, search, dcId } = query;
    const limit = parseInt(size);
    const skip = (page - 1) * size;
    if (size) delete query.size;
    if (page) delete query.page;
    if (search) {
      query["$or"] = [
        {
          projectName: {
            $regex: search,
            $options: "i",
          },
        },
        {
          farmerCode: {
            $regex: search,
            $options: "i",
          },
        },
        {
          dcName: {
            $regex: search,
            $options: "i",
          },
        },
        {
          farmerName: {
            $regex: search,
            $options: "i",
          },
        },
        {
          villageName: {
            $regex: search,
            $options: "i",
          },
        },
        {
          farmerMobile: {
            $regex: search,
            $options: "i",
          },
        },
      ];
      delete query.search;
    }
    if (dcId) {
      query.dcId = dcId;
    }
    const count = await Repository.find(query).countDocuments();
    const data = await Repository.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);
    if (data) {
      let res = search ? removeDuplicateObjects(data, "id") : data;
      res = res.map((item) => {
        const itemDoc = item._doc || item;
        return {
          ...itemDoc,
          aadhaarPhoto:
            itemDoc.aadhaarPhoto == null ||
            (typeof itemDoc.aadhaarPhoto === "object" &&
              itemDoc.aadhaarPhoto.originalName === "" &&
              itemDoc.aadhaarPhoto.blobName === "" &&
              itemDoc.aadhaarPhoto.url === "")
              ? ""
              : (typeof itemDoc.aadhaarPhoto === "object" && itemDoc.aadhaarPhoto.url) 
                ? itemDoc.aadhaarPhoto.url 
                : itemDoc.aadhaarPhoto,
        };
      });
      const total = search ? res.length : count;
      return { status: true, msg: "Featched successfully", data: res, total };
    } else {
      return { status: false, msg: "Failed to fetch" };
    }
  }
  async GetFilterFarmers(req) {
    const { size, page, search, dcId } = req.query;
    const { stateId, districtId, blockId, villageId } = req.body;
    const limit = parseInt(size);
    const skip = (page - 1) * size;

    const query = {}; // Initialize query object

    if (size) delete req.query.size;
    if (page) delete req.query.page;

    // Add search functionality
    if (search) {
      query["$or"] = [
        { projectName: { $regex: search, $options: "i" } },
        { farmerCode: { $regex: search, $options: "i" } },
        { dcName: { $regex: search, $options: "i" } },
        { farmerName: { $regex: search, $options: "i" } },
        { villageName: { $regex: search, $options: "i" } },
        { farmerMobile: { $regex: search, $options: "i" } },
      ];
      delete req.query.search;
    }

    // Add filters
    if (dcId) {
      query.dcId = dcId;
    }
    if (stateId) {
      query.stateId = stateId;
    }
    if (districtId) {
      query.districtId = districtId;
    }
    if (blockId) {
      query.blockId = blockId;
    }
    if (villageId) {
      const villageArray = Array.isArray(villageId)
        ? villageId
        : villageId.split(",");
      query.villageId = { $in: villageArray };
    }

    // Count total matching documents
    const count = await Repository.find(query).countDocuments();

    // Fetch data with pagination and sorting
    const data = await Repository.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    if (data) {
      let res = search ? removeDuplicateObjects(data, "id") : data;
      res = res.map((item) => {
        const itemDoc = item._doc || item;
        return {
          ...itemDoc,
          aadhaarPhoto:
            itemDoc.aadhaarPhoto == null ||
            (typeof itemDoc.aadhaarPhoto === "object" &&
              itemDoc.aadhaarPhoto.originalName === "" &&
              itemDoc.aadhaarPhoto.blobName === "" &&
              itemDoc.aadhaarPhoto.url === "")
              ? ""
              : (typeof itemDoc.aadhaarPhoto === "object" && itemDoc.aadhaarPhoto.url) 
                ? itemDoc.aadhaarPhoto.url 
                : itemDoc.aadhaarPhoto,
        };
      });
      const total = search ? res.length : count;
      return { status: true, msg: "Fetched successfully", data: res, total };
    } else {
      return { status: false, msg: "Failed to fetch" };
    }
  }

  // async UpdateAll(req) {
  //     const { _id, fullName } = req.user;
  //     const { offlineData } = req.body;
  //     if (!!offlineData.length) {
  //         for (const inputs of offlineData) {
  //             const exist = inputs.id ? await Repository.findOne({ id: inputs.id }) : null;
  //             if (exist) {
  //                 inputs.updatedByName = fullName;
  //                 inputs.updatedById = _id;
  //                 if (inputs.farmerMobile) {
  //                     inputs.farmerMobile = addPrefix(inputs.farmerMobile)
  //                 }
  //                 const mobile = await Repository.findOne({ id: { $ne: inputs.id }, farmerMobile: addPrefix(inputs.farmerMobile), projectId: inputs.projectId });
  //                 if (mobile) {
  //                     return { status: false, msg: 'Mobile number already exist', data: mobile };
  //                 }
  //                 const data = await Repository.findOneAndUpdate({ id: exist.id }, { $set: inputs },
  //                     { new: true, useFindAndModify: false });
  //                 if (!data) {
  //                     return { status: false, msg: 'Failed to update' };
  //                 }
  //             } else {
  //                 inputs.farmerMobile = addPrefix(inputs.farmerMobile)
  //                 const mobile = inputs.farmerMobile ? await Repository.findOne({ farmerMobile: inputs.farmerMobile, projectId: inputs.projectId }) : null
  //                 if (mobile) {
  //                     return { status: false, msg: 'Mobile number already exist', data: mobile }
  //                 }
  //                 const { farmerMobile, stateName, districtName, blockName } = inputs;
  //                 inputs.addedByName = fullName;
  //                 inputs.addedById = _id;
  //                 let otp = await generateRandomNumber(4);
  //                 let farmerCode = await generateFarmerCode('Regenerative agriculture', stateName, districtName, blockName)
  //                 inputs.farmerMobile = addPrefix(farmerMobile);
  //                 inputs.otp = otp;
  //                 inputs.farmerCode = farmerCode;
  //                 const data = await Repository.create(inputs);
  //                 if (!data) {
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
    const { _id, fullName } = req.user;
    const { offlineData } = req.body;

    if (!offlineData || offlineData.length === 0) {
      return { status: false, msg: "Got empty data" };
    }

    // Batch size to prevent overloading the system
    const BATCH_SIZE = 100;

    // Helper function to process a single batch
    const processBatch = async (batch) => {
      const bulkOps = [];

      for (const inputs of batch) {
        try {
          if (inputs.id) {
            // Check for existing record
            const exist = await Repository.findOne({ id: inputs.id });

            if (exist) {
              inputs.updatedByName = fullName;
              inputs.updatedById = _id;

              if (inputs.farmerMobile) {
                inputs.farmerMobile = addPrefix(inputs.farmerMobile);
              }

              const mobileConflict = await Repository.findOne({
                id: { $ne: inputs.id },
                farmerMobile: inputs.farmerMobile,
                projectId: inputs.projectId,
              });

              if (mobileConflict) {
                return {
                  status: false,
                  msg: "Mobile number already exists",
                  data: mobileConflict,
                };
              }

              bulkOps.push({
                updateOne: {
                  filter: { id: exist.id },
                  update: { $set: inputs },
                  upsert: false,
                },
              });
            } else {
              // Insert new data
              inputs.addedByName = fullName;
              inputs.addedById = _id;
              inputs.farmerMobile = addPrefix(inputs.farmerMobile);

              const mobileConflict = await Repository.findOne({
                farmerMobile: inputs.farmerMobile,
                projectId: inputs.projectId,
              });

              if (mobileConflict) {
                return {
                  status: false,
                  msg: "Mobile number already exists",
                  data: mobileConflict,
                };
              }

              inputs.otp = await generateRandomNumber(4);
              inputs.farmerCode = await generateFarmerCode(
                "Regenerative agriculture",
                inputs.stateName,
                inputs.districtName,
                inputs.blockName
              );

              bulkOps.push({ insertOne: { document: inputs } });
            }
          }
        } catch (error) {
          console.error("Error processing input:", inputs, error.message);
          // Log errors but continue processing other records
        }
      }

      // Execute bulk operations for the batch
      if (bulkOps.length > 0) {
        await Repository.bulkWrite(bulkOps, { ordered: false }); // ordered: false allows partial success
      }
    };

    try {
      // Split the data into batches and process each batch sequentially
      for (let i = 0; i < offlineData.length; i += BATCH_SIZE) {
        const batch = offlineData.slice(i, i + BATCH_SIZE);
        await processBatch(batch);
      }

      return { status: true, msg: "Data Synced Successfully" };
    } catch (error) {
      console.error("Error syncing data:", error.message);
      return { status: false, msg: "Data Sync Failed", error: error.message };
    }
  }
}

module.exports = Service;
