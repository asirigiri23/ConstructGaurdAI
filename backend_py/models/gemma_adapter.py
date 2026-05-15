import base64
import os
import time
from io import BytesIO
from typing import Any

from PIL import Image

from core.json_utils import extract_json


class GemmaAdapter:
    def __init__(self) -> None:
        self.model_id = os.getenv('GEMMA_MODEL_ID', 'google/gemma-3-4b-it')
        self.load_on_startup = os.getenv('GEMMA_LOAD_ON_STARTUP', 'false').lower() == 'true'
        self.max_new_tokens = int(os.getenv('GEMMA_MAX_NEW_TOKENS', '1024'))
        self._processor = None
        self._model = None
        self._pipeline = None
        if self.load_on_startup:
            self.load()

    @property
    def available(self) -> bool:
        return self._pipeline is not None or self._model is not None

    def load(self) -> None:
        if self.available:
            return
        try:
            import torch
            from transformers import AutoModelForImageTextToText, AutoProcessor, pipeline

            dtype = os.getenv('GEMMA_DTYPE', 'auto')
            torch_dtype = torch.bfloat16 if dtype == 'bfloat16' else 'auto'
            self._processor = AutoProcessor.from_pretrained(self.model_id)
            self._model = AutoModelForImageTextToText.from_pretrained(
                self.model_id,
                device_map=os.getenv('GEMMA_DEVICE', 'auto'),
                torch_dtype=torch_dtype,
            )
            self._pipeline = pipeline(
                'image-text-to-text',
                model=self._model,
                processor=self._processor,
            )
        except Exception as exc:
            self._processor = None
            self._model = None
            self._pipeline = None
            raise RuntimeError(f'Could not load local Gemma model {self.model_id}: {exc}') from exc

    def status(self) -> dict[str, Any]:
        return {
            'model_id': self.model_id,
            'provider': os.getenv('GEMMA_PROVIDER', 'local_hf'),
            'loaded': self.available,
            'load_on_startup': self.load_on_startup,
            'device': os.getenv('GEMMA_DEVICE', 'auto'),
            'dtype': os.getenv('GEMMA_DTYPE', 'auto'),
            'max_new_tokens': self.max_new_tokens,
        }

    def load_with_timing(self) -> dict[str, Any]:
        started = time.perf_counter()
        self.load()
        elapsed_ms = int((time.perf_counter() - started) * 1000)
        result = self.status()
        result['load_time_ms'] = elapsed_ms
        return result

    def analyze_image(self, image_base64: str, mime_type: str, prompt: str) -> dict[str, Any]:
        if not self.available:
            self.load()
        image = Image.open(BytesIO(base64.b64decode(image_base64))).convert('RGB')
        messages = [{
            'role': 'user',
            'content': [
                {'type': 'image', 'image': image},
                {'type': 'text', 'text': prompt},
            ],
        }]
        output = self._pipeline(text=messages, max_new_tokens=self.max_new_tokens, do_sample=False)
        text = self._extract_text(output)
        return extract_json(text)

    def analyze_text(self, prompt: str) -> dict[str, Any]:
        if not self.available:
            self.load()
        messages = [{'role': 'user', 'content': [{'type': 'text', 'text': prompt}]}]
        output = self._pipeline(text=messages, max_new_tokens=self.max_new_tokens, do_sample=False)
        text = self._extract_text(output)
        return extract_json(text)

    def _extract_text(self, output: Any) -> str:
        if isinstance(output, list) and output:
            item = output[0]
            if isinstance(item, dict):
                generated = item.get('generated_text') or item.get('text') or item
                if isinstance(generated, list) and generated:
                    content = generated[-1].get('content', '')
                    if isinstance(content, list):
                        return ''.join(part.get('text', '') for part in content if isinstance(part, dict))
                    return str(content)
                return str(generated)
        return str(output)


gemma = GemmaAdapter()
