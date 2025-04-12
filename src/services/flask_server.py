
import os
import grpc
import pyaudio
import threading
from flask import Flask, Response, stream_with_context
from google.protobuf.struct_pb2 import Struct
from google.protobuf.json_format import MessageToDict
from deep_translator import GoogleTranslator
from dotenv import load_dotenv
import speech_to_text_pb2
import speech_to_text_pb2_grpc

load_dotenv()

# Server settings
SERVER_ADDRESS = os.getenv("SERVER_ADDRESS")
print(f"Using gRPC server address: {SERVER_ADDRESS}")

# Audio settings
CHUNK_SIZE = 160
FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 8000

# Initialize PyAudio (shared instance)
audio = pyaudio.PyAudio()

# Initialize Translator
translator = GoogleTranslator(source='th', target='en')

app = Flask(__name__)

class Voicebot:
    def __init__(self):
        # This event can be used to toggle capturing audio if needed.
        self.start_mic = threading.Event()
        self.start_mic.set()

    def stream_audio(self):
        """
        Capture audio from the microphone and stream it to the gRPC server.
        """
        stream = audio.open(
            format=FORMAT,
            channels=CHANNELS,
            rate=RATE,
            input=True,
            frames_per_buffer=CHUNK_SIZE
        )
        print("Recording started...")
        try:
            while True:
                audio_chunk = stream.read(CHUNK_SIZE, exception_on_overflow=False)
                if self.start_mic.is_set():
                    print("Mic is ON, sending audio data")
                    yield speech_to_text_pb2.ASRAudioChunk(audio_data=audio_chunk)
                else:
                    print("Mic is OFF, sending silent data")
                    yield speech_to_text_pb2.ASRAudioChunk(audio_data=b'\x00' * 320)
        except Exception as e:
            print(f"Audio stream exception: {e}")
        finally:
            print("Recording stopped")
            stream.stop_stream()
            stream.close()

    def stream_translations(self):
        """
        Main client function to send audio and yield translation results as a stream.
        """
        with grpc.insecure_channel(SERVER_ADDRESS) as channel:
            # Connect to the gRPC stub
            stub = speech_to_text_pb2_grpc.SpeechToTextStub(channel)
            json_data = {
                "asr_provider": "google-cloud",
                "asr_language_code": "th-TH",
                "timeout": 30.0,
                "start_timestamp": None
            }
            
            # Send the config to grpc server to initiate session.
            try:
                print("Connecting to gRPC server...")
                _ = stub.GetConfig(speech_to_text_pb2.ASRConfigRequest(json_data=json_data),
                                metadata=[("session_id", "SESSION_TRANSLATE")])
                print("Connection established")
            except Exception as e:
                print(f"Error connecting to gRPC server: {e}")
                yield f"Error connecting to gRPC server: {e}\n"
                return
            
            # Start streaming audio to the server and process responses.
            try:
                print("Starting audio streaming")
                responses = stub.StreamAudio(self.stream_audio(), metadata=[("session_id", "SESSION_TRANSLATE")])
                for response in responses:
                    response_dict = MessageToDict(response.json_result)
                    try:
                        if response_dict.get("is_final", False):
                            # Translate final recognized text.
                            text = response_dict.get('transcript', {}).get('result', {}).get('text', '')
                            if text:
                                translated = translator.translate(text)
                                print(f"TRANSLATED: {translated}")
                                yield f"TRANSLATED: {translated}\n"
                        else:
                            # For partial responses, yield the transcript.
                            partial_text = response_dict.get('transcript', {}).get('result', {}).get('text', '')
                            if partial_text:
                                print(f"Partial: {partial_text}")
                                yield f"{partial_text}\n"
                    except Exception as e:
                        print(f"Translation error: {e}")
                        yield f"Translation error: {e}\n"
            except Exception as e:
                print(f"gRPC streaming error: {e}")
                yield f"gRPC streaming error: {e}\n"

@app.route('/stream')
def stream():
    """
    Endpoint to stream translations. When a client connects, the API starts capturing audio,
    sends it to the gRPC server, translates the result, and streams the output.
    """
    print("Client connected to /stream endpoint")
    voicebot = Voicebot()
    return Response(
        stream_with_context(voicebot.stream_translations()),
        mimetype='text/plain'
    )

@app.route('/')
def index():
    return "Flask Translation Server - Connect to /stream for real-time translations"

if __name__ == "__main__":
    print("Starting Flask server on port 80...")
    app.run(host='0.0.0.0', port=80, threaded=True)
