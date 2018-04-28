const env = require('dotenv').config();
const got = require('got');
const moment = require('moment');
const twilio = require('twilio');
const schedule = require('node-schedule');

const home = env.parsed.HOME_ADDR.replace(' ','+');
const work = env.parsed.WORK_ADDR.replace(' ','+');
const baseurl = 'https://maps.googleapis.com/maps/api/directions/json';


var toWork = schedule.scheduleJob('0-60/5 6-7 * * 1-5', CommuteToWork());
var toHome = schedule.scheduleJob('0-60/5 15-16 * * 1-5', CommuteToHome());

function CommuteToWork()
{
    async () => {

        try {
            
            const response = await got(baseurl, {
                query :
                {
                    origin:home,
                    destination:work,
                    departure_time:'now',
                    key:env.parsed.GMAPS_KEY
                }
            });
        
            var duration_text = JSON.parse(response.body).routes[0].legs[0].duration.text;
            var duration_in_traffic_text = JSON.parse(response.body).routes[0].legs[0].duration_in_traffic.text;
    
            var duration_value = JSON.parse(response.body).routes[0].legs[0].duration.value;
            var duration_in_traffic_value = JSON.parse(response.body).routes[0].legs[0].duration_in_traffic.value;
    
            var variance = duration_in_traffic_value-duration_value;

            var message = JSON.stringify(
                {
                    duration_in_traffic_text:duration_in_traffic_text,
                    duration_text:duration_text,
                    variance:variance
                }
            );

            SendSms(message);
    
        } catch (error) {
            console.log(error);
        }
    }
}


function CommuteToHome()
{
    async () => {

        try {
            
            const response = await got(baseurl, {
                query :
                {
                    origin:work,
                    destination:home,
                    departure_time:'now',
                    key:env.parsed.GMAPS_KEY
                }
            });
        
            var duration_text = JSON.parse(response.body).routes[0].legs[0].duration.text;
            var duration_in_traffic_text = JSON.parse(response.body).routes[0].legs[0].duration_in_traffic.text;
    
            var duration_value = JSON.parse(response.body).routes[0].legs[0].duration.value;
            var duration_in_traffic_value = JSON.parse(response.body).routes[0].legs[0].duration_in_traffic.value;
    
            var variance = duration_in_traffic_value-duration_value;

            var message = JSON.stringify(
                {
                    duration_in_traffic_text:duration_in_traffic_text,
                    duration_text:duration_text,
                    variance:variance
                }
            );

            SendSms(message);
    
        } catch (error) {
            console.log(error);
        }
    }
}


function SendSms(smsBody) {

    const accountSid = env.parsed.TWILIO_ACCT_SID;
    const authToken = env.parsed.TWILIO_AUTH_TOKEN;   
    const client = new twilio(accountSid, authToken);
        
    client.messages.create({
        body: smsBody,
        from: env.parsed.FROM_PHONE,
        to: env.parsed.TO_PHONE  
    });
}


