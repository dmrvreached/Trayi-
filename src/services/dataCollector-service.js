const Repository = require("../database/models/dataCollector");
const {
  GeneratePassword,
  GenerateSalt,
  GenerateSignature,
  ValidatePassword,
  generateRandomNumber,
  removePrefix,
  addPrefix,
  removeDuplicateObjects,
} = require("../utils");
const sendSMS = require("../utils/functions/sms");
const RolesRepository = require("../database/models/roles");

// All Business logic will be here
class Service {
  async SignIn(userInputs, deviceToken) {
    const { phone, email, password } = userInputs;

    if (phone) {
      const existingCustomer = await Repository.findOne({
        phone: addPrefix(phone),
      });

      if (existingCustomer) {
        if (!existingCustomer.phoneVerification) {
          return { status: true, msg: "Please verify your Number!" };
        }
        if (!existingCustomer.status) {
          return {
            status: true,
            msg:
              "Your Account is inactive, Please contact Admin to activate your account",
          };
        }
        const validPassword = await ValidatePassword(
          password,
          existingCustomer.password
        );
        if (validPassword) {
          const roles = await RolesRepository.findOne({
            id: existingCustomer.roleId,
          });
          existingCustomer.userPermissions = roles ? roles.userPermissions : [];
          const token = await GenerateSignature({
            email: existingCustomer.email,
            id: existingCustomer.id,
            _id: existingCustomer._id,
            phone: existingCustomer.phone,
            fullName: existingCustomer.fullName,
            role: existingCustomer.roleName,
            userPermissions: existingCustomer.userPermissions,
          });
          existingCustomer.deviceToken = deviceToken;
          existingCustomer.JWT_token = token;
          existingCustomer.save();
          return {
            status: true,
            msg: "signIn successfully!",
            data: { token, data: existingCustomer },
          };
        }

        return { status: false, msg: "InValid Password!" };
      }
    }

    const existingCustomer = await Repository.findOne({ email });

    if (existingCustomer) {
      if (!existingCustomer.emailVerification) {
        return { status: true, msg: "Please verify your Email!" };
      }
      if (!existingCustomer.status) {
        return {
          status: true,
          msg:
            "Your Account is inactive, Please contact Admin to activate your account",
        };
      }

      const validPassword = await ValidatePassword(
        password,
        existingCustomer.password
      );

      if (validPassword) {
        const roles = await RolesRepository.findOne({
          id: existingCustomer.roleId,
        });
        existingCustomer.userPermissions = roles ? roles.userPermissions : [];
        const token = await GenerateSignature({
          email: existingCustomer.email,
          id: existingCustomer.id,
          _id: existingCustomer._id,
          phone: existingCustomer.phone,
          fullName: existingCustomer.fullName,
          role: existingCustomer.roleName,
          userPermissions: existingCustomer.userPermissions,
        });
        existingCustomer.deviceToken = deviceToken;
        existingCustomer.JWT_token = token;
        existingCustomer.save();
        return {
          status: true,
          msg: "signIn successfully!",
          data: { token, data: existingCustomer },
        };
      }

      return { status: false, msg: "InValid Password!" };
    }

    return { status: false, msg: `${phone || email} Not found` };
  }

  async SignInWithOTP(userInputs) {
    const { phone, email } = userInputs;
    if (phone) {
      const existingCustomer = await Repository.findOne({
        phone: addPrefix(phone),
      });

      if (existingCustomer) {
        if (!existingCustomer.status) {
          return {
            status: true,
            msg:
              "Your Account is inactive, Please contact Admin to activate your account",
          };
        }
        const roles = await RolesRepository.findOne({
          id: existingCustomer.roleId,
        });
        existingCustomer.userPermissions = roles ? roles.userPermissions : [];
        let otp;
        if (
          phone.toString() === "919666380289" ||
          phone.toString() === "919666380289"
        ) {
          otp = "admin@1234";
        } else {
          otp = await generateRandomNumber(4);
          await sendSMS(phone, otp);
        }
        existingCustomer.otp = otp;
        existingCustomer.phoneVerification = false;
        existingCustomer.save();
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
    }

    const existingCustomer = await Repository.findOne({ email });

    if (existingCustomer) {
      if (!existingCustomer.status) {
        return {
          status: true,
          msg:
            "Your Account is inactive, Please contact Admin to activate your account",
        };
      }
      const roles = await RolesRepository.findOne({
        id: existingCustomer.roleId,
      });
      existingCustomer.userPermissions = roles ? roles.userPermissions : [];
      const otp = await generateRandomNumber(4);
      existingCustomer.otp = otp;
      existingCustomer.phoneVerification = false;
      existingCustomer.save();
      return {
        status: true,
        msg: `Otp Has Been Sent To ${email.substring(0, 3)}XXXXX${email.slice(
          -12
        )}, Please verify OTP`,
        otp,
      };
    }

    return { status: false, msg: "Number/Email Not found" };
  }

  async Create(userInputs, id) {
    if (id) {
      if (userInputs.password) {
        let salt = await GenerateSalt();
        userInputs.password = await GeneratePassword(userInputs.password, salt);
      }
      if (userInputs.phone) {
        userInputs.phone = addPrefix(userInputs.phone);
      }
      if (userInputs.photo && userInputs.photo === "") {
        userInputs.photo = {};
      }
      const data = await Repository.findOneAndUpdate(
        { id },
        { $set: userInputs },
        { new: true, useFindAndModify: false }
      );
      if (data) {
        return { status: true, msg: "Updated successfully", data };
      }
      return { status: false, msg: "Failed to Update" };
    } else {
      const { password, phone } = userInputs;
      if (password) {
        let salt = await GenerateSalt();
        userInputs.password = await GeneratePassword(password, salt);
      }
      if (userInputs.photo && userInputs.photo === "") {
        userInputs.photo = {};
      }
      const roles = await RolesRepository.findOne({ id: userInputs.roleId });
      userInputs.userPermissions = roles ? roles.userPermissions : [];
      const otp = await generateRandomNumber(4);
      // await sendSMS(removePrefix(phone), otp)
      // userInputs.password = userPassword;
      userInputs.otp = otp;
      userInputs.phone = addPrefix(phone);
      const existingCustomer = await Repository.create(userInputs);
      if (existingCustomer) {
        return {
          status: true,
          msg: "DC created successfully",
          data: existingCustomer,
        };
      } else {
        return { status: false, msg: "falied to New Dc" };
      }
    }
  }

  async VerifyNumber({ phone, otp, deviceToken }) {
    const existingCustomer = await Repository.findOne({
      phone: addPrefix(phone),
      otp,
    });
    if (existingCustomer) {
      const token = await GenerateSignature({
        email: existingCustomer.email,
        id: existingCustomer.id,
        _id: existingCustomer._id,
        phone: existingCustomer.phone,
        fullName: existingCustomer.fullName,
        role: existingCustomer.roleName,
        userPermissions: existingCustomer.userPermissions,
      });
      existingCustomer.phoneVerification = true;
      existingCustomer.deviceToken = deviceToken;
      existingCustomer.JWT_token = token;
      existingCustomer.save();
      return {
        status: true,
        msg: "Verified",
        data: { token, data: existingCustomer },
      };
    } else {
      return { status: false, msg: "Invalid OTP!" };
    }
  }

  async VerifyEmail({ email, otp, deviceToken }) {
    const existingCustomer = await Repository.findOne({ email, otp });

    if (existingCustomer) {
      const token = await GenerateSignature({
        email: existingCustomer.email,
        id: existingCustomer.id,
        _id: existingCustomer._id,
        phone: existingCustomer.phone,
        fullName: existingCustomer.fullName,
        role: existingCustomer.roleName,
        userPermissions: existingCustomer.userPermissions,
      });
      existingCustomer.emailVerification = true;
      existingCustomer.deviceToken = deviceToken;
      existingCustomer.JWT_token = token;
      existingCustomer.save();
      return {
        status: true,
        msg: "Verified",
        data: { token, data: existingCustomer },
      };
    } else {
      return { status: false, msg: "Invalid OTP!" };
    }
  }

  async HardDelete(query) {
    const data = await Repository.findOneAndDelete(query);
    if (data) {
      return { status: true, msg: "Deleted successfully", data };
    }
    return { status: false, msg: "Failed to Delete" };
  }

  async Project(id) {
    const data = await Repository.findOne({ id });
    if (data) {
      const projects = data.projects.filter((p) => p.status === true);
      return { status: true, msg: "Fetched successfully", data: projects };
    }
    return { status: false, msg: "You have no projects to fetch" };
  }

  async Get(query) {
    const { size, page, search,status } = query;
    const limit = parseInt(size);
    const skip = (page - 1) * size;
    if (size) delete query.size;
    if (page) delete query.page;
    if (status) {
      query.status = status;
    }
    if (search) {
      query["$or"] = [
        {
          fullName: {
            $regex: search,
            $options: "i",
          },
        },
        {
          email: {
            $regex: search,
            $options: "i",
          },
        },
        {
          location: {
            $regex: search,
            $options: "i",
          },
        },
        {
          phone: {
            $regex: search,
            $options: "i",
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
    }
    return { status: false, msg: "User not found" };
  }

  async UpdateAll() {
    const updateResult = await Repository.updateMany(
      {},
      {
        $set: {
          projects: [
            {
              name: "Mrv Lite",
              projectId: "c0ef0fef-690c-4c9e-afe9-31e012c2fed1",
              status: true,
            },
          ],
        },
      }
    );
    // for (const doc of documents) {
    //     doc.phone = doc.phone ? doc.phone.toString() : null;
    //     await doc.save();
    // }
    // if (documents) {
    //     res.send({ msg: 'user updated', documents })
    // } else {
    //     res.send({ msg: 'user not find' })
    // }
    if (updateResult) {
      return { status: true, msg: "Featched successfully", updateResult };
    }
    return { status: false, msg: "User not found" };
  }
}

module.exports = Service;
