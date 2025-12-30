const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require('crypto');
const algorithm = 'aes-256-ctr';
const key = 'd6F3Efeqabcdefghij1234567890ABCD';
const iv = crypto.randomBytes(16);
const { APP_SECRET } = require("../config");

//Utility functions
module.exports.generateRandomNumber = (size = 4) => {
  const min = Math.pow(10, size - 1);
  const max = Math.pow(10, size) - 1;
  const otp = Math.floor(min + Math.random() * (max - min + 1));
  return otp;
};

module.exports.removeDuplicateObjects = (arr, prop = 'id') => {
  return arr.filter((obj, index, array) => {
    const firstIndex = array.findIndex((item) => item[prop] === obj[prop]);
    return index === firstIndex;
  });
};

module.exports.GenerateSalt = async () => {
  return await bcrypt.genSalt();
};

module.exports.GeneratePassword = async (password, salt) => {
  return await bcrypt.hash(password, salt);
};

module.exports.isObjectEmpty = (obj) => {
  return Object.keys(obj).length && obj.constructor === Object;
}

module.exports.isValueAvaliableInObject = (obj, value) => {
  const res = []
  for (let key in obj) {
    if (obj.hasOwnProperty(key) && obj[key].toString().includes(value)) {
      res.push(obj[key].toString());
    }
  }
  return res;
}

module.exports.Encrypt = (password) => {
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(password, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return {
    iv: iv.toString('hex'),
    encryptedPassword: encrypted
  };
}

module.exports.Decrypt = async (passwordData) => {
  if (this.isObjectEmpty(passwordData)) {
    const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(passwordData.iv, 'hex'));
    let decrypted = decipher.update(passwordData.encryptedPassword, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } else {
    return null;
  }
}

module.exports.ValidatePassword = async (
  enteredPassword,
  savedPassword,
) => {
  return bcrypt.compareSync(enteredPassword, savedPassword);
};

module.exports.GenerateSignature = async (payload) => {
  try {
    return jwt.sign(payload, APP_SECRET, { expiresIn: "30d" });
  } catch (error) {
    console.log(error.message);
    return error;
  }
};

module.exports.convertObjectToEnum = async (obj) => {
  const enumArr = [];
  Object.values(obj).map((val) => enumArr.push(val));
  return enumArr;
};

module.exports.ValidateSignature = async (req) => {
  try {
    const signature = req.get("Authorization");
    const payload = jwt.verify(signature.split(" ")[1], APP_SECRET);
    // console.log(payload, req.url);
    req.user = payload;
    return true;
  } catch (error) {
    console.log(error.message);
    return false;
  }
};

module.exports.convertToCamelCase = (inputString) => {
  const words = inputString.split(' ');
  const capitalizedWords = words.map((word, index) => index === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1));
  const camelCaseString = capitalizedWords.join('');
  return camelCaseString;
};

module.exports.convertToLowerCase = (inputString) => {
  return inputString.toLowerCase().replace(/\s+/g, '');
};

module.exports.convertFirstLetterToUppercase = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1)
};

module.exports.removePrefix = (number) => {
  if (number.toString().length > 10 && number.toString().startsWith("91")) {
    return number.toString().slice(2);
  } else {
    return number.toString();
  }
}
module.exports.addPrefix = (number) => {
  if (number?.toString().length < 11) {
    return "91" + number?.toString();
  } else {
    return number?.toString();
  }
}

const convertBooleanToApplicable = (data) => {
  for (let key in data) {
    const fields = [
      'isDynamicSeasonCompleted',
      'isBaselineSeasonCompleted',
      'isBaselineCompleted',
      'isSoliTestCompleted'
    ]
    if (fields.includes(key)) {
      switch (data[key]) {
        case true:
          // Update the value to 'Applicable'
          data[key] = 'Completed';
          break;
        case false:
          // Update the value to 'Not Applicable'
          data[key] = 'Not Complete';
          break;
      }
    } else if (key === "isDynamicOngoing") {
      switch (data[key]) {
        case true:
          // Update the value to 'Dynamic'
          data[key] = 'Yes';
          break;
        case false:
          // Update the value to 'Baseline'
          data[key] = 'No';
          break;
      }
    } else if (key === "seasonType") {
      switch (data[key]) {
        case 1:
          // Update the value to 'Dynamic'
          data[key] = 'Dynamic';
          break;
        case 0:
          // Update the value to 'Baseline'
          data[key] = 'Baseline';
          break;
      }
    } else {
      switch (data[key]) {
        case true:
          // Update the value to 'Applicable'
          data[key] = 'Applicable';
          break;
        case false:
          // Update the value to 'Not Applicable'
          data[key] = 'Not Applicable';
          break;
      }
    }
  }
  return data;
}

module.exports.convertApplicableToBoolean = (data) => {
  for (let key in data) {
    const fields = [
      'isDynamicSeasonCompleted',
      'isBaselineSeasonCompleted',
      'isBaselineCompleted',
      'isSoliTestCompleted'
    ]
    if (fields.includes(key)) {
      switch (data[key]) {
        case 'Completed':
          // Update the value to 'true'
          data[key] = true;
          break;
        case 'Not Complete':
          // Update the value to 'Not false'
          data[key] = false;
          break;
      }
    } else if (key === "isDynamicOngoing") {
      switch (data[key]) {
        case 'Yes':
          // Update the value to 'true'
          data[key] = true;
          break;
        case 'No':
          // Update the value to 'false'
          data[key] = false;
          break;
      }
    } else if (key === "seasonType") {
      switch (data[key]) {
        case 'Dynamic':
          // Update the value to '1'
          data[key] = 1;
          break;
        case 'Baseline':
          // Update the value to '0'
          data[key] = 0;
          break;
      }
    } else {
      switch (data[key]) {
        case 'Applicable':
          // Update the value to 'true'
          data[key] = true;
          break;
        case 'Not Applicable':
          // Update the value to 'false'
          data[key] = false;
          break;
      }
    }
  }
  return data;
}

module.exports.dateValidate = (dateString) => {
  const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;

  if (!iso8601Regex.test(dateString)) {
    let date = new Date(dateString);
    return (date.toISOString());
  }
  return dateString;
}

function replaceNullWithEmptyString(obj) {
  for (let key in obj) {
    if (obj[key] === null) {
      obj[key] = '';
    } else if (key === 'operations') {
      for (let i = 0; i < obj[key].length; i++) {
        for (let j in obj[key][i].operationItems) {
          if (obj[key][i].operationItems[j] === null) {
            obj[key][i].operationItems[j] = ''
          }
        }
      }
    }
  }
  return obj;
}

module.exports.removeFieldsFromObject = (data, options = [], convert = true) => {
  delete data._id;
  delete data.__v;
  delete data.otp;
  delete data.password;
  delete data.emailVerification;
  delete data.phoneVerification;
  delete data.deviceToken;
  delete data.JWT_token;
  delete data.addedById;
  delete data.updatedById;
  delete data.updatedAt;
  delete data.createdAt;
  delete data.isDeleted;
  delete data.addedByName;
  delete data.updatedByName;
  if (options.length) {
    options.forEach((option) => {
      delete data[option];
    });
  }
  replaceNullWithEmptyString(data);
  if (convert) {
    return data = convertBooleanToApplicable(data);
  }
  return data;
}
