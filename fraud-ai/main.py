
from pathlib import Path

import os
import uuid
import psycopg
import joblib
import shap
import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "fraud_model.joblib"

model = joblib.load(MODEL_PATH)
explainer = shap.TreeExplainer(model)

def save_fraud_transaction(
    amount: float,
    risk_score: float,
    risk_level: str,
    is_fraud: bool,
):
    transaction_reference = f"NG-{uuid.uuid4().hex[:12].upper()}"

    with psycopg.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "5432")),
        dbname=os.getenv("DB_NAME", "nexus_guard"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", ""),
    ) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO fraud_transactions (
                    transaction_reference,
                    amount,
                    risk_score,
                    risk_level,
                    status
                )
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id, transaction_reference, created_at
                """,
                (
                    transaction_reference,
                    amount,
                    risk_score,
                    risk_level,
                    "FLAGGED" if is_fraud else "CLEAR",
                ),
            )
            row = cur.fetchone()

    return {
        "id": row[0],
        "transaction_reference": row[1],
        "created_at": row[2].isoformat(),
    }

app = FastAPI(
    title="NEXUS GUARD Fraud Detection API",
    description="Machine learning prototype for transaction risk prediction",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


class Transaction(BaseModel):
    amount: float = Field(gt=0, le=100000000)
    transactions_last_hour: int = Field(ge=0, le=10000)
    account_age_days: int = Field(ge=0, le=100000)
    is_foreign_transaction: bool


@app.get("/")
def home():
    return {
        "message": "NEXUS GUARD Fraud Detection API is running",
        "docs": "/docs",
    }


@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "model_loaded": True,
    }


@app.post("/api/fraud/predict")
def predict_fraud(transaction: Transaction):
    features = pd.DataFrame(
        [
            {
                "amount": transaction.amount,
                "transactions_last_hour": transaction.transactions_last_hour,
                "account_age_days": transaction.account_age_days,
                "is_foreign_transaction": int(
                    transaction.is_foreign_transaction
                ),
            }
        ]
    )

    probabilities = model.predict_proba(features)[0]
    classes = list(model.classes_)
    fraud_index = classes.index(1)

    risk_score = round(float(probabilities[fraud_index]) * 100, 2)
    prediction = int(risk_score >= 45)

    
    # SHAP: explain each feature's contribution to the fraud prediction
    shap_values = explainer.shap_values(features)

    print("SHAP output type:", type(shap_values))
    print("Model classes:", model.classes_)
    print("Fraud class index:", fraud_index)
    print("SHAP output shape:", getattr(shap_values, "shape", "list"))

    if isinstance(shap_values, list):
        fraud_shap_values = shap_values[fraud_index][0]
    else:
        shap_array = getattr(shap_values, "values", shap_values)

        if shap_array.ndim == 3:
            fraud_shap_values = shap_array[0, :, fraud_index]
        elif shap_array.ndim == 2:
            fraud_shap_values = shap_array[0]
        else:
            raise ValueError(
                f"Unexpected SHAP output shape: {shap_array.shape}"
            )

    print("Fraud-class SHAP values:", fraud_shap_values)


    feature_explanations = []

    for feature_name, impact in zip(
        features.columns, fraud_shap_values
    ):
        feature_explanations.append({
            "feature": feature_name,
            "impact": round(float(impact), 4),
            "direction": (
                "increases" if impact > 0
                else "decreases" if impact < 0
                else "neutral"
            ),
        })


        
    if prediction == 1:
        risk_level = "HIGH"
    elif risk_score >= 40:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    risk_factors = []

    if transaction.amount >= 20000:
        risk_factors.append("High transaction amount")

    if transaction.transactions_last_hour >= 8:
        risk_factors.append("Unusually high transaction frequency")

    if transaction.account_age_days <= 7:
        risk_factors.append("Very new account")

    if transaction.is_foreign_transaction:
        risk_factors.append("Foreign transaction")

    if not risk_factors:
        risk_factors.append(
            "No predefined high-risk indicators detected"
        )


    return {
        "is_fraud": bool(prediction),
        "risk_score": risk_score,
        "risk_level": risk_level,
        "risk_factors": risk_factors,
        "feature_explanations": feature_explanations,
        "message": (
            "Suspicious transaction detected"
            if prediction == 1
            else "Transaction classified as non-fraudulent"
        ),
        "disclaimer": (
            "Prototype prediction based on synthetic training data; "
            "not a verified real-world fraud assessment."
        ),
    }
