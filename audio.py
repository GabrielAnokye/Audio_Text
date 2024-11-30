from google.cloud import speech, storage
import os
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "/Users/gabrielanokye/Audio_Text/rosy-booth-442207-u5-1962875ce87a.json"

client = speech.SpeechClient()
with open("/Users/gabrielanokye/Audio_Text/output.wav", "rb") as audio_file:
    audio_content = audio_file.read()

audio = speech.RecognitionAudio(content=audio_content)
config = speech.RecognitionConfig(
    encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
    sample_rate_hertz=16000,
    language_code='en-US',
)

operation = client.long_running_recognize(config=config, audio=audio)

response = client.recognize(config=config, audio=audio)
for result in response.results:
    print(f"Transcript: {result.alternatives[0].transcript}")

# from google.cloud import speech, storage
# import os
# os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "/Users/gabrielanokye/Audio_Text/rosy-booth-442207-u5-1962875ce87a.json"

# def upload(bucket_name, source, destination):
#     storage_client = storage.Client()
#     bucket = storage_client.bucket(bucket_name)
#     blob = bucket.blob(destination)
#     blob.upload_from_filename(source)
#     print(f"File {source} uploaded to {destination}.")
#     return f"gs://{bucket_name}/{destination}"

# bucket_name = "audio_text_bucket"
# source = "/Users/gabrielanokye/Audio_Text/output.wav"
# destination = "output.wav"
# audio_uri = upload(bucket_name, source, destination)

# client = speech.SpeechClient()
# # with open("/Users/gabrielanokye/Audio_Text/output.wav", "rb") as audio_file:
# #     audio_content = audio_file.read()

# audio = speech.RecognitionAudio(content=audio_uri)
# config = speech.RecognitionConfig(
#     encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
#     sample_rate_hertz=16000,
#     language_code='en-US',
# )

# operation = client.long_running_recognize(config=config, audio=audio)

# response = client.recognize(config=config, audio=audio)
# for result in response.results:
#     print(f"Transcript: {result.alternatives[0].transcript}")
