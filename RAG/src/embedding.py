import os
import time
import numpy as np
from google import genai
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

def get_embedding(text: str) -> np.ndarray:
    while True:
        try:
            response = client.models.embed_content(
                model="gemini-embedding-001",
                contents=text
            )
            return np.array(response.embeddings[0].values, dtype="float32")
        except Exception as e:
            err = str(e)
            if "429" in err or "RESOURCE_EXHAUSTED" in err:
                print(f"[RATE LIMIT] Quota hit. Waiting 60s before retrying...")
                time.sleep(60)
            else:
                raise

def get_embeddings_batch(texts: list) -> np.ndarray:
    vectors = []
    for i, text in enumerate(texts):
        vec = get_embedding(text)
        vectors.append(vec)
        time.sleep(0.65)
        if (i + 1) % 10 == 0:
            print(f"[INFO] Embedded {i + 1}/{len(texts)} chunks...")
    return np.array(vectors, dtype="float32")
