// Ultra-Basic "Callback" style function for maximum compatibility
exports.handler = function(event, context, callback) {
    console.log("This is the ultra-basic callback function speaking.");

    const response = {
        statusCode: 200,
        body: "Hello from the ultra-basic function!"
    };

    // Use the callback to return the response
    callback(null, response);
};