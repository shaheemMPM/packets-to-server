const net = require("net");

const server = net.createServer((socket) => {
  socket.on("close", () => {
    socket.end();
  });

  socket.on("data", (data) => {
    /**
     * data will be buffer, need to convert to string before parsing path/headers/body
     */
    const rawRequest = data.toString();
    const requestParts = rawRequest.split("\r\n");
    const requestLine = requestParts[0];

    const [_requestMethod, requestPath] = requestLine.split(" ");

    const responseStatus = requestPath === "/" ? "200 OK" : "404 Not Found";

    socket.write(`HTTP/1.1 ${responseStatus}\r\n\r\n`);
  });
});

server.listen(4221, "localhost");
