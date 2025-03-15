# Deployment test 3 yes
# kiwana collins has successfully deployed using a github actions as a CI/CD pipeline

follow these steps to store user data(Balance
$0.00

Total Profit
$0.00

Active Trades
0

Active Traders
0) in MongoDB instead of storing them in that local storage of the browser and ensuring that it is accessible across different devices.


Server-Side Changes
Create a new API endpoint to save user data:

Update your server to handle saving user data to MongoDB. Add a new route and controller function to save the user data.

Update the User model to include the new fields:

Client-Side Changes
Update the client-side code to call the new API endpoint:

Modify the client-side code to send the user data to the server instead of saving it to local storage.

Fetch user data from the server when the user logs in:

Modify the login function to fetch user data from the server and update the UI accordingly.