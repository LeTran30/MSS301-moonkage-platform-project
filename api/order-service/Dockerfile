# syntax=docker/dockerfile:1
# Build context = api/  (docker compose sets it; manual: docker build -f order-service/Dockerfile api)

# ── build ──
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /workspace
# every module pom is needed because the parent pom lists all modules
COPY pom.xml .
# jvm.config is required by Error Prone
COPY .mvn/jvm.config .mvn/
COPY discovery-server/pom.xml discovery-server/
COPY api-gateway/pom.xml api-gateway/
COPY identity-service/pom.xml identity-service/
COPY catalog-service/pom.xml catalog-service/
COPY tender-service/pom.xml tender-service/
COPY order-service/pom.xml order-service/
COPY file-service/pom.xml file-service/
COPY order-service/src order-service/src
RUN --mount=type=cache,target=/root/.m2 mvn -B -q -pl order-service -am package -DskipTests -Dspotless.check.skip=true -Dcheckstyle.skip=true

# ── run ──
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --from=build /workspace/order-service/target/order-service-0.0.1-SNAPSHOT.jar app.jar
USER app
EXPOSE 8084
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
