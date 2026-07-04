# File Server Project

A lightweight file server built with Node.js and Express that provides RESTful endpoints and a simple web UI for uploading, downloading, listing, and managing files. The project is container-ready with Docker and includes example usage for quick testing.

[Project issues](https://github.com/Dipesh7279/file-server-project/issues)

---

## Table of contents

- [Features](#features)  
- [Tech stack](#tech-stack)  
- [Getting started](#getting-started)  
  - [Prerequisites](#prerequisites)  
  - [Install](#install)  
  - [Environment variables](#environment-variables)  
  - [Run locally](#run-locally)  
  - [Run with Docker](#run-with-docker)  
- [API reference (examples)](#api-reference-examples)  
- [Frontend UI](#frontend-ui)  
- [Testing](#testing)  
- [Deployment](#deployment)  


## Features

- Upload single or multiple files via REST API or web UI
- List uploaded files with metadata (name, size, upload time)
- Download files via streaming to support large files
- Delete files and basic metadata management
- Server-side validation and error handling
- Dockerized for simple deployment

(Add or remove features here depending on what the project implements.)

---

## Tech stack

- JavaScript (Node.js, Express)
- HTML, CSS (simple frontend)
- Docker (containerization)
- Optional: local filesystem storage (default); can be extended to S3 or other object storage

---

## Getting started

### Prerequisites

- Node.js (>= 16) and npm
- Docker & Docker Compose (optional, for container runs)

### Install

Clone the repo and install dependencies:

```bash
git clone https://github.com/Dipesh7279/file-server-project.git
cd file-server-project
npm install
```

### Environment variables

Create a `.env` file in the project root (example values):

```
PORT=3000
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=104857600    # 100MB
NODE_ENV=development
```



### Run locally

Start the server in development:

```bash
npm run dev        # or: node index.js / npm start
```

Open your browser at http://localhost:3000 (or the port you set) to access the web UI or use the API below.

### Run with Docker

Build and run a Docker container:

```bash
docker build -t file-server .
docker run -p 3000:3000 -e PORT=3000 -v $(pwd)/uploads:/app/uploads file-server
```

Or using docker-compose (example docker-compose.yml):

```yaml
version: "3.8"
services:
  app:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./uploads:/app/uploads
    environment:
      - PORT=3000
```

Run:

```bash
docker compose up --build
```

---

## API reference (examples)

Below are typical example endpoints — update these to the actual routes used in your server.

- Upload a single file (multipart/form-data)
  - POST /api/upload

Example curl:

```bash
curl -X POST http://localhost:3000/api/upload \
  -F "file=@/path/to/local/file.jpg"
```

- List files
  - GET /api/files

Example curl:

```bash
curl http://localhost:3000/api/files
```

- Download a file by id or filename
  - GET /api/files/:id or /api/files/download/:filename

Example curl:

```bash
curl -O http://localhost:3000/api/files/download/example.pdf
```

- Delete a file
  - DELETE /api/files/:id

Example curl:

```bash
curl -X DELETE http://localhost:3000/api/files/12345
```



---

## Frontend UI

A minimal frontend is included (HTML/CSS/JS). It provides:

- File selection and upload form
- List of uploaded files with download/delete actions

Open the app in a browser (e.g., http://localhost:3000) to use the UI.



---

## Testing



```bash
npm test
```

- Manual test steps:
  1. Start server
  2. Upload a small file via the UI or curl
  3. Confirm file appears in list
  4. Download the file
  5. Delete the file and confirm removal

Add any automated test frameworks and coverage commands you use.

---

## Deployment

- Containerize with Docker as shown above for consistent deployments.



