const fs = require("fs");
const net = require("net");

const getHeaders = (requestParts) => {
  const headers = {};

  for (let i = 1; i < requestParts.length; i++) {
    const line = requestParts[i];
    if (line === "") break; // Empty line indicates end of headers

    const [key, value] = line.split(": ");
    headers[key] = value;
  }

  return headers;
};

const getBody = (requestParts) => {
  return requestParts[requestParts.length - 1];
};

const getResponse = ({ method, path, headers, body }) => {
  if (method === "GET") {
    if (path === "/") return "HTTP/1.1 200 OK\r\n\r\n";

    if (path === "/user-agent") {
      const userAgent = headers["User-Agent"];
      return `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${userAgent.length}\r\n\r\n${userAgent}`;
    }

    if (path.startsWith("/files/")) {
      const directory = process.argv[3];
      const filename = path.split("/files/")[1];

      if (fs.existsSync(`${directory}/${filename}`)) {
        const content = fs.readFileSync(`${directory}/${filename}`).toString();
        return `HTTP/1.1 200 OK\r\nContent-Type: application/octet-stream\r\nContent-Length: ${content.length}\r\n\r\n${content}\r\n`;
      } else {
        return "HTTP/1.1 404 Not Found\r\n\r\n";
      }
    }

    if (path.startsWith("/echo/")) {
      const slug = path.split("/echo/")[1];
      if (headers["Accept-Encoding"] === "gzip") {
        return `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Encoding: gzip\r\nContent-Length: ${slug.length}\r\n\r\n${slug}`;
      } else {
        return `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${slug.length}\r\n\r\n${slug}`;
      }
    }
  }

  if (method === "POST") {
    if (path.startsWith("/files/")) {
      const directory = process.argv[3];
      const filenameParam = path.split("/files/")[1];

      const filename = `${directory}/${filenameParam}`;

      fs.writeFileSync(filename, body);

      return "HTTP/1.1 201 Created\r\n\r\n";
    }
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

    const [method, path] = requestLine.split(" ");
    const headers = getHeaders(requestParts);
    const body = getBody(requestParts);

    const response = getResponse({ method, path, headers, body });

    socket.write(response);
  });
});

server.listen(4221, "localhost");
