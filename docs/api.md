# NEXUS GUARD — API Documentation

## 1. Overview

NEXUS GUARD uses REST APIs to connect the frontend, Java backend, and Python fraud detection service.

The Java API handles application data, including products, transactions, and incidents. The Python API provides machine-learning-based fraud prediction and explainability.

## 2. Local Service Addresses

| Service | Base URL |
|---|---|
| Frontend | `http://localhost:3000` |
| Java backend | `http://localhost:7070` |
| Python fraud service | `http://localhost:8000` |
| Python interactive API documentation | `http://localhost:8000/docs` |

These addresses are intended for local development.

## 3. Java Backend API

**Technology:** Java 21, Javalin, JDBC, PostgreSQL

Base URL: `http://localhost:7070`

### Health Check

| Property | Value |
|---|---|
| Method | GET |
| Endpoint | `/api/health` |
| Purpose | Check whether the Java backend is running |

Example request:

```http
GET http://localhost:7070/api/health
```

Expected result: a JSON response indicating that the API is running.

### Products

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/products` | Retrieve product records |
| POST | `/api/products` | Create a product |
| PUT / PATCH | Product update route defined by the backend | Update supported product fields |

Product operations communicate with PostgreSQL through the Java backend.

### Transactions

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/transactions` | Retrieve transaction records |
| POST | `/api/transactions` | Submit a transaction record |

The fraud detection workflow can use the Java API to persist transaction information after prediction.

### Incidents

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/incidents` | Retrieve incident records |
| POST | `/api/incidents` | Create an incident |
| PATCH | Incident update route defined by the backend | Update supported incident fields, such as status or notes |

The exact update URL and request body depend on the Java route definitions.

> **Implementation note:** Confirm the precise product and incident update paths, request payloads, and response formats in `backend-java/src/main/java/com/nexusguard/Main.java` before using this document as a formal API contract.

## 4. Python Fraud Detection API

**Technology:** Python, FastAPI, scikit-learn, SHAP

Base URL: `http://localhost:8000`

### Predict Transaction Risk

| Property | Value |
|---|---|
| Method | POST |
| Endpoint | `/api/fraud/predict` |
| Purpose | Analyse transaction features and return fraud prediction information |

Example request:

```http
POST http://localhost:8000/api/fraud/predict
Content-Type: application/json
```

The JSON request body must follow the schema defined by the Python service.

Example response structure, for illustration only:

```json
{
  "risk_score": "<returned risk score>",
  "prediction": "<returned prediction>"
}
```

The actual field names and value types must be confirmed from the response model and endpoint implementation.

### Interactive API Documentation

Open:

`http://localhost:8000/docs`

Use this page to inspect the actual request schema, submit test requests, and review response fields and status codes.

## 5. Fraud Detection Request Flow

1. The frontend submits transaction features to the Python prediction endpoint.
2. The Python service processes the input using the trained model.
3. The service returns prediction information and available explanations.
4. The frontend displays the result.
5. In workflows that persist the transaction, the application sends the appropriate record to the Java backend.
6. The Java backend stores the record and can create an incident when the configured risk criteria are met.

A prediction request alone should not be assumed to save a transaction.

## 6. Database Integration

The Java backend uses JDBC to communicate with PostgreSQL.

Configuration is supplied through environment variables:

- `DB_URL`
- `DB_USER`
- `DB_PASSWORD`

Credentials should remain local and must not be committed to the repository.

## 7. Error Handling and Validation

When testing endpoints, verify:

- The HTTP status code.
- The response body.
- Required request fields.
- Behaviour when a record does not exist.
- Behaviour when invalid data is submitted.
- Whether successful writes persist in PostgreSQL.

The exact validation rules and error responses depend on the implemented endpoints.

## 8. Local Testing Checklist

- [ ] `GET /api/health` returns a successful health response.
- [ ] `GET /api/products` returns product data.
- [ ] Product creation and updates work as implemented.
- [ ] `GET /api/transactions` returns transaction data.
- [ ] Transaction creation persists a record.
- [ ] Fraud prediction returns the expected response structure.
- [ ] Qualifying transactions create incidents through the relevant workflow.
- [ ] Incident updates persist after refreshing the application.
- [ ] Invalid requests are handled appropriately.

## 9. Related Documentation

- [Project README](../README.md)
- [System Architecture](architecture.md)
- [Java Backend](../backend-java/)
- [Python Fraud Service](../fraud-ai/)
