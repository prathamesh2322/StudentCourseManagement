FROM node:22-alpine AS fe
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

FROM maven:3.9-eclipse-temurin-21 AS be
WORKDIR /app/backend
COPY backend/pom.xml .
COPY backend/src ./src
COPY --from=fe /app/backend/src/main/resources/static ./src/main/resources/static
RUN mvn -q clean package -DskipTests

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=be /app/backend/target/scms.jar app.jar
ENV PORT=8080
EXPOSE 8080
CMD ["java", "-jar", "app.jar"]
