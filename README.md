# Public Works Complaint Tracker
## Setup and User Guide

Welcome to the Public Works Complaint Tracker. This guide explains how to start and use the application on your computer. It is written for users who want to run the application without needing to understand its internal code.

---

## 1. What is the application?

The Public Works Complaint Tracker is an application for recording and following up on public works complaints.

The intended workflow is:

1. A citizen registers and signs in.
2. The citizen submits a complaint.
3. The complaint is reviewed and assigned by a supervisor.
4. The assigned crew works on the complaint and updates its progress.
5. The supervisor reviews the work and closes the complaint.

The application supports different user roles, so the screens and actions available may differ depending on the account.

## 2. What you need before starting

Install or have access to the following:

| Requirement | Purpose |
|---|---|
| IntelliJ IDEA | Open and run the backend application |
| Java JDK 17 | Required to run the backend |
| Node.js and npm | Required to run the frontend |
| Oracle Database | Stores application information |
| Oracle SQL Developer (recommended) | Helps connect to and inspect the Oracle database |

You do not need to install Maven separately if you use IntelliJ IDEA's bundled Maven or the project's Maven Wrapper, if one is included.

### Check your installations

Open PowerShell and run:

```powershell
java -version
node -v
npm -v
```

Java should report version 17. Node.js and npm should display their installed versions.

## 3. Open the project

The project folder is:

```text
C:\Users\DELL\public-works-complaint-tracker
```

The main folders are:

```text
public-works-complaint-tracker
├── backend
└── frontend
```

Open the project in IntelliJ IDEA. If IntelliJ asks whether to trust the project, trust it only if you obtained the project from a source you trust.

## 4. Configure the database

The application uses an Oracle database. Make sure your Oracle database service is running before starting the backend.

You will need the following details from your database administrator or local Oracle setup:

- Database connection URL
- Database username
- Database password

The connection URL depends on your Oracle installation. An example format is:

```text
jdbc:oracle:thin:@//localhost:1521/XEPDB1
```

`XEPDB1` is only an example service name. Use the service name configured in your own Oracle installation.

### Application environment settings

The backend may require these environment variables:

| Variable | What to enter |
|---|---|
| `DB_URL` | Your Oracle JDBC connection URL |
| `DB_USER` | Your Oracle database username |
| `DB_PASSWORD` | Your Oracle database password |
| `JWT_SECRET` | A long, randomly generated secret used by the application for sign-in tokens |

Do not share these values or commit them to source control.

In IntelliJ IDEA:

1. Open **Run → Edit Configurations**.
2. Select the Spring Boot run configuration for the backend.
3. Find the **Environment variables** field.
4. Add the required values, using the names expected by the application's configuration.
5. Save the configuration.

The exact required variable names and configuration keys should be checked against the backend configuration files. Do not create a second set of settings if the project already defines them.

## 5. Start the backend

The backend is the part of the application that processes requests and communicates with the database.

1. In IntelliJ IDEA, open the `backend` folder or its Maven project.
2. Make sure the project SDK is set to **JDK 17**.
3. Locate the Spring Boot main class, `PwctApplication`.
4. Open the class and click the green Run icon, or select the backend run configuration.
5. Wait for the application to finish starting.

A successful startup should include messages similar to:

```text
Tomcat started on port 8080 (http)
Started PwctApplication
```

Keep the backend running while you use the application.

If startup fails, check that Oracle is running and that the database connection settings are correct.

## 6. Start the frontend

The frontend is the website you open in your browser.

1. Open PowerShell or the IntelliJ terminal.
2. Change to the frontend folder:

```powershell
cd C:\Users\DELL\public-works-complaint-tracker\frontend
```

3. Install the frontend packages. You normally need to do this the first time, or after dependencies have changed:

```powershell
npm install
```

4. Start the frontend:

```powershell
npm start
```

**Important:** Use `npm start` rather than `npx ng serve --port 4200`. The project's `start` script loads `proxy.conf.json`, which forwards API requests to the backend.

Wait until Angular reports that the application is available at:

```text
http://localhost:4200/
```

Keep this terminal running while using the website.

## 7. Open the application

Open a browser and visit:

**http://localhost:4200/**

For normal local use, both the backend and frontend must be running:

| Part | Local address |
|---|---|
| Frontend website | http://localhost:4200 |
| Backend API | http://localhost:8080 |

The frontend proxy sends requests beginning with `/api` to the backend. You generally use the frontend address in your browser.

## 8. Register and sign in

1. Open the application at `http://localhost:4200/`.
2. Select the registration option.
3. Enter the details requested by the registration form.
4. Submit the form.
5. After successful registration, use the sign-in page with the account credentials you created.

The exact registration fields and account-approval process depend on the version of the application and its configured rules.

If registration fails, note the message shown on the page and check the troubleshooting section below.

## 9. Using the complaint workflow

The intended application workflow is:

### Citizen
- Create an account and sign in.
- Submit a complaint using the available form.
- Review the complaint and its progress, where those options are available.

### Supervisor
- Review incoming complaints.
- Assign complaints to the appropriate crew or department.
- Review completed work and close complaints, according to the application's permissions.

### Crew
- View work assigned to the crew.
- Update the complaint's progress or status as work is carried out.

### Administrator
- Manage application access or administrative functions that are enabled in the installed version.

The available pages and actions are controlled by the user's assigned role.

## 10. Stopping the application

When you have finished:

1. In the frontend terminal, press `Ctrl + C`.
2. In IntelliJ IDEA, click the Stop button for the backend run configuration.

Stop the frontend and backend separately.

## 11. Common problems

### The website does not open at port 4200
- Check that the frontend terminal is still running.
- Confirm that Angular displayed `http://localhost:4200/`.
- Check whether another application is already using port 4200.

### Registration or another API request returns 404
- Start the frontend with `npm start` from the `frontend` directory.
- Do not use `npx ng serve --port 4200` unless you also explicitly provide the proxy configuration.
- Confirm that the backend is running on port 8080.
- Check that the API path in the frontend matches the controller path in the backend.

### The backend does not start
- Confirm that JDK 17 is selected in IntelliJ.
- Check the IntelliJ Run console for the first error message.
- Confirm that the Oracle database is running.
- Recheck `DB_URL`, `DB_USER`, and `DB_PASSWORD`.

### The application cannot connect to Oracle
- Verify the database service name, host, and port.
- Test the same connection details in Oracle SQL Developer.
- Confirm that the database user has the permissions required by the application.

### Login or token errors
- Check that the required JWT secret is configured.
- Confirm that the frontend is sending requests to the expected API.
- Check the backend logs for the exact authentication error.

### Port 8080 is already in use
- Stop the other application using port 8080, or change the backend port and update the frontend proxy target to match.

## 12. Quick start checklist

Each time you want to run the application:

- [ ] Start the Oracle database.
- [ ] Start the backend in IntelliJ IDEA.
- [ ] Confirm that Spring Boot started on port 8080.
- [ ] Open a terminal in the `frontend` folder.
- [ ] Run `npm start`.
- [ ] Open http://localhost:4200/ in your browser.

## Added platform features

The project now includes paginated complaint search and sorting, status/priority/date filters, status history, comments, photo attachments through an S3-compatible bucket, dashboard analytics, notification inbox, optional SMTP delivery, scheduled overdue reminders, password reset, role/account administration, and XLSX/PDF report downloads.

### Additional backend settings

| Variable | Purpose |
|---|---|
| `S3_BUCKET` | Required bucket name for complaint photo uploads |
| `AWS_REGION` | S3 region (default `us-east-1`) |
| `S3_ENDPOINT` | Optional S3-compatible endpoint (for example MinIO) |
| `EMAIL_NOTIFICATIONS_ENABLED` | Set `true` to deliver reset and complaint emails |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` | SMTP connection settings |
| `MAIL_FROM` | Sender address |
| `JWT_SECRET` | Set a strong random secret for the running environment |

Create the bucket ahead of time and provide AWS credentials through the standard AWS SDK credential chain. Photo uploads accept JPEG, PNG, and WebP up to 5 MB.

Flyway migrations `V2` and `V3` add notification/reset/attachment tables, optimistic locking, and phone number support. Do not edit previously applied migrations; add a new numbered migration for future schema changes.

### API documentation

Once the backend is running, visit `http://localhost:8080/swagger-ui.html`. The OpenAPI schema is available at `/v3/api-docs`. Use **Authorize** in Swagger UI with a JWT returned by `/api/auth/login`.

### Quality commands

```powershell
cd backend
mvn test
mvn verify
cd ..\frontend
npm.cmd run build
```

The backend includes JUnit/Mockito test dependencies and the initial workflow unit tests. SonarQube settings are in `sonar-project.properties`.

For Angular unit tests, install a Chrome/Chromium browser and run `npm.cmd test` from `frontend/`. For Playwright E2E tests, start Oracle and the Spring Boot API first, then install the Playwright browser with `npx playwright install chromium` and run `npm.cmd run test:e2e`. Set `PWCT_E2E_USERNAME`, `PWCT_E2E_PASSWORD`, `PWCT_E2E_SUPERVISOR`, and `PWCT_E2E_CREW` to use dedicated test accounts.

---

## Notes

- Never put real database passwords or JWT secrets in a public repository.
- Do not use production database credentials for local development.
- This guide describes the local setup and intended workflow. Exact form fields, user permissions, and available screens are determined by the application code and configuration.
