import json
import re
from typing import Any


def extract_json(value: str) -> Any:
    text = (value or '').strip()
    text = re.sub(r'^```(?:json)?', '', text, flags=re.IGNORECASE).strip()
    text = re.sub(r'```$', '', text).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r'(\{.*\}|\[.*\])', text, flags=re.DOTALL)
        if not match:
            raise
        return json.loads(match.group(1))
