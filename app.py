from flask import Flask, request, jsonify, render_template, session, redirect, make_response
from flask_cors import CORS
from google.cloud import speech_v1p1beta1 as speech
import cohere
import os
from firebase_admin import auth, firestore
from functools import wraps
from firebase_config import db

app = Flask(__name__)
CORS(app)
app.secret_key = 'your-secret-key-here'  # Replace with a secure secret key

# Configure Google Cloud and Cohere API keys
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "/Users/gabrielanokye/Desktop/top/Audio_Text/rosy-booth-442207-u5-1962875ce87a.json"
COHERE_API_KEY = "eDAnbz2p04jnwpkyNoTjspF9yd8DrP0ebFU7IT1M"
co = cohere.Client(COHERE_API_KEY)

# Authentication decorator
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            # Check if it's an AJAX request by looking for the X-Requested-With header
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return jsonify({'error': 'No authorization header'}), 401
            else:  # If it's a regular page request
                return redirect('/login')
        
        try:
            # Verify the Firebase ID token
            token = auth_header.split('Bearer ')[1]
            decoded_token = auth.verify_id_token(token)
            session['user_id'] = decoded_token['uid']
            return f(*args, **kwargs)
        except Exception as e:
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return jsonify({'error': 'Invalid token'}), 401
            else:  # If it's a regular page request
                return redirect('/login')
            
    return decorated_function

@app.route('/')
def home():
    if 'user_id' not in session:
        return redirect('/login')
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login_page():
    # If already logged in, redirect to home
    if request.method == 'GET' and 'user_id' in session:
        return redirect('/')
        
    if request.method == 'GET':
        return render_template('login.html')
    
    # Handle POST request
    data = request.json
    token = data.get('token')
    
    try:
        decoded_token = auth.verify_id_token(token)
        session['user_id'] = decoded_token['uid']
        return jsonify({'success': True, 'uid': decoded_token['uid']})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 401

@app.route('/signup', methods=['GET', 'POST'])
def signup_page():
    # If already logged in, redirect to home
    if request.method == 'GET' and 'user_id' in session:
        return redirect('/')
        
    if request.method == 'GET':
        return render_template('signup.html')
    
    # Handle POST request
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    try:
        user = auth.create_user(
            email=email,
            password=password
        )
        session['user_id'] = user.uid
        return jsonify({'success': True, 'uid': user.uid})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/logout')
def logout():
    session.clear()
    return redirect('/login')

# Speech-to-text endpoint
@app.route('/transcribe', methods=['POST'])
@login_required
def transcribe():
    try:
        if 'file' not in request.files:
            return jsonify({'success': False, 'message': 'No file uploaded'}), 400
        
        file = request.files['file']
        if not file:
            return jsonify({'success': False, 'message': 'Empty file'}), 400

        # Read the audio file
        audio_content = file.read()
        if not audio_content:
            return jsonify({'success': False, 'message': 'Empty audio content'}), 400

        # Initialize the Speech client
        client = speech.SpeechClient()
        
        # Create the audio object
        audio = speech.RecognitionAudio(content=audio_content)
        
        # Configure the recognition
        config = speech.RecognitionConfig(
            encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
            sample_rate_hertz=16000,
            language_code='en-US',
        )

        # Perform the transcription
        response = client.recognize(config=config, audio=audio)
        
        if not response.results:
            return jsonify({'success': False, 'message': 'No transcription results'}), 400

        # Combine all transcription results
        transcription = ' '.join(result.alternatives[0].transcript 
                               for result in response.results 
                               if result.alternatives)

        if not transcription:
            return jsonify({'success': False, 'message': 'Empty transcription result'}), 400

        # Save transcription to Firestore
        user_id = session.get('user_id')
        doc_ref = db.collection('transcriptions').document()
        doc_ref.set({
            'user_id': user_id,
            'transcription': transcription,
            'timestamp': firestore.SERVER_TIMESTAMP,
            'filename': file.filename
        })

        return jsonify({
            'success': True, 
            'transcription': transcription
        })

    except Exception as e:
        print(f"Transcription error: {str(e)}")  # Log the error
        return jsonify({
            'success': False, 
            'message': f'Transcription error: {str(e)}'
        }), 500

@app.route('/get-transcriptions', methods=['GET'])
@login_required
def get_transcriptions():
    user_id = session.get('user_id')
    
    try:
        # Simplified query without ordering
        transcriptions = []
        docs = db.collection('transcriptions')\
            .where('user_id', '==', user_id)\
            .stream()
        
        for doc in docs:
            data = doc.to_dict()
            # Convert timestamp to string format if it exists
            if data.get('timestamp'):
                data['timestamp'] = data['timestamp'].strftime('%Y-%m-%d %H:%M:%S')
            data['id'] = doc.id
            transcriptions.append(data)
            
        # Sort transcriptions by timestamp in Python instead of Firestore
        transcriptions.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
            
        return jsonify({'success': True, 'transcriptions': transcriptions})
    except Exception as e:
        print(f"Error fetching transcriptions: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/summarize', methods=['POST'])
@login_required
def summarize():
    data = request.json
    text = data.get('text', '')
    print("text", text)
    summary_type = data.get('summary_type', 'normal')  # "normal" or "bullet"

    if not text:
        return jsonify({'success': False, 'message': 'No text provided'}), 400

    try:
        if summary_type == "bullet":
            # Generate bullet-point summary
            response = co.chat(message=f"Generate a concise summary of this text as bullet points\n{text}")
            summary = response.text
        else:
            # Generate normal summary
            response = co.summarize(
                text=text,
                length="short"  # Choose length: "short", "medium", or "long"
            )
            summary = response.summary

        return jsonify({'success': True, 'summary': summary})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    
@app.route('/custom-prompt', methods=['POST'])
@login_required
def custom_prompt():
    data = request.json
    prompt = data.get('prompt', '')
    transcription = data.get('transcription', '')

    if not prompt:
        return jsonify({'success': False, 'message': 'No prompt provided'}), 400

    if not transcription:
        return jsonify({'success': False, 'message': 'No transcription available'}), 400

    try:
        # Combine the transcription and the user's prompt
        full_message = prompt + f"\n{transcription}"
        print(full_message)
        
        # Use Cohere's chat functionality to process the combined input
        response = co.chat(message=full_message)
        output = response.text

        return jsonify({'success': True, 'output': output})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)
