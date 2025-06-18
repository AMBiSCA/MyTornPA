exports.handler = async function(event, context) {
    console.log("--- BARE BONES DEBUG FUNCTION STARTED ---");

    // Check for the existence of the environment variables
    const apiKey = process.env.ADMIN_TORN_API_KEY;
    const creds = process.env.FIREBASE_CREDENTIALS_BASE64;

    console.log("Found ADMIN_TORN_API_KEY:", !!apiKey); // This will log true or false
    console.log("Found FIREBASE_CREDENTIALS_BASE64:", !!creds); // This will log true or false

    if (creds) {
        console.log("First 50 characters of credentials variable:", creds.substring(0, 50));
    } else {
        console.log("The FIREBASE_CREDENTIALS_BASE64 variable was not found by the function.");
    }

    console.log("--- BARE BONES DEBUG FUNCTION FINISHED ---");

    // We are returning a custom error message on purpose so we know this version ran.
    return {
        statusCode: 501, // Using 501 "Not Implemented" as a signal
        body: "This was the bare-bones debug function. Please check the Netlify logs for the real output."
    };
};