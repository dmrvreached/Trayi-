const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();
// function sms(number, otp) {
//     // Make the POST request using axios
//     axios.post(`https://www.metamorphsystems.com/index.php/api/bulk-sms?username=viseljobs&password=DbcU33@eljobs&from=VISSMS&to=${number}&message=${otp} is your one-time password for Farmers onboarding. From: VRISMS&sms_type=2&template_id=1707169987342399441`)
//         .then((response) => {
//             console.log('API Response:', response.data);
//         })
//         .catch((error) => {
//             console.error('Error calling Bulk SMS API:', error.message);
//         });

// }


async function sms (number,otp){
    console.log(number,otp,"===number and otp");
    if(number.length <= 12){
        number = "91"+number;
    }else{
        number = number
    }
    var options = {
        method: 'POST',
        url: 'https://control.msg91.com/api/v5/flow',
        headers: {
          authkey: '427657Azxf9CoLqZ66b0986aP1',
          accept: 'application/json',
          'content-type': 'application/json'
        },
        data :{
            template_id : '6763f42bd6fc054a5b62b413',
            short_url : 1,
            realTimeResponse : 1,
            recipients : [
                {
                    mobiles: number,
                    var1: otp,
                    // VAR2: 'VALUE 2'
                }
            ]
        }
      };
      
      await axios.request(options).then(function (response) {
        
        // console.log(response.data,"===dataaa");
      }).catch(function (error) {
        console.error(error);
      });
    
}
module.exports = sms;
