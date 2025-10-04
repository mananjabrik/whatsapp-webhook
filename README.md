# Whatsapp Webhook

This project is a simple whatsapp webhook service using nestjs as the framework and baileys as the whatsapp client library.

## How to start

1. Clone this repository
2. Install all dependencies by running `npm install`
3. Create a `.env` file and add all required environment variables
4. Run `npm run start:dev` to start the service in development mode
5. Open another terminal and run `npx` to open the whatsapp web interface
6. Scan the qr code shown in the whatsapp web interface to connect to whatsapp
7. Send a message to the whatsapp number that is connected to the service
8. Verify that the message is received by the service and logged in the console.
9. You can try this service by opening `localhost:port/api` in your web browser.

## What is this app for?

This app is designed to help users easily setup whatsapp webhook service using nestjs as the framework and baileys as the whatsapp client library. With this app, users can easily connect to whatsapp and receive messages sent to the whatsapp number that is connected to the service.

The app provides a simple and easy-to-use interface for users to connect to whatsapp and start receiving messages. The app also logs all incoming messages to the console, making it easy for users to verify that the service is working correctly.

The app is designed to be used as a starting point for users who want to build more complex whatsapp webhook services. With the app, users can easily add more features and functionality to the service, such as sending messages, downloading media, and more.

## TODO

* Get message: get the latest message sent to the whatsapp number that is connected to the service
* Get group: get the group information of the whatsapp group that the service is connected to
* Get media: get the media sent to the whatsapp number that is connected to the service
* Send media: send a media to a whatsapp number
* Get all messages: get all messages sent to the whatsapp number that is connected to the service
* Get all groups: get all the whatsapp groups that the service is connected to
* Get all contacts: get all the whatsapp contacts that the service is connected to
* Get all status: get the status of all the whatsapp contacts that the service is connected to
* Get all blocked contacts: get all the whatsapp contacts that have blocked the service
* Get all messages from a group: get all the messages sent to a specific whatsapp group
* Send a message to a group: send a message to a whatsapp group
* Send a message to a contact: send a message to a whatsapp contact
* Get all unread messages: get all the unread messages sent to the whatsapp number that is connected to the service

## Open Source

This project is open source and open to contributions from anyone. If you would like to contribute to this project, please feel free to open a pull request with your changes. All contributions will be reviewed and merged into the project if they are deemed suitable.

Please note that all contributions must adhere to the terms of the MIT license, which is the license under which this project is released. By contributing to this project, you are agreeing to release your contributions under the MIT license.
