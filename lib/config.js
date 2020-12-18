// Container for all environments
var environments = {};

// Staging (default) environment
environments.staging = {
  'httpPort' : 3000,
  'httpsPort' : 3001,
  'envName' : 'staging',
  'hashingSecret' : 'ThisIsHashingSecret',
  'twilio' : {
  'accountSid' : process.env.TWILIO_ACCOUNT_SID,
  'authToken' : process.env.TWILIO_AUTH_TOKEN,
  'fromPhone' : '+12516551855'
  }


};

// Production environment
environments.production = {
  'httpPort' : 5000,
  'httpsPort' : 5001,
  'envName' : 'production',
  'hashingSecret' : 'ThisIsHasingSecret',
  'maxChecks' : 5
};

// Determine which environment was passed as a command-line argument
var currentEnvironment = typeof(process.env.NODE_ENV) !== 'undefined' ? process.env.NODE_ENV.toLowerCase() : '';

// Check that the current environment is one of the environments above, if not default to staging
var environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;

// Export the module
module.exports = environmentToExport;