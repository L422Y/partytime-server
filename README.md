# Partytime 🥳 Server
Partytime Server is a real-time server for for [partytime](https://github.com/l422y/partytime), an interactive party mode for Spotify. 
Users can send their votes to a Twilio number, and the server will update the playlist based on the votes received. 

This project is built using Node.js, Express, Socket.io, and the Twilio API.

## Features
* Real-time updates
* Supports multiple Spotify accounts
* Uses Twilio SMS for voting

## Prerequisites
* Node.js (v12 or higher)
* A Twilio account with a phone number capable of SMS
* A Spotify account 
* A running instance of [partytime](https://github.com/l422y/partytime)
* A public URL set up for your [Twilio SMS webhook](https://www.twilio.com/docs/usage/webhooks/sms-webhooks). 

If you're using a local development environment, you can use a service like [ngrok](https://ngrok.com/) to create a public URL for your local server.

## Installation
1) Clone the repository:
```bash
git clone https://github.com/l422y/partytime-server.git
```
Install dependencies:

```bash
cd partytime-server
npm install
```
2) Create a .env file in the root directory of the project and fill in the required variables:

```dotenv
PORT=4246
NUMBER_MAP='{"+1234567890":"you@your-email.com"}'
TEST_MODE=false
TEST_MODE_RATE_MS=1000
```

Replace +1234567890 with your Twilio phone number and you@your-email.com with your Spotify account email.

3) Run the server:
```sql
npm start
```

## Usage
1) Open your browser and go to your Partytime instance (e.g., http://localhost:5173/).
1) Send an SMS to your Twilio number with a vote (e.g., ? for help or a number to vote for a song).
1) Watch the real-time updates in the browser as votes are received.

## Contributing
Contributions are welcome! Please submit a pull request or create an issue for any bug fixes, new features, or improvements you'd like to see.

## License
This project is licensed under the MIT License.
