# Bonusx developer interview challenge

## 📘 Challenge

### Request

**As a** Fullstack Developer Candidate  
**I want** to build a simple application where users can upload and download files  
**So that** I can demonstrate my ability to integrate a frontend form with a backend API and an AWS S3 storage system

---

### ✅ Acceptance Criteria

- **Given** a user opens the frontend  
  **When** they select a file and submit the form  
  **Then** the file is uploaded to the backend and stored in an S3 bucket

- **Given** a file was uploaded successfully  
  **When** the user receives a confirmation  
  **Then** they should be able to download it back

---

### 💡 Nice to Have

- **Authentication**: a simple login system (e.g., with email + password or JWT)
- **File listing**: a list of uploaded files with metadata and download links
- **Presigned URLs**: for secure file uploads/downloads directly to/from S3
- **File validation**: limit allowed file types or sizes

## 🚀 How to start

To start the project, you can use the following commands:

```
yarn && yarn prepare
```

## 🔧 Environment Variables

### Backend Environment Variables

Create a `.env` file in the `backend/` root folder with the following environment variables for testing:

```
NODE_ENV=development
PORT=80

POSTGRES_DB=bonusx_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
DATABASE_URL=postgresql://postgres:password@database.local:5432/bonusx_db

S3_ENDPOINT=http://storage.local:9000
S3_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
S3_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
S3_BUCKET_NAME=bonusx-bucket
S3_REGION=us-east-1

JWT_SECRET=2ab0ab2e8dab76751456a765e5455dd6
JWT_EXPIRES_IN=7d
```

### Frontend Environment Variables

Create a `.env` file in the `frontend/` root folder with the following environment variables for testing:

```
PUBLIC_API_BASE_URL=http://localhost:3000/api
```

## Frontend

[how to start](./frontend/README.md)

## Backend

[how to start](./backend/README.md)
