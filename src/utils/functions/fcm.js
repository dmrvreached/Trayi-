
// const FCM = require('fcm-node'); // Import FCM module
// const { SERVER_KEY } = require('../../config'); // Import SERVER_KEY from configuration file
// const fcm = new FCM(SERVER_KEY); // Create FCM instance with SERVER_KEY
// async function notification(message) {
//   // message parameter should be an object containing the notification details
//   // Example structure of message:
//   // message = {
//   //   to: 'ckUGvQJFT2yoMpZRXSjHpC:APA91bHcDDnG71uZfnwftwh4UfYKEHFUo3Ix0stCUYNJnLf6m7JIdJ7CsMGySAEQuPoX6vF2KlQXhiHoKZTYpLK_BjSAqb-pkZiGW8jzLe363DvyQ1Mb_saNy3LKgYkqKA5Ll1sc6ByX',
//   //   notification: {
//   //     title: 'MRV',
//   //     body: 'Hello farmer',
//   //   }
//   // };

//   // Send notification using fcm.send()
//   await fcm.send(message, function (err, response) {
//     if (err) {
//       console.log('Something has gone wrong!' + err);
//     } else {
//       console.log('Successfully sent with response: ', response);
//     }
//   });
// }

const admin = require("../../config/firebase");



async function notification(message) {
  try {
    const adminMessage = {
      token: message.to,

      notification: {
        title: message.notification?.title || "",
        body: message.notification?.body || "",
      },

      data: message.data || {},

      android: {
        priority: "high",
        notification: {
          sound: "default",
          priority: "high",
        },
      },

      apns: {
        headers: {
          "apns-priority": "10",
        },
        payload: {
          aps: {
            alert: {
              title: message.notification?.title || "",
              body: message.notification?.body || "",
            },
            sound: "default",
          },
        },
      },
    };

    const response = await admin.messaging().send(adminMessage);
    console.log("Push notification sent:", response);
    return response;

  } catch (error) {
    console.error("Error sending push notification:", error.message);
    throw error;
  }
}

module.exports = notification;
