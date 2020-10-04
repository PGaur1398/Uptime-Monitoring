![nodejs](https://img.shields.io/badge/NodeJs%20-v12.16.3-brightgreen.svg)
# Restful API for Uptime Monitoring Application
An "Uptime Monitor" allows users to enter URL's they want to be monitored and receive alerts when those resources go down or back up.The API - 
- listens on a port and accepts incoming http requests for POST, GET, PUT, DELETE and HEAD.
- allows a user to "sign in" which gives them a token that they can use for subsequent authenticated requests.
- allows the users to "sign out" which invalidates their token.
- allows a signed-in user to create a new "check"(its a task for the system to check if the given url is up or down).
- workers perform all the checks at the appropriete time and send the alert to the user when it changes its state.
