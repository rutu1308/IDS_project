import logging
import pickle
import pandas as pd
import numpy as np
from pymongo import MongoClient
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import confusion_matrix

# ----------------- Logging Configuration -----------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("retrain_model.log"),
        logging.StreamHandler()
    ]
)

# ----------------- MongoDB Connection -----------------
try:
    client = MongoClient("mongodb://localhost:27017/")
    db = client['ids_database']
    packets_collection = db['packets']
    logging.info("Connected to MongoDB successfully!")
except Exception as e:
    logging.error(f"Error connecting to MongoDB: {e}")
    exit(1)

# ----------------- Fetch Data -----------------
logging.info("Fetching packet data from MongoDB...")
packets = list(packets_collection.find())

if not packets:
    logging.error("No data found in the database for training. Ensure the database contains packet data.")
    exit(1)

# Convert the data to a pandas DataFrame
df = pd.DataFrame(packets)

# ----------------- Validate Data -----------------
required_fields = ['src_port', 'dst_port', 'protocol', 'anomaly']
missing_fields = [field for field in required_fields if field not in df.columns]

if missing_fields:
    logging.error(f"Missing required fields in the database: {missing_fields}. Exiting.")
    exit(1)

# ----------------- Feature Preparation -----------------
logging.info("Preparing features and target variable...")

# Ensuring 'protocol' is treated as a categorical variable
df['protocol'] = df['protocol'].astype(str)

features = ['src_port', 'dst_port', 'protocol']
X = df[features]

# One-hot encode the 'protocol' feature
logging.info("One-hot encoding the 'protocol' feature...")
X_encoded = pd.get_dummies(X, columns=["protocol"], dummy_na=True)

# Ensure no null values in the features
if X_encoded.isnull().sum().sum() > 0:
    logging.error("Null values detected in features after encoding. Please clean the data.")
    exit(1)

# Target variable
y = df['anomaly'].astype(int).values

# ----------------- Train-Test Split -----------------
logging.info("Splitting the data into training and test sets...")
X_train, X_test, y_train, y_test = train_test_split(X_encoded, y, test_size=0.2, random_state=42)

# ----------------- Train the Model -----------------
logging.info("Training the Random Forest model...")
model = RandomForestClassifier(n_estimators=200, random_state=42)  # Increased estimators for better accuracy
model.fit(X_train, y_train)

# ----------------- Evaluate the Model -----------------
logging.info("Evaluating the model...")
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
logging.info(f"Model accuracy: {accuracy:.2f}")

classification_report_str = classification_report(y_test, y_pred, target_names=["Normal", "Anomalous"])
logging.info(f"Classification Report:\n{classification_report_str}")

# ----------------- Compute Confusion Matrix -----------------
logging.info("Generating confusion matrix...")

# Predict on test data
y_pred = model.predict(X_test)

# Compute confusion matrix
cm = confusion_matrix(y_test, y_pred)

# Convert confusion matrix to DataFrame for visualization
cm_df = pd.DataFrame(cm, index=["Normal", "Anomalous"], columns=["Predicted Normal", "Predicted Anomalous"])

# Print the confusion matrix
logging.info(f"Confusion Matrix:\n{cm_df}")

# ----------------- Plot Confusion Matrix -----------------
plt.figure(figsize=(6, 5))
sns.heatmap(cm_df, annot=True, fmt="d", cmap="Blues", linewidths=0.5)
plt.xlabel("Predicted Labels")
plt.ylabel("True Labels")
plt.title("Confusion Matrix for IDS Model")
plt.show()

# ----------------- Save the Model -----------------
model_path = "anomaly_detector.pkl"
feature_columns_path = "feature_columns.pkl"

try:
    logging.info(f"Saving the model to {model_path}...")
    with open(model_path, "wb") as f:
        pickle.dump(model, f)

    logging.info(f"Saving feature column names to {feature_columns_path}...")
    with open(feature_columns_path, "wb") as f:
        pickle.dump(X_encoded.columns.tolist(), f)

    logging.info("Model retrained and saved successfully.")

except Exception as e:
    logging.error(f"Error saving the model or feature columns: {e}")
    exit(1)

# ----------------- Summary -----------------
logging.info("Retraining process completed. Model is ready for use.")
