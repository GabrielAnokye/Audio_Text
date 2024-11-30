from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from google.cloud import speech_v1p1beta1 as speech
import cohere
import os

app = Flask(__name__)
CORS(app)

# Configure Google Cloud and Cohere API keys
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "/Users/gabrielanokye/Audio_Text/rosy-booth-442207-u5-1962875ce87a.json"
COHERE_API_KEY = ""
co = cohere.Client(COHERE_API_KEY)

@app.route('/')
def home():
    return render_template('index.html')



# Speech-to-text endpoint
@app.route('/transcribe', methods=['POST'])
def transcribe():
    print("TRANSCRIBE")
    # if 'file' not in request.files:
    #     return jsonify({'success': False, 'message': 'No file uploaded'}), 400
    
    # file = request.files['file']
    # print(file.filename)
    # audio_content = file.read()

    # client = speech.SpeechClient()
    # audio = speech.RecognitionAudio(content=audio_content)
    # config = speech.RecognitionConfig(
    #     encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
    #     sample_rate_hertz=16000,
    #     language_code='en-US',
    # )

    # response = client.recognize(config=config, audio=audio)
    # transcription = ''.join([result.alternatives[0].transcript for result in response.results])
    transcription = """
Artificial Intelligence is an area of computer science that emphasizes the creation of intelligent machines 
that work and react like humans. Some of the activities computers with artificial intelligence are designed 
for include: Speech recognition, Learning, Planning, Problem-solving. Artificial Intelligence is the 
simulation of human intelligence processes by machines, especially computer systems. These processes include 
learning (the acquisition of information and rules for using the information), reasoning (using rules to 
reach approximate or definite conclusions), and self-correction. Particular applications of AI include 
expert systems, speech recognition, and machine vision.
"""

    return jsonify({'success': True, 'transcription': transcription})

@app.route('/summarize', methods=['POST'])
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
