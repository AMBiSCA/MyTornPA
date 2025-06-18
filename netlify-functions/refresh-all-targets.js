exports.handler = async function(event, context) {
    console.log("Hello World from the simplest possible function!");
    
    return {
        statusCode: 200,
        body: "Hello World! The function ran successfully."
    };
};