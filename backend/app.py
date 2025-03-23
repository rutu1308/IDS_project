from flask import Flask, jsonify, request, render_template, send_file
from flask_socketio import SocketIO, emit
from pymongo import MongoClient
import subprocess
from collections import Counter
from flask_cors import CORS
import pandas as pd
import threading
import datetime
import pickle
import os
from fpdf import FPDF

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")  # Enable WebSocket communication

# MongoDB connection
client = MongoClient("mongodb://localhost:27017/")
db = client['ids_database']
packets_collection = db['packets']
notifications_collection = db['notifications']

# Load the trained ML model and feature columns
with open("anomaly_detector.pkl", "rb") as f:
    anomaly_model = pickle.load(f)
with open("feature_columns.pkl", "rb") as f:
    feature_columns = pickle.load(f)

# ----------------- Helper Functions -----------------

def run_script(script_name):
    """Run a script in a separate thread."""
    def target():
        try:
            result = subprocess.run(["python", script_name], capture_output=True, text=True)
            if result.returncode != 0:
                print(f"Error running {script_name}: {result.stderr}")
            else:
                print(f"Output of {script_name}: {result.stdout}")
        except Exception as e:
            print(f"Error running {script_name}: {e}")

    thread = threading.Thread(target=target, daemon=True)
    thread.start()

# Function to insert notifications when anomalies are detected
def check_for_anomalies_and_notify(packet):
    try:
        if packet['anomaly']:  # If anomaly is detected
            notification_message = (
                f"🚨 Anomaly detected! Suspicious activity from {packet['src_ip']} to {packet['dst_ip']} "
                f"on port {packet['dst_port']} with protocol {packet['protocol']}."
            )
            notifications_collection.insert_one({
                "message": notification_message,
                "timestamp": datetime.datetime.now()
            })

            # Emit the notification to all connected clients
            socketio.emit("new_notification", {"message": notification_message})

            print("🔔 Real-time notification sent:", notification_message)  # Debugging

    except Exception as e:
        print(f"Error storing notifications: {e}")


def start_background_tasks():
    """Start background processes."""
    print("Starting background tasks...")
    run_script("capture_packets.py")
    run_script("retrain_model.py")

# ----------------- API Endpoints -----------------

@app.route('/')
def index():
    try:
        return render_template('index.html')
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route("/trigger_notification")
def trigger_notification():
    message = "⚠️ Suspicious activity detected!"
    socketio.emit("new_notification", {"message": message})
    return jsonify({"status": "Notification sent"}), 200

@app.route('/api/packets', methods=['GET'])
def get_packets():
    try:
        packets = list(packets_collection.find().sort("timestamp", -1).limit(100))
        for packet in packets:
            packet["_id"] = str(packet["_id"])
            packet['anomaly'] = "Yes" if packet['anomaly'] else "No"
        return jsonify(packets), 200
    except Exception as e:
        print(f"Error fetching packets: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/traffic_analysis', methods=['GET'])
def traffic_analysis():
    try:
        packets = list(packets_collection.find())
        df = pd.DataFrame(packets)

        if df.empty:
            return jsonify({"message": "No data available for analysis"}), 200

        total_packets = len(df)
        total_anomalies = df['anomaly'].sum()

        top_src_ips = Counter(df['src_ip']).most_common(5)
        top_dst_ips = Counter(df['dst_ip']).most_common(5)
        protocol_distribution = df['protocol'].value_counts().to_dict()

        analysis = {
            "total_packets": total_packets,
            "total_anomalies": int(total_anomalies),
            "anomaly_percentage": round((total_anomalies / total_packets) * 100, 2),
            "top_source_ips": top_src_ips,
            "top_destination_ips": top_dst_ips,
            "protocol_distribution": protocol_distribution
        }

        return jsonify(analysis), 200

    except Exception as e:
        print(f"Error in traffic analysis: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/threat_classification', methods=['GET'])
def threat_classification():
    try:
        packets = list(packets_collection.find({"anomaly": True}))
        df = pd.DataFrame(packets)

        if df.empty:
            return jsonify({"message": "No anomalies detected for classification"}), 200

        classifications = []

        for _, row in df.iterrows():
            threat_type = "Unknown"

            if row['dst_port'] in range(20, 25):
                threat_type = "Port Scan"
            elif row['dst_port'] == 22:
                threat_type = "Brute Force SSH"
            elif row['protocol'] == 6 and row['src_ip'] == row['dst_ip']:
                threat_type = "DDoS Attack"

            classifications.append({
                "src_ip": row['src_ip'],
                "dst_ip": row['dst_ip'],
                "dst_port": row['dst_port'],
                "protocol": row['protocol'],
                "threat_type": threat_type
            })

        return jsonify({"classified_threats": classifications}), 200

    except Exception as e:
        print(f"Error in threat classification: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/retrain_model', methods=['POST'])
def retrain_model():
    try:
        result = subprocess.run(["python", "retrain_model.py"], capture_output=True, text=True)

        if result.returncode == 0:
            return jsonify({"message": "Model retrained successfully", "output": result.stdout}), 200
        else:
            print(f"Model retraining failed: {result.stderr}")
            return jsonify({"error": "Model retraining failed", "details": result.stderr}), 500

    except Exception as e:
        print(f"Error in model retraining: {e}")
        return jsonify({"error": str(e)}), 500
@app.route('/api/notifications', methods=['GET'])
def get_notifications():
    try:
        notifications = list(notifications_collection.find().sort("timestamp", -1).limit(5))
        
        if not notifications:
            return jsonify({"message": "No anomalies detected!"}), 200

        # Convert ObjectId to string
        for notification in notifications:
            notification["_id"] = str(notification["_id"])

        return jsonify(notifications), 200

    except Exception as e:
        print(f"Error fetching notifications: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/insert_packet', methods=['POST'])
def insert_packet():
    try:
        data = request.get_json()  # ✅ Ensure JSON is read properly
        if not data:
            return jsonify({"error": "Invalid JSON"}), 400

        # Process and store packet (Example logic)
        print("🔔 Received Packet:", data)

        return jsonify({"message": "Packet inserted successfully!"}), 200
    except Exception as e:
        print("Error inserting packet:", str(e))
        return jsonify({"error": str(e)}), 500

def suggest_preventive_measures(df):
    """
    Suggest preventive measures based on detected attack patterns.
    """
    threats = Counter(df['threat_type']) if 'threat_type' in df else Counter()
    recommendations = []

    if 'DDoS Attack' in threats:
        recommendations.append("1. Enable rate limiting and configure firewalls to block suspicious IPs.")
    if 'Brute Force SSH' in threats:
        recommendations.append("2. Enforce strong SSH passwords and enable two-factor authentication.")
    if 'Port Scan' in threats:
        recommendations.append("3. Block repeated failed connection attempts and implement IDS rules.")

    if not recommendations:
        recommendations.append("No specific threats detected. Maintain regular security audits.")

    return recommendations

@app.route('/generate_report', methods=['GET'])
def generate_report():
    try:
        # Fetch packets data
        packets = list(packets_collection.find())
        df = pd.DataFrame(packets)

        if df.empty:
            return jsonify({"message": "No packets available for report generation"}), 200

        # Extracting stats
        total_packets = len(df)
        anomalies = df['anomaly'].sum() if 'anomaly' in df else 0
        anomaly_percentage = round((anomalies / total_packets) * 100, 2) if total_packets > 0 else 0

        top_src_ips = Counter(df['src_ip']).most_common(5) if 'src_ip' in df else []
        top_dst_ips = Counter(df['dst_ip']).most_common(5) if 'dst_ip' in df else []

        preventive_measures = suggest_preventive_measures(df)

        # Generate PDF Report
        pdf = FPDF()
        pdf.set_auto_page_break(auto=True, margin=15)
        pdf.add_page()
        pdf.set_font("Arial", size=16, style='B')
        pdf.cell(200, 10, txt="Intrusion Detection System - Report", ln=True, align="C")

        pdf.ln(10)
        pdf.set_font("Arial", size=12)
        pdf.cell(200, 10, txt=f"Generated on: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", ln=True)
        pdf.cell(200, 10, txt=f"Total Packets: {total_packets}", ln=True)
        pdf.cell(200, 10, txt=f"Total Anomalies: {anomalies}", ln=True)
        pdf.cell(200, 10, txt=f"Anomaly Percentage: {anomaly_percentage}%", ln=True)
        pdf.ln(10)

        pdf.set_font("Arial", style='B', size=14)
        pdf.cell(200, 10, txt="Top Source IPs:", ln=True)
        pdf.set_font("Arial", size=12)
        for ip, count in top_src_ips:
            pdf.cell(200, 10, txt=f"{ip}: {count} occurrences", ln=True)
        pdf.ln(5)

        pdf.set_font("Arial", style='B', size=14)
        pdf.cell(200, 10, txt="Top Destination IPs:", ln=True)
        pdf.set_font("Arial", size=12)
        for ip, count in top_dst_ips:
            pdf.cell(200, 10, txt=f"{ip}: {count} occurrences", ln=True)
        pdf.ln(10)

        pdf.set_font("Arial", style='B', size=14)
        pdf.cell(200, 10, txt="Recommended Preventive Measures:", ln=True)
        pdf.set_font("Arial", size=12)
        for measure in preventive_measures:
            pdf.multi_cell(0, 10, measure)
        pdf.ln(10)

        # Save and return PDF file
        pdf_output_path = "intrusion_report.pdf"
        pdf.output(pdf_output_path)
        return send_file(pdf_output_path, as_attachment=True)

    except Exception as e:
        print(f"Error generating report: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    start_background_tasks()
    socketio.run(app, debug=True, host="0.0.0.0", port=5000)