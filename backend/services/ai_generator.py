import os
import json
import re

from groq import Groq

API_KEY = os.getenv("GROQ_API_KEY")

client = Groq(api_key=API_KEY) if API_KEY else None


def generate_questions(text, num_questions, difficulty):

    prompt = f"""
    Generate exactly {num_questions} multiple choice quiz questions
    with difficulty level {difficulty} from the following study material.

    STRICT RULES:
    - Return ONLY valid JSON (no explanation)
    - Each question must have:
        - question (string)
        - options (exactly 4 options)
        - answer (must match one option exactly)

    Format:
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

    # -------------------------
    # FALLBACK (NO API KEY)
    # -------------------------
    if not client:
        return [
            {
                "question": "Sample question: What is 2 + 2?",
                "options": ["1", "2", "3", "4"],
                "answer": "4"
            }
        ]

    try:
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3
)

        response = completion.choices[0].message.content.strip()

        # -------------------------
        # EXTRACT JSON SAFELY
        # -------------------------
        json_match = re.search(r"\[.*\]", response, re.DOTALL)

        if not json_match:
            raise ValueError("No valid JSON found in AI response")

        quiz = json.loads(json_match.group())

        # -------------------------
        # VALIDATE QUESTIONS
        # -------------------------
        valid_quiz = []

        for q in quiz:
            if (
                "question" in q and
                "options" in q and
                "answer" in q and
                isinstance(q["options"], list) and
                len(q["options"]) == 4 and
                q["answer"] in q["options"]
            ):
                valid_quiz.append(q)

        # -------------------------
        # ENSURE MIN QUESTIONS
        # -------------------------
        if len(valid_quiz) == 0:
            raise ValueError("No valid questions generated")

        return valid_quiz[:num_questions]

    except Exception as e:
        print("[AI ERROR]", e)

        # -------------------------
        # FALLBACK SAFE OUTPUT
        # -------------------------
        return [
            {
                "question": "Fallback question: What is 2 + 2?",
                "options": ["1", "2", "3", "4"],
                "answer": "4"
            }
        ]