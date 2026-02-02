const cron = require('node-cron');
const notification = require('../utils/functions/fcm');
const CropAttributes = require('../database/models/cropAttributes');
const Sowing = require('../database/models/sowing');
const FarmerDetails = require('../database/models/farmerDetails');
const DataCollector = require('../database/models/dataCollector');


cron.schedule('0 7 * * *', async () => {
  try {
    const targetDate30 = new Date();
    const targetDate60 = new Date();
    const targetDate90 = new Date();
    targetDate30.setDate(targetDate30.getDate() - 25);
    targetDate60.setDate(targetDate60.getDate() - 55);
    targetDate90.setDate(targetDate90.getDate() - 85);
    const formattedDateFor30 = targetDate30.toISOString().slice(0, 10);
    const formattedDateFor60 = targetDate60.toISOString().slice(0, 10);
    const formattedDateFor90 = targetDate90.toISOString().slice(0, 10);

    const dataCollectors = await DataCollector.find();

    for (const dc of dataCollectors) {
      const farmers = await FarmerDetails.find({ dcId: dc.id });

      for (const farmer of farmers) {
        const checkAndNotify = async (days, date) => {
          const sowingData = await Sowing.find({
            farmerId: farmer.id,
            dateOfOperation: {
              $gte: `${date}T00:00:00.000Z`,
              $lte: `${date}T23:59:59.999Z`
            }
          });
          if (sowingData && sowingData.length > 0) {
            sowingData.forEach(async (_) => {
              const message = {
                to: dc.deviceToken,
                notification: {
                  title: 'Collect plant height data today!',
                  body: `It's been ${days} days since Sowing. Open the Mrv app now to measure and submit plant height for accurate analysis. For farmer_Id: ${farmer.farmerCode}`,
                }
              };
              await notification(message);
            });
          }
        };
        // Check and notify for 30 days
        await checkAndNotify(30, formattedDateFor30);

        // Check and notify for 60 days
        await checkAndNotify(60, formattedDateFor60);

        // Check and notify for 90 days
        await checkAndNotify(90, formattedDateFor90);
      }
    }
  } catch (error) {
    console.error(error.message);
  }

});
