const fs = require("fs");
const net = require("net");
const zlib = require("zlib");

const VALID_ENCODINGS = ["gzip"];

const parseRequest = (rawRequest) => {
  const requestParts = rawRequest.split("\r\n");
  const [method, path] = requestParts[0].split(" ");
  const headers = {};
  let bodyStartIndex = requestParts.indexOf("") + 1;

  for (let i = 1; i < bodyStartIndex - 1; i++) {
    const [key, value] = requestParts[i].split(": ");
    headers[key] = value;
  }

  const body = requestParts.slice(bodyStartIndex).join("\r\n");

  return { method, path, headers, body };
};

const encodeResponse = (response, acceptedEncodings) => {
  const validEncoding = acceptedEncodings.find((enc) =>
    VALID_ENCODINGS.includes(enc)
  );

  if (validEncoding) {
    const encodedBody = zlib.gzipSync(response.body);
    return {
      ...response,
      headers: {
        ...response.headers,
        "Content-Encoding": validEncoding,
        "Content-Length": encodedBody.length,
      },
      body: encodedBody,
    };
  }

  return response;
};

const handleGet = (path, headers, directory) => {
  if (path === "/") {
    return { status: 200, headers: {}, body: "" };
  }

  if (path === "/user-agent") {
    const userAgent = headers["User-Agent"];
    return {
      status: 200,
      headers: { "Content-Type": "text/plain" },
      body: userAgent,
    };
  }

  if (path.startsWith("/files/")) {
    const filename = path.split("/files/")[1];
    const filePath = `${directory}/${filename}`;

    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf8");
      return {
        status: 200,
        headers: { "Content-Type": "application/octet-stream" },
        body: content,
      };
    } else {
      return { status: 404, headers: {}, body: "" };
    }
  }

  if (path.startsWith("/echo/")) {
    const echoContent = path.split("/echo/")[1];
    return {
      status: 200,
      headers: { "Content-Type": "text/plain" },
      body: echoContent,
    };
  }

  return { status: 404, headers: {}, body: "" };
};

const handlePost = (path, body, directory) => {
  if (path.startsWith("/files/")) {
    const filename = path.split("/files/")[1];
    const filePath = `${directory}/${filename}`;

    fs.writeFileSync(filePath, body);
    return { status: 201, headers: {}, body: "" };
  }

  return { status: 404, headers: {}, body: "" };
};

const getResponse = ({ method, path, headers, body }) => {
  const directory = process.argv[3];

  let response;
  if (method === "GET") {
    response = handleGet(path, headers, directory);
  } else if (method === "POST") {
    response = handlePost(path, body, directory);
  } else {
    response = { status: 404, headers: {}, body: "" };
  }

  if (headers["Accept-Encoding"]) {
    const acceptedEncodings = headers["Accept-Encoding"].split(", ");
    response = encodeResponse(response, acceptedEncodings);
  }

  return response;
};

const formatResponse = ({ status, headers, body }) => {
  const statusLine = `HTTP/1.1 ${status} ${getStatusText(status)}\r\n`;
  const headerLines = Object.entries(headers)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\r\n");
  const contentLength = Buffer.isBuffer(body)
    ? body.length
    : Buffer.byteLength(body);

  return `${statusLine}${headerLines}${
    headerLines ? "\r\n" : ""
  }Content-Length: ${contentLength}\r\n\r\n`;
};

const getStatusText = (status) => {
  const statusTexts = {
    200: "OK",
    201: "Created",
    404: "Not Found",
  };
  return statusTexts[status] || "";
};

const server = net.createServer((socket) => {
  socket.on("data", (data) => {
    const rawRequest = data.toString();
    const request = parseRequest(rawRequest);
    const response = getResponse(request);

    const responseHeader = formatResponse(response);
    socket.write(responseHeader);
    if (response.body) {
      socket.write(response.body);
    }
  });

  socket.on("close", () => {
    socket.end();
  });
});

server.listen(4221, "localhost");
