const net = require("net");

const getResponse = (method, path) => {
  if (method === "GET") {
    if (path === "/") return "HTTP/1.1 200 OK\r\n\r\n";

    if (path.includes("/echo/")) {
      const slug = path.split("/echo/")[1];
      return `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${slug.length}\r\n\r\n${slug}`;
    }

    return "HTTP/1.1 404 Not Found\r\n\r\n";
  }

  return "HTTP/1.1 404 Not Found\r\n\r\n";
};

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

    const [requestMethod, requestPath] = requestLine.split(" ");

    console.log({
      requestMethod,
      requestPath,
    });

    const response = getResponse(requestMethod, requestPath);

    socket.write(response);
  });
});

server.listen(4221, "localhost");
