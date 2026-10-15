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

- Java 17+
- Maven 3.9+
- Node.js 18+
- Docker & Docker Compose

### 0. Config

```bash
cp .env.example .env
openssl rand -base64 48   # paste into JWT_SECRET
```

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
mvn -pl discovery-server spring-boot:run   # start Eureka first
mvn -pl api-gateway spring-boot:run        # then the rest, separate terminals
mvn -pl identity-service spring-boot:run
mvn -pl catalog-service spring-boot:run
mvn -pl tender-service spring-boot:run
mvn -pl order-service spring-boot:run
mvn -pl file-service spring-boot:run
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
│   ├── pom.xml                 # Parent POM
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
├── docker-compose.yml
└── README.md
```

## Team

Built for MSS301 — FPT University, Fall 2026.