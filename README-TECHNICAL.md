# Public Works Complaint Tracker
## Technical Documentation

## 1. Project overview

The Public Works Complaint Tracker is a full-stack web application intended to manage public works complaints through a role-based workflow. Citizens can submit complaints; supervisors can review and assign work; crews can update progress; and supervisors can review and close completed work.

The repository is organized as a monorepo containing a Spring Boot backend and an Angular frontend.

### Technology stack

| Layer | Technology |
|---|---|
| Backend language | Java 17 |
| Backend framework | Spring Boot 3.x |
| API | Spring MVC / REST |
| Security | Spring Security |
| Authentication tokens | JJWT / JSON Web Tokens |
| Persistence | Spring Data JPA, Hibernate |
| Database | Oracle Database |
| Database driver | Oracle JDBC (`ojdbc`) |
| Database migrations | Flyway |
| Frontend | Angular (standalone components) |
| UI components | Angular Material |
| Frontend HTTP | Angular HTTP client |
| Local backend port | 8080 |
| Local frontend port | 4200 |

Use the versions declared in `backend/pom.xml` and the frontend package manifest/lockfile as the source of truth. The table describes the intended stack, not a substitute for those version declarations.

## 2. Repository structure

```text
public-works-complaint-tracker/
├── backend/
│   ├── pom.xml
│   └── src/
│       └── main/
│           ├── java/
│           │   └── com/
│           │       └── pwct/
│           └── resources/
│               ├── application*.yml
│               └── db/
│                   └── migration/
└── frontend/
    ├── package.json
    ├── proxy.conf.json
    └── src/
```

The exact package and resource layout should be verified against the checked-out source tree. The backend's main application class is `com.pwct.PwctApplication`.

## 3. Prerequisites

Install and configure:

- JDK 17
- IntelliJ IDEA with Java and Maven support
- Node.js and npm versions compatible with the Angular version in the project
- Oracle Database and a reachable database service
- Oracle SQL Developer (optional, useful for validating database connectivity)

Maven can be run through IntelliJ's bundled Maven or the repository's Maven Wrapper if present.

Verify the local tools:

```powershell
java -version
javac -version
node -v
npm -v
```

## 4. Backend setup

### 4.1 Open and configure the Maven project

Open `backend/pom.xml` in IntelliJ IDEA or open the repository and import the backend as a Maven project.

Configure the Project SDK and Maven Runner JRE to JDK 17:

**File → Project Structure → Project SDK**

**Settings → Build, Execution, Deployment → Build Tools → Maven → Runner → JRE**

Resolve dependencies using the Maven tool window or run the Maven lifecycle goal:

```text
clean
install
```

If a Maven Wrapper is included, it can be used from PowerShell:

```powershell
.\mvnw.cmd clean install
```

Otherwise, use IntelliJ's Maven integration or an installed Maven distribution.

### 4.2 Database configuration

The backend uses Oracle. The design configuration identifies `application-oracle.yml` and the following environment-variable names:

| Variable | Purpose |
|---|---|
| `DB_URL` | Oracle JDBC URL |
| `DB_USER` | Database username |
| `DB_PASSWORD` | Database password |
| `JWT_SECRET` | Secret used to sign/validate JWTs |

Example local JDBC URL (replace the service name to match the local Oracle installation):

```text
jdbc:oracle:thin:@//localhost:1521/XEPDB1
```

Do not assume `XEPDB1` is the correct service name for every Oracle installation.

Set environment variables in the Spring Boot run configuration:

**Run → Edit Configurations → backend Spring Boot configuration → Environment variables**

Use the exact property names and profile activation expected by the checked-in configuration. If the Oracle profile is not activated automatically, inspect `application.yml` and the run configuration before setting `SPRING_PROFILES_ACTIVE`.

Never commit real credentials or JWT secrets. Use local environment variables or an approved secrets mechanism.

### 4.3 Database migrations

Flyway is used for schema migration. Migration scripts are expected under the configured Flyway migration location, commonly:

```text
backend/src/main/resources/db/migration/
```

The initial migration is identified in the project design as `V1__init.sql`.

On startup, Flyway applies pending migrations according to the configured datasource and Flyway settings. Check the backend logs for migration failures. Do not manually rerun or edit migrations that have already been applied to a shared database without following the team's migration policy.

### 4.4 Run the backend

Run `PwctApplication` from IntelliJ IDEA.

Expected startup log includes:

```text
Tomcat started on port 8080 (http) with context path '/'
Started PwctApplication
```

The API base address for local development is:

```text
http://localhost:8080
```

The context path shown in the startup log is `/`.

## 5. Frontend setup

### 5.1 Install dependencies

From the frontend directory:

```powershell
cd frontend
npm install
```

Use the committed lockfile and the package manager/version expected by the project. Avoid deleting the lockfile as a routine troubleshooting step.

### 5.2 Development server and proxy

The frontend's `package.json` defines the development start script:

```json
{
  "scripts": {
    "ng": "ng",
    "start": "ng serve --proxy-config proxy.conf.json",
    "build": "ng build"
  }
}
```

The local proxy configuration is:

```json
{
  "/api": {
    "target": "http://localhost:8080",
    "secure": false,
    "changeOrigin": true
  }
}
```

Start Angular from the `frontend` directory:

```powershell
npm start
```

This is important: running `npx ng serve --port 4200` by itself does not necessarily load `proxy.conf.json`. Without the proxy, browser requests to `/api/...` are handled by the Angular development server and may return 404 rather than reaching Spring Boot.

The development server is available at:

```text
http://localhost:4200/
```

The proxy forwards matching `/api` requests to `http://localhost:8080` without removing the `/api` prefix.

### 5.3 Production build

Build the frontend with:

```powershell
npm run build
```

The output directory and deployment procedure depend on the Angular build configuration. The Angular development proxy is for local development; production deployments need an appropriate reverse proxy or API base URL configuration.

## 6. Local request flow

```text
Browser
  |
  | http://localhost:4200
  v
Angular development server
  |
  | /api/** (proxy.conf.json)
  | forwards to http://localhost:8080
  v
Spring Boot / Spring MVC
  |
  +--> Spring Security / authentication
  |
  +--> REST controller
         |
         v
      Service layer
         |
         v
      Spring Data JPA / Hibernate
         |
         v
      Oracle Database
```

For example, a frontend request to:

```text
POST http://localhost:4200/api/auth/register
```

is proxied to:

```text
POST http://localhost:8080/api/auth/register
```

The browser's Network panel can continue to show port 4200 because the browser sends the request to the Angular development server; the forwarding happens server-side.

## 7. Authentication and authorization

The application uses Spring Security and JWT-based authentication.

The design specifies JWT claims including:

- `sub`: token subject
- `uid`: user identifier
- `roles`: assigned role list
- `deptId`: department identifier

The secret used to sign or validate tokens must be configured consistently in the backend. Keep it private and use a sufficiently strong randomly generated value.

### Application roles

The design identifies these roles:

| Role | Intended responsibility |
|---|---|
| `CITIZEN` | Submit and follow up on complaints |
| `CREW` | Work on assigned complaints and update progress |
| `SUPERVISOR` | Review, assign, and close complaints |
| `ADMIN` | Administrative access and management |

Actual access must be determined by the security configuration and authorization rules in the source code. Do not infer that a role can access an endpoint until its security rules have been checked.

## 8. Domain workflow

The intended high-level workflow is:

1. A citizen registers/signs in and submits a complaint.
2. A supervisor reviews the complaint and assigns it to a crew or department.
3. The crew works on the assigned complaint and updates its status.
4. The supervisor reviews the result and closes the complaint.

The actual state names, permitted transitions, validation rules, and ownership checks should be taken from the domain entities, service layer, and API implementation.

## 9. API conventions and registration endpoint

The backend controller example supplied for registration uses:

```java
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(
            @Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }
}
```

This defines:

```text
POST /api/auth/register
```

A successful registration is intended to return HTTP `201 Created`, with an `AuthResponse` body. The exact request fields, validation rules, response fields, and error format are defined by `RegisterRequest`, `AuthResponse`, and `AuthService`; consult those classes rather than guessing a request payload.

## 10. Running the complete application locally

Start services in this order:

1. Start the Oracle database.
2. Start the Spring Boot backend in IntelliJ IDEA.
3. Confirm that the backend reports Tomcat on port 8080.
4. Open a terminal in `frontend`.
5. Run `npm install` if dependencies are not installed or have changed.
6. Run `npm start`.
7. Open `http://localhost:4200/`.

Keep both application processes running while testing.

## 11. Troubleshooting

### 11.1 API call returns 404 from port 4200

Symptoms:

```text
Request URL: http://localhost:4200/api/...
Status: 404 Not Found
```

Checks:

1. Confirm the backend is running on port 8080.
2. Confirm `frontend/proxy.conf.json` targets `http://localhost:8080`.
3. Start Angular with `npm start`, which loads the proxy file.
4. Confirm the frontend request path matches the controller mapping.
5. Check whether the backend console logs a request when the action is performed.

Interpretation:

- No corresponding backend request: investigate whether the Angular proxy is loaded and whether the request matches its `/api` context.
- Backend logs show the request and a 404: inspect controller mappings, component scanning, HTTP method, and any configured context path.
- Backend returns 401 or 403: investigate Spring Security authentication and authorization rather than the proxy.

### 11.2 Backend startup failure

Check the first meaningful exception in the IntelliJ Run console. Common areas include:

- Incorrect JDK or Java version
- Oracle database unavailable
- Incorrect datasource URL or credentials
- Flyway migration failure
- Port 8080 already occupied
- Missing required environment variables

### 11.3 Oracle connection failure

Validate the host, port, service name, username, and password using Oracle SQL Developer. A JDBC URL that uses the wrong service name can fail even if the database listener is running.

### 11.4 JWT or authentication failure

Verify the configured secret and any token-related properties. Check token expiry, authorization headers, role mapping, and the relevant Spring Security configuration. Do not log or share live tokens or secrets.

### 11.5 Frontend dependency or build failure

Check the Node.js version against the Angular version in the project. Run `npm install` from `frontend` and inspect the first package/build error. Preserve the package lockfile unless there is a deliberate dependency update.

### 11.6 Port conflicts

- Frontend default in this setup: `4200`
- Backend default in this setup: `8080`

If a port is changed, update the corresponding frontend proxy target or backend URL configuration.

## 12. Security and development hygiene

- Do not commit database credentials, JWT secrets, access tokens, or other secrets.
- Do not use production credentials in a local development environment.
- Keep dependencies managed through `pom.xml` and `package.json`.
- Preserve dependency lockfiles in source control.
- Avoid manually modifying Flyway migrations that have already run in shared environments.
- Validate role checks and ownership rules in backend services/controllers; frontend route guards alone are not an authorization boundary.
- Avoid exposing sensitive user or complaint data in logs.

## 13. Useful commands

### Backend

```powershell
# From the backend directory, if Maven Wrapper is included
.\mvnw.cmd clean install
```

Run the Spring Boot main class from IntelliJ IDEA, or use the project's documented Maven run command if configured.

### Frontend

```powershell
# From the frontend directory
npm install
npm start
npm run build
```

## 14. Configuration reference

| Setting | Local development value |
|---|---|
| Frontend URL | `http://localhost:4200/` |
| Backend URL | `http://localhost:8080` |
| Frontend proxy path | `/api` |
| Proxy target | `http://localhost:8080` |
| Backend context path | `/` (as shown in the startup log) |
| Java | 17 |
| Database | Oracle |

Database service name, credentials, JWT secret, exact dependency versions, API request schemas, and production deployment values are environment- and source-specific. Obtain them from the local configuration and the relevant project files; do not copy example credentials or assume example service names are correct.

---

## 15. Further source files to consult

When changing or extending the application, use these files as the authoritative implementation references:

| Concern | Source to inspect |
|---|---|
| Backend dependencies and build | `backend/pom.xml` |
| Spring Boot startup | `PwctApplication.java` |
| Datasource, profiles, JWT properties | `backend/src/main/resources/application*.yml` |
| Database schema changes | Flyway migration scripts |
| Registration request validation | `RegisterRequest.java` |
| Registration response | `AuthResponse.java` |
| Registration business logic | `AuthService` implementation |
| Authentication and authorization | Spring Security configuration and JWT service |
| Frontend scripts and dependencies | `frontend/package.json` |
| Frontend API forwarding | `frontend/proxy.conf.json` |
| Frontend routes and pages | Angular routing and component files |
