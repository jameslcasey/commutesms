const env = require('dotenv').config();
const got = require('got');
const moment = require('moment');
const twilio = require('twilio');
const schedule = require('node-schedule');

const home = env.parsed.HOME_ADDR.replace(' ', '+');
const work = env.parsed.WORK_ADDR.replace(' ', '+');
const baseurl = 'https://maps.googleapis.com/maps/api/directions/json';

var toWork = schedule.scheduleJob('0-60/2 6-7 * * 1-5', function () {
    CommuteVariance(home, work);
});
var toHome = schedule.scheduleJob('0-60/2 15-16 * * 1-5', function () {
    CommuteVariance(work, home);
});

function CommuteVariance(origin, destination) {

    (async (origin, destination) => {

        try {

            const response = await got(baseurl, {
                query: {
                    origin: origin,
                    destination: destination,
                    departure_time: 'now',
                    key: env.parsed.GMAPS_KEY
                }
            }).then(function (response) {

                var duration_text = JSON.parse(response.body).routes[0].legs[0].duration.text;
                var duration_in_traffic_text = JSON.parse(response.body).routes[0].legs[0].duration_in_traffic.text;

                var duration_value = JSON.parse(response.body).routes[0].legs[0].duration.value;
                var duration_in_traffic_value = JSON.parse(response.body).routes[0].legs[0].duration_in_traffic.value;

                var variance = (duration_in_traffic_value - duration_value) / 60;

                var message = JSON.stringify({
                    in_traffic: duration_in_traffic_text,
                    no_traffic: duration_text,
                    variance: variance
                });

                console.log(SendSms(message));
            })
        } catch (error) {
            console.log(error);
        }
    })(origin, destination);
}

function SendSms(smsBody) {

    const accountSid = env.parsed.TWILIO_ACCT_SID;
    const authToken = env.parsed.TWILIO_AUTH_TOKEN;
    const client = new twilio(accountSid, authToken);

    var response = client.messages.create({
        body: smsBody,
        from: env.parsed.FROM_PHONE,
        to: env.parsed.TO_PHONE
    });

    return response;
}