const Repository = require("../database/models/clients");
const RolesRepository = require("../database/models/roles");

const { GenerateSignature, removeDuplicateObjects, Encrypt, Decrypt, generateRandomNumber, removePrefix, addPrefix } = require('../utils');
const sendSMS = require('../utils/functions/sms');

// All Business logic will be here
class Service {

    async SignIn(userInputs) {

        const { phone, email, password, deviceToken } = userInputs;

        if (phone) {
            const existingCustomer = await Repository.findOne({ phone: addPrefix(phone) });

            if (existingCustomer) {
                if (!existingCustomer.phoneVerification) {
                    const otp = await generateRandomNumber(4);
                    await sendSMS(phone, otp)
                    existingCustomer.otp = otp;
                    existingCustomer.phoneVerification = false;
                    existingCustomer.save();
                    return { status: true, msg: `Please verify your Number. Otp Has Been Sent To ${phone.toString().substring(0, 4)}XXXXX${phone.toString().slice(-2)}, Please verify the OTP` };
                }
                if (!existingCustomer.status) {
                    return { status: true, msg: 'Your Account is inactive, Please contact Admin to activate your account' };
                }
                const validPassword = await Decrypt(existingCustomer.password);
                if (validPassword === password) {
                    const roles = await RolesRepository.findOne({ id: existingCustomer.roleId });
                    existingCustomer.userPermissions = roles ? roles.userPermissions : [];
                    const token = await GenerateSignature({ email: existingCustomer.email, id: existingCustomer.id, _id: existingCustomer._id, phone: existingCustomer.phone, fullName: existingCustomer.fullName, role: existingCustomer.roleName, userPermissions: existingCustomer.userPermissions });
                    existingCustomer.deviceToken = deviceToken;
                    existingCustomer.JWT_token = token;
                    existingCustomer.save();
                    return { status: true, msg: 'signIn successfully!', data: { token, data: existingCustomer } };
                }

                return { status: false, msg: 'InValid Password!' };
            }
        }

        const existingCustomer = await Repository.findOne({ email });

        if (existingCustomer) {
            if (!existingCustomer.emailVerification) {
                const otp = await generateRandomNumber(4);
                existingCustomer.otp = otp;
                existingCustomer.emailVerification = false;
                existingCustomer.save();
                return { status: true, msg: `Please verify your Email. Otp Has Been Sent To ${email.substring(0, 3)}XXXXX${email.slice(-12)}, Please verify the OTP`, otp };
            }
            if (!existingCustomer.status) {
                return { status: true, msg: 'Your Account is inactive, Please contact Admin to activate your account' };
            }
            const validPassword = await Decrypt(existingCustomer.password);
            if (validPassword === password) {
                const roles = await RolesRepository.findOne({ id: existingCustomer.roleId });
                existingCustomer.userPermissions = roles ? roles.userPermissions : [];
                const token = await GenerateSignature({ email: existingCustomer.email, id: existingCustomer.id, _id: existingCustomer._id, phone: existingCustomer.phone, fullName: existingCustomer.fullName, role: existingCustomer.roleName, userPermissions: existingCustomer.userPermissions });
                existingCustomer.deviceToken = deviceToken;
                existingCustomer.JWT_token = token;
                existingCustomer.save();
                return { status: true, msg: 'signIn successfully!', data: { token, data: existingCustomer } };
            }

            return { status: false, msg: 'InValid Password!' };

        }

        return { status: false, msg: `${phone || email} Not found` };
    }

    async SignInWithOTP(userInputs) {

        const { phone, email } = userInputs;

        if (phone) {

            const existingCustomer = await Repository.findOne({ phone: addPrefix(phone) });

            if (existingCustomer) {
                if (!existingCustomer.status) {
                    return { status: true, msg: 'Your Account is inactive, Please contact Admin to activate your account' };
                }
                const roles = await RolesRepository.findOne({ id: existingCustomer.roleId });
                existingCustomer.userPermissions = roles ? roles.userPermissions : [];
                const otp = await generateRandomNumber(4);
                await sendSMS(phone, otp)
                existingCustomer.otp = otp;
                existingCustomer.phoneVerification = false;
                existingCustomer.save();
                return { status: true, msg: `Otp Has Been Sent To ${phone.toString().substring(0, 4)}XXXXX${phone.toString().slice(-2)}, Please verify OTP`, otp };
            }
        }

        const existingCustomer = await Repository.findOne({ email });

        if (existingCustomer) {
            if (!existingCustomer.status) {
                return { status: true, msg: 'Your Account is inactive, Please contact Admin to activate your account' };
            }
            const roles = await RolesRepository.findOne({ id: existingCustomer.roleId });
            existingCustomer.userPermissions = roles ? roles.userPermissions : [];
            const otp = await generateRandomNumber(4);
            existingCustomer.otp = otp;
            existingCustomer.phoneVerification = false;
            existingCustomer.save();
            return { status: true, msg: `Otp Has Been Sent To ${email.substring(0, 3)}XXXXX${email.slice(-12)}, Please verify OTP`, otp };
        }

        return { status: false, msg: 'Number/Email Not found' };
    }

    async Create(userInputs, id) {

        if (id) {

            if (userInputs.password) {
                userInputs.password = await Encrypt(userInputs.password);
            }
            if (userInputs.phone) {
                userInputs.phone = addPrefix(userInputs.phone)
                const find = await Repository.find({ id: { $ne: id }, phone: addPrefix(userInputs.phone) });
                if (find.length) return { status: false, msg: 'Mobile number already exist' };
            }
            if (typeof userInputs.photo === 'string') {
                userInputs.photo = {}
            }
            const data = await Repository.findOneAndUpdate({ id }, { $set: userInputs }, { new: true, useFindAndModify: false });
            if (data) {
                return { status: true, msg: 'Updated successfully', data };
            }
            return { status: false, msg: 'Failed to Update' };

        } else {
            const { password, phone } = userInputs;
            if (password) {
                userInputs.password = await Encrypt(password);
            }
            if (typeof userInputs.photo === 'string') {
                userInputs.photo = {}
            }
            const otp = await generateRandomNumber(4);
            userInputs.otp = otp;
            userInputs.phone = addPrefix(phone);
            const existingCustomer = await Repository.create(userInputs);
            if (existingCustomer) {
                const roles = await RolesRepository.findOne({ id: existingCustomer.roleId });
                existingCustomer.userPermissions = roles ? roles.userPermissions : [];
                return { status: true, msg: 'Client created successfully', data: existingCustomer };
            } else {
                return { status: false, msg: 'falied to New Client' }
            }
        }

    }

    async VerifyNumber({ phone, otp, deviceToken }) {
        const existingCustomer = await Repository.findOne({ phone: addPrefix(phone), otp });
        if (existingCustomer) {
            const token = await GenerateSignature({ email: existingCustomer.email, id: existingCustomer.id, _id: existingCustomer._id, phone: existingCustomer.phone, fullName: existingCustomer.fullName, role: existingCustomer.roleName, userPermissions: existingCustomer.userPermissions });
            existingCustomer.phoneVerification = true;
            existingCustomer.deviceToken = deviceToken;
            existingCustomer.JWT_token = token;
            existingCustomer.save();
            return { status: true, msg: 'Verified', data: { token, data: existingCustomer } };
        } else {
            return { status: false, msg: 'Invalid OTP!' };
        }

    }

    async VerifyEmail({ email, otp, deviceToken }) {

        const existingCustomer = await Repository.findOne({ email, otp })

        if (existingCustomer) {
            const token = await GenerateSignature({ email: existingCustomer.email, id: existingCustomer.id, _id: existingCustomer._id, phone: existingCustomer.phone, fullName: existingCustomer.fullName, role: existingCustomer.roleName, userPermissions: existingCustomer.userPermissions });
            existingCustomer.emailVerification = true;
            existingCustomer.deviceToken = deviceToken;
            existingCustomer.JWT_token = token;
            existingCustomer.save();
            return { status: true, msg: 'Verified', data: { token, data: existingCustomer } };
        } else {
            return { status: false, msg: 'Invalid OTP!' };

        }

    }

    async HardDelete(query) {

        const data = await Repository.findOneAndDelete(query);
        if (data) {
            return { status: true, msg: 'Deleted successfully', data };
        }
        return { status: false, msg: 'Failed to Delete' };
    }

    async Get(query) {
        const { size = 20, page = 1, search } = query
        const limit = parseInt(size);
        const skip = (page - 1) * size;
        if (size) delete query.size;
        if (page) delete query.page;
        if (search) {
            query['$or'] = [
                {
                    fullName: {
                        $regex: search,
                        $options: 'i',
                    },
                },
                {
                    email: {
                        $regex: search,
                        $options: 'i',
                    },
                },
                {
                    phone: {
                        $regex: '91' + search,
                        $options: 'i',
                    },
                },
                {
                    location: {
                        $regex: search,
                        $options: 'i',
                    },
                },
            ];
            delete query.search;
        }
        const count = await Repository.find(query).countDocuments();
        const data = await Repository.find(query).sort({ createdAt: -1 }).limit(limit).skip(skip);
        if (data) {
            const res = search ? removeDuplicateObjects(data, 'id') : data;
            const total = search ? res.length : count;
            return { status: true, msg: 'Featched successfully', data: res, total };
        }
        return { status: false, msg: 'User not found' };
    }
}

module.exports = Service;
