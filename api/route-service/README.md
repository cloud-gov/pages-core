route-service
=============

Run a test on the route service app locally. This guide assumes you are running all of the commands from the root of this repository.

## Commands

Use docker to launch a clamav rest instance to test against

```bash
docker run -p 9000:9000 -p 9443:9443 -itd --name clamav-rest ajilaag/clamav-rest
```

Start the route service proxy `app.js` server to curl against

```bash
node --watch api/route-service/app.js
```

Start the destination server

```bash
node --watch api/route-service/test.js
```


### Testing the endpoint

Running a successfully scanable file
```bash
curl -X POST \
  -H "X-Cf-Forwarded-Url: http://localhost:8081/v0/file-storage/123/upload" \
  -F "file=@api/route-service/files/test.txt" \
  -F "name=test-file.txt" \
  -F "parent=/test/path" \
  http://localhost:8080
```

Running a test malicious file
```bash
curl -X POST \
  -H "X-Cf-Forwarded-Url: http://localhost:8081/v0/file-storage/123/upload" \
  -F "file=@api/route-service/files/eicar.txt" \
  -F "name=test-file.txt" \
  -F "parent=/test/path" \
  http://localhost:8080
```
