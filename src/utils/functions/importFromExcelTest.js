const exceljs = require('exceljs');
const ProjectService = require('../../services/projects-service');
const DCService = require('../../services/dataCollector-service');
const VillageService = require('../../services/village-service');
const BlockService = require('../../services/block-service');
const DistrictService = require('../../services/district-service');
const StateService = require('../../services/state-service');
const farmerService = require('../../services/farmerDetails-service');
const { convertApplicableToBoolean, isValueAvaliableInObject } = require('../index')


//services
const farmerServices = new farmerService();
const ProjectServices = new ProjectService();
const DCServices = new DCService();
const VillageServices = new VillageService();
const BlockServices = new BlockService();
const DistrictServices = new DistrictService();
const StateServices = new StateService();

async function processArray(arrayOfObjects, userData) {
  let failedData = [];
  let successData = [];
  for (let obj of arrayOfObjects) {
    const findFarmerNumber = await farmerServices.Get({ farmerMobile: obj.farmerMobile, projectName: obj.projectName });
    if (findFarmerNumber.length) {
      obj.status = 'Farmer mobile number already exist in this project';
      failedData.push(obj);
    } else {
      let newObject = {};
      for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
          switch (key) {
            case 'projectName':
              try {
                const { data } = await ProjectServices.Get({ name: obj[key] });
                if (data.length) {
                  newObject.projectName = obj[key];
                  newObject.projectId = data[0].id;
                } else {
                  newObject.projectName = `Error: ${key}: ${obj[key]} value not found`;
                }
              } catch (error) {
                console.error(`Error finding details ${obj[key]}:`, error);
                newObject.projectName = `Error: ${key}: ${obj[key]} value not found`;
              }
              break;
            case 'dcName':
              try {
                const { data } = await DCServices.Get({ fullName: obj[key] });
                if (data.length) {
                  newObject.dcName = obj[key];
                  newObject.dcId = data[0].id;
                } else {
                  newObject.dcName = `Error: ${key}: ${obj[key]} value not found`;
                }
              } catch (error) {
                console.error(`Error finding details ${obj[key]}:`, error);
                newObject.dcName = `Error: ${key}: ${obj[key]} value not found`;
              }
              break;
            case 'farmerName':
            case 'dateOfRegistration':
            case 'farmerCategory':
            case 'gender':
            case 'villageCode':
            case 'villageName':
              try {
                const { data } = await VillageServices.Get({ name: obj[key] });
                if (data.length) {
                  newObject.villageName = obj[key];
                  newObject.villageId = data[0].id;
                } else {
                  newObject.villageName = `Error: ${key}: ${obj[key]} value not found`;
                }
              } catch (error) {
                console.error(`Error finding details ${obj[key]}:`, error);
                newObject.villageName = `Error: ${key}: ${obj[key]} value not found`;
              }
              break;
            case 'stateName':
              try {
                const { data } = await StateServices.Get({ name: obj[key] });
                if (data.length) {
                  newObject.stateName = obj[key];
                  newObject.stateId = data[0].id;
                } else {
                  newObject.stateName = `Error: ${key}: ${obj[key]} value not found`;
                }
              } catch (error) {
                console.error(`Error finding details ${obj[key]}:`, error);
                newObject.stateName = `Error: ${key}: ${obj[key]} value not found`;
              }
              break;
            case 'districtName':
              try {
                const { data } = await DistrictServices.Get({ name: obj[key] });
                if (data.length) {
                  newObject.districtName = obj[key];
                  newObject.districtId = data[0].id;
                } else {
                  newObject.districtName = `Error: ${key}: ${obj[key]} value not found`;
                }
              } catch (error) {
                console.error(`Error finding details ${obj[key]}:`, error);
                newObject.districtName = `Error: ${key}: ${obj[key]} value not found`;
              }
              break;
            case 'blockName':
              try {
                const { data } = await BlockServices.Get({ name: obj[key] });
                if (data.length) {
                  newObject.blockName = obj[key];
                  newObject.blockId = data[0].id;
                } else {
                  newObject.blockName = `Error: ${key}: ${obj[key]} value not found`;
                }
              } catch (error) {
                console.error(`Error finding details ${obj[key]}:`, error);
                newObject.blockName = `Error: ${key}: ${obj[key]} value not found`;
              }
              break;
            case 'age':
            case 'farmerMobile':
            case 'educationInYears':
            case 'maritalStatus':
            case 'familySize':
            case 'membershipInFamilysOriganization':
            case 'farmExperience':
            case 'distanceToTheMainMarketYard':
            case 'distanceToTheMainRoad':
            case 'havingKisanCreditCard':
            case 'optedForInstitutionalCropLoanInThisCroppingSeason':
            case 'ifOptedFromTheCropLoanThenWhichBank':
            case 'optedForCropInsurance':
            case 'havingAssuredIrrigation':
            case 'havingLiveStock':
            case 'addOffFarmIncome':
            case 'havingAJobCardUnderMGNREGA':
            case 'havingTelevision':
            case 'havingSmartPhone':
            case 'havingBankAccount':
            case 'bankName':
            case 'branchName':
            case 'ifscCode':
            case 'accountNumber':
            case 'phoneVerification':
            case 'isTermsAccepted':
              newObject[key] = obj[key];
              break;
            default:
              newObject.id = userData.id;
              newObject.addedByName = userData.addedByName;
              newObject.addedById = userData.addedById;
          }
        }
      }
      const isValueAvaliable = isValueAvaliableInObject(newObject, 'Error:');
      if (isValueAvaliable.length) {
        obj.status = isValueAvaliable;
        failedData.push(obj);
      } else {
        successData.push(newObject);
        newObject = convertApplicableToBoolean(newObject);
        await farmerServices.Create(newObject)
      }
      newObject = {};
    }
  }
  return { msg: 'successfully uploaded', failedData, successData };
}

async function importFromExcel(excelData, userData) {
  try {
    const workbook = new exceljs.Workbook();
    await workbook.xlsx.load(excelData); // Load workbook from excelData
    const sheetNames = workbook.worksheets.map(ws => ws.name); // Fetch sheet names
    console.log('Sheet Names:', sheetNames);

    const sheet = workbook.getWorksheet(1); // Fetch first worksheet
    if (!sheet) {
      throw new Error('No sheet found.');
    }

    const jsonData = [];
    sheet.eachRow((row, rowIndex) => {
      if (rowIndex !== 1) { // Skip header row
        let rowData = {};
        row.eachCell((cell, colIndex) => {
          rowData[sheet.getRow(1).getCell(colIndex).value] = cell.value;
        });
        jsonData.push(rowData);
      }
    });

    const result = await processArray(jsonData, userData);
    return result;
  } catch (error) {
    console.error('Error importing from Excel:', error.message);
    throw error; // Propagate error up
  }
}


module.exports = importFromExcel;
