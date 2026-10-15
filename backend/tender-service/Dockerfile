# syntax=docker/dockerfile:1
# Build context = backend/  (docker compose sets it; manual: docker build -f tender-service/Dockerfile backend)

# ── build ──
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /workspace
# every module pom is needed because the parent pom lists all modules
COPY pom.xml .
COPY discovery-server/pom.xml discovery-server/
COPY api-gateway/pom.xml api-gateway/
COPY identity-service/pom.xml identity-service/
COPY catalog-service/pom.xml catalog-service/
COPY tender-service/pom.xml tender-service/
COPY order-service/pom.xml order-service/
COPY file-service/pom.xml file-service/
COPY tender-service/src tender-service/src
RUN --mount=type=cache,target=/root/.m2 mvn -B -q -pl tender-service -am package -DskipTests

# ── run ──
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --from=build /workspace/tender-service/target/tender-service-0.0.1-SNAPSHOT.jar app.jar
USER app
EXPOSE 8083
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
