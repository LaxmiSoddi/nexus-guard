# NEXUS GUARD — Testing Documentation

## 1. Purpose

This document describes the manual testing approach for NEXUS GUARD, an e-commerce fraud detection and inventory management prototype.

Testing focuses on frontend functionality, REST API integration, database persistence, fraud prediction, incident management, and Kafka configuration.

## 2. Test Environment

| Component | Configuration |
|---|---|
| Frontend | Next.js, React, TypeScript |
| Java backend | Java 21, Javalin |
| Fraud service | Python, FastAPI, scikit-learn |
| Database | PostgreSQL |
| Event messaging | Apache Kafka |
| Frontend address | `http://localhost:3000` |
| Java API | `http://localhost:7070` |
| Python API documentation | `http://localhost:8000/docs` |

All services should be configured and running before performing end-to-end tests.

## 3. Manual Test Cases

| ID | Test case | Expected result |
|---|---|---|
| TC-01 | Open the dashboard | Dashboard loads without a runtime error |
| TC-02 | Open the inventory page | Product records are displayed |
| TC-03 | Create or update a product | Supported changes persist in PostgreSQL |
| TC-04 | Submit transaction features for fraud prediction | Python API returns prediction information |
| TC-05 | Submit a transaction through the Java API | Transaction is stored in PostgreSQL |
| TC-06 | Submit a qualifying high-risk transaction through the integrated workflow | Transaction is saved and an incident is created |
| TC-07 | Update an incident's status or notes | Changes persist after refreshing the page |
| TC-08 | Open the Python API documentation | FastAPI documentation loads |
| TC-09 | Check the Java health endpoint | API reports that it is running |
| TC-10 | Verify Kafka topics | Configured topics are available |
| TC-11 | Run the TypeScript check | No TypeScript errors are reported |
| TC-12 | Run the production build | Next.js build completes successfully |

## 4. Test Results

Record the result of each test after running it in the local environment.

| Test ID | Status | Notes |
|---|---|---|
| TC-01 | Pending re-verification | Check dashboard startup |
| TC-02 | Pending re-verification | Check product loading |
| TC-03 | Pending re-verification | Verify persistence |
| TC-04 | Pending re-verification | Check prediction response |
| TC-05 | Pending re-verification | Verify database record |
| TC-06 | Pending re-verification | Verify transaction and incident |
| TC-07 | Pending re-verification | Refresh and check saved changes |
| TC-08 | Pending re-verification | Open `/docs` |
| TC-09 | Pending re-verification | Call `/api/health` |
| TC-10 | Pending re-verification | Inspect Kafka topics and event flow |
| TC-11 | Pending re-verification | Run TypeScript check |
| TC-12 | Pending re-verification | Run production build |

Update each status to **PASS** or **FAIL** only after performing the corresponding test. Add a brief note describing any failure and its resolution.

## 5. Frontend Validation

From the project root, run:

```powershell
npx tsc --noEmit
npm run build
```

The TypeScript check validates types, while the production build checks whether Next.js can produce a build with the current configuration.

A successful build does not prove that every API integration or user workflow works correctly.

## 6. Backend Validation

### Java API

Open the health endpoint:

`http://localhost:7070/api/health`

Verify that the response indicates the backend is running.

Test product, transaction, and incident operations through the implemented routes. Confirm successful database writes by retrieving the affected records or checking PostgreSQL.

### Python Fraud Service

Open:

`http://localhost:8000/docs`

Submit a prediction request using the actual schema documented by FastAPI. Verify the returned prediction, score, and explanation fields.

### PostgreSQL

Check that created transactions, products, and incidents remain available after refreshing the application or restarting the relevant service.

### Kafka

Verify that the expected topics exist:

- `transaction-events`
- `fraud-alerts`

Where applicable, verify actual message publication and consumption. The existence of a topic alone does not prove that events are being processed successfully.

## 7. Machine-Learning Evaluation

Fraud model evaluation should use a held-out test dataset that was not used to train the model.

Useful metrics include:

- **Precision:** How many predicted fraud cases are actually fraud in the labelled test data?
- **Recall:** How many actual fraud cases does the model identify?
- **F1-score:** A combined measure of precision and recall.
- **Confusion matrix:** Counts of true positives, false positives, true negatives, and false negatives.

Because the current model uses synthetic data, its evaluation results should not be interpreted as proof of real-world fraud detection performance.

## 8. Known Limitations

- The current fraud model is a prototype trained on synthetic data.
- Manual tests do not replace automated integration and regression tests.
- Successful API responses do not guarantee that every edge case is handled correctly.
- Kafka topic availability does not guarantee successful event delivery or processing.
- Production security, authentication, authorisation, monitoring, and deployment need separate validation.

## 9. Conclusion

This test plan provides a repeatable checklist for verifying the main NEXUS GUARD workflows. Test results should be recorded only after the relevant checks have been executed in the local environment.
