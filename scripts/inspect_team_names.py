
import firebase_admin
from firebase_admin import credentials, firestore
import sys
import os

def init_firebase():
    try:
        key_path = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS', 'serviceAccountKey.json')
        cred = credentials.Certificate(key_path)
        firebase_admin.initialize_app(cred)
    except Exception as e:
        pass # Likely already init
    return firestore.client()

db = init_firebase()
docs = db.collection("matches").stream()

teams = set()
for doc in docs:
    d = doc.to_dict()
    t = d.get("team", "")
    if t:
        teams.add(t)

print("Distinct Team Names found in Firestore:")
for t in sorted(teams):
    print(f"- {t}")
