
from pathlib import Path

import joblib
import pandas as pd

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    roc_auc_score,
)

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "fraud_model.joblib"


def create_training_data(n_samples=2000, random_state=42):
    """Generate synthetic data for a fraud-detection prototype."""
    rng = __import__("numpy").random.default_rng(random_state)

    amount = rng.lognormal(mean=7.0, sigma=1.0, size=n_samples)
    amount = amount.clip(50, 100000)

    transactions_last_hour = rng.poisson(2, n_samples)
    account_age_days = rng.integers(1, 2001, n_samples)
    is_foreign_transaction = rng.binomial(1, 0.12, n_samples)

    # Synthetic rules create patterns for the model to learn.
    risk_signal = (
        (amount > 20000).astype(int) * 2
        + (transactions_last_hour >= 8).astype(int) * 2
        + (account_age_days <= 7).astype(int) * 2
        + is_foreign_transaction * 2
        + (
            (amount > 10000)
            & (transactions_last_hour >= 5)
        ).astype(int) * 2
        + (
            (account_age_days <= 30)
            & (is_foreign_transaction == 1)
        ).astype(int) * 2
    )

    # Add randomness so the labels are not perfectly deterministic.
    fraud_probability = 1 / (1 + __import__("numpy").exp(
        -(risk_signal - 2.5)
    ))
    is_fraud = rng.binomial(1, fraud_probability)

    return pd.DataFrame({
        "amount": amount.round(2),
        "transactions_last_hour": transactions_last_hour,
        "account_age_days": account_age_days,
        "is_foreign_transaction": is_foreign_transaction,
        "is_fraud": is_fraud,
    })



def train():
    data = create_training_data()

    features = [
        "amount",
        "transactions_last_hour",
        "account_age_days",
        "is_foreign_transaction",
    ]

    X = data[features]
    y = data["is_fraud"]

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y,
    )

    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=12,
        min_samples_leaf=3,
        random_state=42,
        class_weight="balanced",
    )

    model.fit(X_train, y_train)

    probabilities = model.predict_proba(X_test)[:, 1]

    print("\n=== Threshold Comparison ===")

    for threshold in [0.35, 0.40, 0.45, 0.50, 0.55, 0.60]:
        threshold_predictions = (
            probabilities >= threshold
        ).astype(int)

        print(f"\nThreshold: {threshold:.2f}")
        print(classification_report(
            y_test,
            threshold_predictions,
            target_names=["Non-fraud", "Fraud"],
            zero_division=0,
        ))

    # Use 0.50 as the baseline threshold for final evaluation.
    predictions = (probabilities >= 0.50).astype(int)

    print("\n=== NEXUS GUARD Model Evaluation ===")
    print(f"Training samples: {len(X_train)}")
    print(f"Testing samples: {len(X_test)}")
    print(f"Accuracy: {accuracy_score(y_test, predictions):.3f}")
    print(f"ROC-AUC: {roc_auc_score(y_test, probabilities):.3f}")

    print("\nClassification report:")
    print(classification_report(
        y_test,
        predictions,
        target_names=["Non-fraud", "Fraud"],
        zero_division=0,
    ))

    print("Confusion matrix:")
    print(confusion_matrix(y_test, predictions))

    joblib.dump(model, MODEL_PATH)
    print(f"\nModel saved to: {MODEL_PATH}")
    print(
        "Note: Results use synthetic data, "
        "not real-world fraud records."
    )


if __name__ == "__main__":
    train()
