# DupmeSonata

### Description
- This is a project in **Netcentric Architecture** class at Chulalongkorn University (1/2020)
- The objective of this project is to understand how to deal with socket in network programming.
- A 2-players game where each player must follows another player's steps correctly to win.
- This project has been deploy at Heroku: https://pta-dupme-sonata.herokuapp.com

### Instruction
1. This project is required node_modules to successfully execute, you can install node_modules by using the command `npm install`

2. To execute the server of this project, run the following command in the project folder.
 `npm run server`

3. Once the server has been initiated, the server user interface (server.html on browser) will automatically pop up.
- Since server.html use localhost and PORT number to connect, the number of current
socket connection are including the server.
 - Since server.html connect the socket using localhost, it cannot be open on the client
side.
- If you manually open server.html on the folder after initiate, it will redirect toward
client user interface.
- **WARNING!!! Closing the browser will terminate the server**

4. The client can connect to the server using the url provided in the command line or the server user interface.
- If the server and client are on difference devices (same network), make sure that the server network profile is set to private in order to allows the connection within the same network.



### Member
- Thanapol Aussavaruengsuwat
- Supawis Tangsasom
- Panisara Waisurasingh
- Tatpicha Yoohoon
- Intuorn Jariyaprasertsin
