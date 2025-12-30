const FCM = require('fcm-node'); // Import FCM module
const { SERVER_KEY } = require('../../config'); // Import SERVER_KEY from configuration file
const fcm = new FCM(SERVER_KEY); // Create FCM instance with SERVER_KEY

async function notification(message) {
  // message parameter should be an object containing the notification details
  // Example structure of message:
  // message = {
  //   to: 'ckUGvQJFT2yoMpZRXSjHpC:APA91bHcDDnG71uZfnwftwh4UfYKEHFUo3Ix0stCUYNJnLf6m7JIdJ7CsMGySAEQuPoX6vF2KlQXhiHoKZTYpLK_BjSAqb-pkZiGW8jzLe363DvyQ1Mb_saNy3LKgYkqKA5Ll1sc6ByX',
  //   notification: {
  //     title: 'MRV',
  //     body: 'Hello farmer',
  //   }
  // };

  // Send notification using fcm.send()
  await fcm.send(message, function (err, response) {
    if (err) {
      console.log('Something has gone wrong!' + err);
    } else {
      console.log('Successfully sent with response: ', response);
    }
  });
}

// Export the notification function to be used elsewhere
module.exports = notification;
