import os
import json

from groq import Groq

API_KEY = os.getenv("GROQ_API_KEY")

client = Groq(api_key=API_KEY) if API_KEY else None

def generate_questions(text, num_questions, difficulty):

    prompt = f"""
    Generate {num_questions} multiple choice quiz questions
    with difficulty level {difficulty} from the following study material.

    Each question must contain:

    question
    4 options
    correct answer

    Return ONLY JSON format like this:

    [
      {{
        "question": "...",
        "options": ["A","B","C","D"],
        "answer": "..."
      }}
    ]

    Study Material:
    {text[:4000]}
    """

    if not client:
        # No API key configured; return a placeholder quiz for local development.
        return [
            {
                "question": "Sample question: What is 2 + 2?",
                "options": ["1", "2", "3", "4"],
                "answer": "4"
            }
        ]

    completion = client.chat.completions.create(
        model="llama3-70b-8192",
        messages=[{"role":"user","content":prompt}],
        temperature=0.3
    )

    response = completion.choices[0].message.content

    # Convert AI response string → Python object
    quiz = json.loads(response)

    return quiz