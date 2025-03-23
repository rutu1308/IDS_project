from scapy.all import sniff
from pymongo import MongoClient
import datetime
import pickle
import pandas as pd

# ----------------- MongoDB Connection -----------------
try:
    client = MongoClient("mongodb://localhost:27017/")
    db = client['ids_database']
    packets_collection = db['packets']
    print("Connected to MongoDB successfully!")
except Exception as e:
    print(f"Error connecting to MongoDB: {e}")
    exit(1)

# ----------------- Load Machine Learning Model -----------------
try:
    with open("anomaly_detector.pkl", "rb") as model_file:
        anomaly_model = pickle.load(model_file)
    with open("feature_columns.pkl", "rb") as columns_file:
        feature_columns = pickle.load(columns_file)
    print("Model and feature columns loaded successfully!")
except Exception as e:
    print(f"Error loading model or feature columns: {e}")
    exit(1)

# ----------------- Feature Extraction Function -----------------
def extract_features(packet):
    """
    Extracts relevant features from a packet for anomaly detection.
    """
    features = {
        "protocol": None,
        "src_port": None,
        "dst_port": None,
    }

    # Extract IP and protocol information
    if 'IP' in packet:
        features["protocol"] = packet['IP'].proto

    # Extract TCP port information
    if 'TCP' in packet:
        features["src_port"] = packet['TCP'].sport
        features["dst_port"] = packet['TCP'].dport

    # Convert features to DataFrame for prediction
    feature_df = pd.DataFrame([features])
    feature_df_encoded = pd.get_dummies(feature_df, columns=["protocol"], dummy_na=True)

    # Ensure columns match the trained model
    feature_df_encoded = feature_df_encoded.reindex(columns=feature_columns, fill_value=0)

    return feature_df_encoded

# ----------------- Packet Handler -----------------
def packet_handler(packet):
    """
    Processes a captured packet, performs anomaly detection, and stores the result in MongoDB.
    """
    try:
        # Basic packet data
        packet_data = {
            "timestamp": datetime.datetime.now(),
            "src_ip": packet['IP'].src if 'IP' in packet else None,
            "dst_ip": packet['IP'].dst if 'IP' in packet else None,
            "protocol": packet['IP'].proto if 'IP' in packet else None,
            "src_port": packet['TCP'].sport if 'TCP' in packet else None,
            "dst_port": packet['TCP'].dport if 'TCP' in packet else None,
            "payload": bytes(packet.payload).hex() if hasattr(packet, "payload") else None,
        }

        # Extract features and predict anomaly
        feature_df = extract_features(packet)
        if feature_df.empty:
            print("Warning: Empty features, skipping packet.")
            return  # Skip packet if features cannot be extracted

        # Predict anomaly and calculate anomaly score
        is_anomaly = anomaly_model.predict(feature_df)[0]
        anomaly_score = anomaly_model.predict_proba(feature_df)[0][1]  # Probability of anomaly

        # Add results to packet data
        packet_data["anomaly"] = bool(is_anomaly)
        packet_data["anomaly_score"] = float(anomaly_score)

        # Insert the packet data into MongoDB
        packets_collection.insert_one(packet_data)
        print(f"Inserted Packet: {packet_data}")

    except Exception as e:
        print(f"Error processing packet: {e}")

# ----------------- Start Packet Sniffing -----------------
if __name__ == "__main__":
    try:
        print("Starting packet capture. Press Ctrl+C to stop.")
        sniff(prn=packet_handler, filter="tcp", store=0)
    except KeyboardInterrupt:
        print("Packet capture stopped by user.")
    except Exception as e:
        print(f"Error starting packet capture: {e}")
