'use strict';

const https = require('https');
var querystring = require('querystring');

exports.handler = async(event, context, callback) => {
  
  console.log('Received event:', JSON.stringify(event, null, 2));
	
  let body = JSON.parse(event.body)
	if (!body.id) {
	  callback(null, "BAD REQUEST");
	  return;
	}
	
	// Create payment request
  const transactionRequest = {
    'success_url': event.headers.origin + "/" + body.restaurantId  + "?tableNumber=" + body.tableNumber + "&ordercomplete=yes",
    'cancel_url': event.headers.origin + "/" + body.restaurantId  + "?tableNumber=" + body.tableNumber + "&ordercomplete=no",
    'payment_method_types[0]':'card',
    'mode':'payment',
    'metadata[cartid]': body.id,
    'line_items[0][amount]': body.total*100,
    'line_items[0][quantity]':'1',
    'line_items[0][currency]':'cad',
    'line_items[0][name]': 'Checkout now.',
  }
  
  console.log('my params: ', transactionRequest)

  const paymentResponse = await doPostRequest(transactionRequest)
    							.catch(err => console.error(`Error doing the request for the event: ${JSON.stringify(transactionRequest)} => ${err}`));
    
  // console.log('payment response: ', paymentResponse)
  // console.log('payment response: ', paymentResponse.redirect_url)
  
  const response = {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin" : "*", // Required for CORS support to work
      },
      body: JSON.stringify({ "location": paymentResponse.url })
    };
    
  callback(null, response);
};

const doPostRequest = (data) => {

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
    		console.log("my D: ", response)
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
