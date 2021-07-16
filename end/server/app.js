const express = require('express')
const https = require('https');
var bodyParser = require('body-parser')
var jsonParser = bodyParser.json()
var cors = require('cors')

const app = express()
app.use(cors())

const port = 3000

app.post('/', jsonParser, async(req, res) => {
    const toReturn = await handleApiRequest(req)
    console.log("returning: ", toReturn)
    res.send(toReturn)
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})

handleApiRequest = async (request) => {
    
    // console.log("req body: ", request.body)

    // Calculate order in back-end
    let orderTotal = 0;
    request.body.forEach(element => {
        orderTotal += parseFloat(element.price)
    });

    // Create payment request
    const transactionRequest = {
        'success_url': "http://localhost:8000/demo",
        'cancel_url': "http://localhost:8000/demo",
        'payment_method_types[0]': 'card',
        'mode': 'payment',
        'metadata[cartid]': "my order ID or something",
        'line_items[0][amount]': parseInt(orderTotal * 100),
        'line_items[0][quantity]': '1',
        'line_items[0][currency]': 'cad',
        'line_items[0][name]': 'Checkout now.',
    }

    // Make API call to Stripe
    const paymentResponse = await doPostRequest(transactionRequest)
        .catch(err => console.error(`Error doing the request for the event: ${JSON.stringify(transactionRequest)} => ${err}`));

    const response = paymentResponse.url;

    return response;
};

doPostRequest = (data) => {

    return new Promise((resolve, reject) => {
        let formBody = [];
        for (var property in data) {
            var encodedKey = encodeURIComponent(property);
            var encodedValue = encodeURIComponent(data[property]);
            formBody.push(encodedKey + "=" + encodedValue);
        }
        formBody = formBody.join("&");

        const options = {
            host: 'api.stripe.com',
            path: '/v1/checkout/sessions',
            method: 'POST',
            headers: {
                'Authorization': 'Basic c2tfdGVzdF81MUpBZEh1RUsySHFVekJhOUE5dU5GZVpqS042WVVqanBYZXlEMWVFd1NhVjI1SWVYa3gwWnZHc3V4b29NYzdjelpHZkVlcUpYVDQxdnZkM0pGRVF2Q3EwQTAwc0RjdTNxU2g6',
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        };

        //create the request object with the callback with the result
        const req = https.request(options, (res) => {
            res.setEncoding('utf8');
            res.on('data', d => {
                const response = JSON.parse(d)
                console.log("Stripe response: ", response)
                resolve(response)
            })
        });

        // handle the possible errors
        req.on('error', (e) => {
            reject(e.message);
        });

        //do the request
        req.write(formBody);

        //finish the request
        req.end();
    });
};