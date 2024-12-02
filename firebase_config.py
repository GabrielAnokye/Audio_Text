import firebase_admin
from firebase_admin import credentials, firestore, auth

# Initialize Firebase Admin with your service account key
cred = credentials.Certificate("/Users/gabrielanokye/Desktop/top/Audio_Text/audiotext-5b595-firebase-adminsdk-ajxuk-e2eeef033f.json")
firebase_admin = firebase_admin.initialize_app(cred)
db = firestore.client() 