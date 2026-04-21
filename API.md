# Umurava API Documentation

This document provides a detailed overview of the Umurava backend API endpoints.

**Base URL**: The API is hosted at the root of the server. All endpoints are prefixed with `/api`.

**Authentication**: Endpoints marked with `🔒 Protected` require a JSON Web Token (JWT) to be sent in the `Authorization` header.

-   **Header Format**: `Authorization: Bearer <your_jwt_token>`

---

## 1. Authentication (`/api/auth`)

### `POST /api/auth/register`

Registers a new recruiter account.

-   **Request Body**:
    ```json
    {
      "email": "recruiter@company.com",
      "password": "a_strong_password"
    }
    ```
-   **Response (201 Created)**:
    ```json
    {
      "message": "Recruiter registered successfully"
    }
    ```

### `POST /api/auth/login`

Logs in a recruiter and returns a JWT.

-   **Request Body**:
    ```json
    {
      "email": "recruiter@company.com",
      "password": "a_strong_password"
    }
    ```
-   **Response (200 OK)**:
    ```json
    {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
    ```

---

## 2. Jobs (`/api/jobs`)

### `GET /api/jobs`

Retrieves a list of all job postings.

-   **Response (200 OK)**:
    ```json
    [
      {
        "_id": "60d5f1b4e6b3f1a2c8a4b8b1",
        "title": "Senior Software Engineer",
        "description": "...",
        "status": "open",
        "createdAt": "2023-01-01T00:00:00.000Z"
      }
    ]
    ```

### `GET /api/jobs/:id`

Retrieves a single job posting by its ID.

-   **Response (200 OK)**:
    ```json
    {
      "_id": "60d5f1b4e6b3f1a2c8a4b8b1",
      "title": "Senior Software Engineer",
      "description": "...",
      "status": "open",
      "createdAt": "2023-01-01T00:00:00.000Z"
    }
    ```

### `POST /api/jobs` 🔒 Protected

Creates a new job posting.

-   **Request Body**:
    ```json
    {
      "title": "Frontend Developer",
      "description": "Looking for a skilled React developer.",
      "requiredSkills": ["React", "TypeScript", "CSS"],
      "experienceLevel": "Mid-level",
      "educationLevel": "Bachelor's Degree"
    }
    ```
-   **Response (201 Created)**: Returns the newly created job object.

### `PUT /api/jobs/:id` 🔒 Protected

Updates an existing job posting.

-   **Request Body**: Same as `POST /api/jobs`.
-   **Response (200 OK)**: Returns the updated job object.

### `DELETE /api/jobs/:id` 🔒 Protected

Deletes a job posting.

-   **Response (200 OK)**:
    ```json
    {
      "message": "Job deleted successfully"
    }
    ```

---

## 3. Applicants (`/api/applicants`)

### `POST /api/applicants/upload-csv`

Uploads a batch of applicants from a CSV or Excel file.

-   **Request Type**: `multipart/form-data`
-   **Form Fields**:
    -   `file`: The `.csv` or `.xlsx` file.
    -   `jobId`: The ID of the job to link the applicants to.
-   **Response (201 Created)**:
    ```json
    {
      "message": "Applicants from CSV uploaded successfully"
    }
    ```

### `POST /api/applicants/upload-resume`

Uploads a single applicant from a PDF resume file.

-   **Request Type**: `multipart/form-data`
-   **Form Fields**:
    -   `file`: The `.pdf` file.
    -   `jobId`: The ID of the job.
    -   `fullName`: The applicant's full name.
    -   `email`: The applicant's email.
-   **Response (201 Created)**: Returns the newly created applicant object.

### `POST /api/applicants/upload-resume-link`

Uploads a single applicant from a public PDF resume URL.

-   **Request Body**:
    ```json
    {
      "resumeUrl": "https://example.com/path/to/resume.pdf",
      "fullName": "Jane Doe",
      "email": "jane.doe@example.com",
      "jobId": "60d5f1b4e6b3f1a2c8a4b8b1"
    }
    ```
-   **Response (201 Created)**: Returns the newly created applicant object.

### `POST /api/applicants`

Creates a single applicant from a structured JSON object (e.g., from the Umurava platform).

-   **Request Body**:
    ```json
    {
      "fullName": "John Smith",
      "email": "john.smith@example.com",
      "skills": ["Node.js", "MongoDB"],
      "experienceYears": 5,
      "education": "Master's in Computer Science",
      "jobId": "60d5f1b4e6b3f1a2c8a4b8b1",
      "profileData": { "umurava_profile_id": 123, "other_data": "..." }
    }
    ```
-   **Response (201 Created)**: Returns the newly created applicant object.

### `GET /api/applicants`

Retrieves all applicants for a specific job.

-   **Query Parameters**:
    -   `jobId` (required): The ID of the job.
-   **Example**: `/api/applicants?jobId=60d5f1b4e6b3f1a2c8a4b8b1`
-   **Response (200 OK)**: An array of applicant objects.

---

## 4. Screening (`/api/screening`)

### `POST /api/screening/:jobId` 🔒 Protected

Initiates the AI screening process for a given job.

-   **Query Parameters**:
    -   `limit` (optional): The number of top candidates to return. Defaults to `10`. Can be `20`.
-   **Example**: `/api/screening/60d5f1b4e6b3f1a2c8a4b8b1?limit=20`
-   **Response (201 Created)**: Returns the full screening result object, including the AI-generated shortlist.
    ```json
    {
      "_id": "60d5f1b4e6b3f1a2c8a4b8c3",
      "jobId": "60d5f1b4e6b3f1a2c8a4b8b1",
      "shortlist": [
        {
          "rank": 1,
          "applicantId": "60d5f1b4e6b3f1a2c8a4b8b2",
          "matchScore": 95,
          "strengths": ["Strong skills in Node.js", "5 years of relevant experience"],
          "gaps": ["No experience with GraphQL"],
          "relevanceToRole": "Highly relevant due to extensive backend experience.",
          "recommendation": "Strongly recommend for interview."
        }
      ],
      "createdAt": "2023-01-01T00:00:00.000Z"
    }
    ```

### `GET /api/screening/:jobId` 🔒 Protected

Retrieves the latest screening result for a specific job.

-   **Response (200 OK)**: Returns the screening result object, if found.
