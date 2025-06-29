// backend/server.js
const http = require("http");
const app = require("./app");
const setupSockets = require("./socket");

const server = http.createServer(app);


const io = setupSockets(server); 
app.set("io", io);               
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));