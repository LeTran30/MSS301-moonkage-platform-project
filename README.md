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
| **Web Portal** | React + Vite + TypeScript + TailwindCSS | `5173` |
| **PostgreSQL** | PostgreSQL 16 (Docker) | `5432` |
| **pgAdmin** | pgAdmin 4 (Docker) | `5050` |

## Getting Started

### Prerequisites

- Java 17+
- Maven 3.9+
- Node.js 18+
- Docker & Docker Compose

### 1. Start Infrastructure

```bash
docker compose up -d
```

This creates 4 databases: `identity_db`, `catalog_db`, `tender_db`, `order_db`.

### 2. Start Backend Services

```bash
cd backend

# Start Eureka first
mvn -pl discovery-server spring-boot:run

# Then start other services (in separate terminals)
mvn -pl api-gateway spring-boot:run
mvn -pl identity-service spring-boot:run
mvn -pl catalog-service spring-boot:run
mvn -pl tender-service spring-boot:run
mvn -pl order-service spring-boot:run
```

### 3. Start Frontend

```bash
cd frontend/web-portal
npm install
npm run dev
```

## Project Structure

```
├── backend/
│   ├── pom.xml                 # Parent POM
│   ├── discovery-server/       # Eureka Server
│   ├── api-gateway/            # API Gateway
│   ├── identity-service/       # Users, Companies, Vendors
│   ├── catalog-service/        # Products, Pricing, Capabilities
│   ├── tender-service/         # Tenders, Invitations, Quotes
│   └── order-service/          # Orders, Payments, Mockups
├── frontend/
│   └── web-portal/             # React SPA
├── infra/
│   └── init-databases.sql      # DB initialization
├── docker-compose.yml
└── README.md
```

## Team

Built for MSS301 — FPT University, Fall 2026.