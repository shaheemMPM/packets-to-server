# Testing

1. You can test 200 HTTP request status with curl `curl -v http://localhost:4221`
2. For testing `/files` endpoint, you can first create a file in `/tmp/` with the following command

   ```bash
   echo -n 'Hello, World!' > /tmp/foo
   ```

   now run the server with the following flag `--directory /tmp/` <br/>
   eg: `yarn start --directory /tmp/` OR `yarn dev --directory /tmp/`

   - Now if you make a request to `/files/foo` we'll get the contents of the created file. <br/>
   - If we make a request to any non existant files, we'll get 404 Response
