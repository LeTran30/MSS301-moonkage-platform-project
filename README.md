# 🥮 Bake2B Platform

> B2B2C Mooncake Platform — Microservices Architecture

A comprehensive platform connecting corporate buyers with mooncake vendors through a streamlined tender, order, and production tracking system.

## Architecture

| Component | Tech Stack | Port |
|-----------|-----------|------|
| **Discovery Server** | Spring Cloud Eureka | `8761` |
| **API Gateway** | Spring Cloud Gateway | `8080` |
| **Identity Service** | Spring Boot + JPA + PostgreSQL | `8081` |
| **Catalog Service** | Spring Boot + JPA + PostgreSQL | `8082` |
| **Tender Service** | Spring Boot + JPA + PostgreSQL | `8083` |
| **Order Service** | Spring Boot + JPA + PostgreSQL | `8084` |
| **File Service** | Spring Boot + MinIO (uploads for every service) | `8085` |
| **Web Portal** | React + Vite + TypeScript + TailwindCSS | `5173` |
| **PostgreSQL ×4** | PostgreSQL 17 (Docker), one DB per service | `5441` identity, `5442` catalog, `5443` tender, `5444` order |
| **MinIO** | S3 object storage (Docker) | `9000` API, `9001` console |

## Getting Started

### Prerequisites

- JDK 21+ (Maven is not needed: use the wrapper `./mvnw`)
- Node.js 18+
- Docker & Docker Compose

### 0. Config

```bash
cp .env.example .env
openssl rand -base64 48   # paste into JWT_SECRET, also set ADMIN_PASSWORD
git config core.hooksPath .githooks   # once per clone: enables the pre-commit format/style check
```

Windows: if `git clone` fails with `Filename too long`, run `git config --global core.longpaths true` and clone again.

### Option A: whole backend in Docker

```bash
docker compose up -d --build
docker compose logs -f identity-service   # OTP codes appear here when MAIL_HOST is empty
```

Gateway: `http://localhost:8080`, Eureka: `http://localhost:8761`. Business services are only reachable through the gateway. Swagger UI for all services: `http://localhost:8080/swagger-ui.html` (pick the service top-right, log in via `/api/auth/login`, paste `token` into **Authorize**).

### Option B: databases in Docker, services from the IDE

```bash
docker compose up -d identity-db catalog-db tender-db order-db minio

cd backend
./mvnw -pl discovery-server spring-boot:run   # start Eureka first
./mvnw -pl api-gateway spring-boot:run        # then the rest, separate terminals
./mvnw -pl identity-service spring-boot:run
./mvnw -pl catalog-service spring-boot:run
./mvnw -pl tender-service spring-boot:run
./mvnw -pl order-service spring-boot:run
./mvnw -pl file-service spring-boot:run
```

On Windows `cmd`/PowerShell use `mvnw.cmd` instead of `./mvnw`.

### Code quality (backend)

Spotless (format), Checkstyle and Error Prone run on every build; CI runs the same check on each pull request. Details: [`backend/docs/t0-t1-automation.md`](backend/docs/t0-t1-automation.md).

```bash
cd backend
./mvnw spotless:apply   # auto-format before committing
./mvnw clean verify     # format + Checkstyle + Error Prone + tests, same as CI
```

### Frontend

```bash
cd frontend/web-portal
npm install
npm run dev
```

## Project Structure

```
├── backend/
│   ├── pom.xml                 # Parent POM (Java 21, Spotless, Checkstyle, Error Prone)
│   ├── mvnw, mvnw.cmd          # Maven wrapper
│   ├── config/checkstyle/      # Checkstyle rules
│   ├── <service>/Dockerfile    # one image per service (build context = backend/)
│   ├── discovery-server/       # Eureka Server
│   ├── api-gateway/            # API Gateway
│   ├── identity-service/       # Users, Addresses, Vendors
│   ├── catalog-service/        # Products, Order profiles, Delivery areas, Reviews
│   ├── tender-service/         # Requests, Invitations, Quotes, Season
│   ├── order-service/          # Cart, Orders, Payments, Escrow, Mockups, Disputes, Vouchers
│   └── file-service/           # File uploads on MinIO
├── frontend/
│   └── web-portal/             # React SPA
├── .githooks/pre-commit        # format/style check before each commit
├── .github/workflows/          # CI: Code quality
├── docker-compose.yml
└── README.md
```

## Team

Built for MSS301 — FPT University, Fall 2026.