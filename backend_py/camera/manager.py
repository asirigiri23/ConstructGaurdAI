import base64
import os
import threading
import time
from datetime import datetime, timezone
from typing import Any

import cv2

from agents.orchestrator import run_all_agents


class CameraManager:
    def __init__(self) -> None:
        self.cameras: dict[str, dict[str, Any]] = {}
        self._threads: dict[str, threading.Thread] = {}
        self._stop_events: dict[str, threading.Event] = {}
        self.default_interval = int(os.getenv('CAMERA_SAMPLE_INTERVAL_SECONDS', '30'))

    def register(self, camera_id: str, rtsp_url: str, site_id: str, sample_interval_seconds: int | None = None) -> dict[str, Any]:
        self.cameras[camera_id] = {
            'camera_id': camera_id,
            'rtsp_url': rtsp_url,
            'site_id': site_id,
            'sample_interval_seconds': sample_interval_seconds or self.default_interval,
            'running': False,
            'last_frame_time': None,
            'last_analysis': None,
            'last_error': None,
        }
        return self.safe_camera(camera_id)

    def list(self) -> list[dict[str, Any]]:
        return [self.safe_camera(camera_id) for camera_id in self.cameras]

    def safe_camera(self, camera_id: str) -> dict[str, Any]:
        camera = dict(self.cameras[camera_id])
        if camera.get('rtsp_url'):
            camera['rtsp_url'] = self._mask_url(camera['rtsp_url'])
        return camera

    def start(self, camera_id: str) -> dict[str, Any]:
        if camera_id not in self.cameras:
            raise KeyError(camera_id)
        if self.cameras[camera_id]['running']:
            return self.safe_camera(camera_id)
        stop_event = threading.Event()
        self._stop_events[camera_id] = stop_event
        thread = threading.Thread(target=self._poll_loop, args=(camera_id, stop_event), daemon=True)
        self._threads[camera_id] = thread
        self.cameras[camera_id]['running'] = True
        self.cameras[camera_id]['last_error'] = None
        thread.start()
        return self.safe_camera(camera_id)

    def stop(self, camera_id: str) -> dict[str, Any]:
        if camera_id not in self.cameras:
            raise KeyError(camera_id)
        event = self._stop_events.get(camera_id)
        if event:
            event.set()
        self.cameras[camera_id]['running'] = False
        return self.safe_camera(camera_id)

    def analyze_snapshot(self, camera_id: str, image_bytes: bytes, mime_type: str, site_id: str | None = None, metadata: dict[str, Any] | None = None) -> dict[str, Any]:
        encoded = base64.b64encode(image_bytes).decode('utf-8')
        payload = {
            'imageBase64': encoded,
            'imageMimeType': mime_type,
            'siteId': site_id or camera_id,
            'dailyLog': (metadata or {}).get('dailyLog'),
            'schedule': (metadata or {}).get('schedule'),
            'weatherData': (metadata or {}).get('weatherData'),
        }
        result = run_all_agents(payload)
        if camera_id in self.cameras:
            self.cameras[camera_id]['last_frame_time'] = datetime.now(timezone.utc).isoformat()
            self.cameras[camera_id]['last_analysis'] = result
            self.cameras[camera_id]['last_error'] = None
        return result

    def _poll_loop(self, camera_id: str, stop_event: threading.Event) -> None:
        while not stop_event.is_set():
            camera = self.cameras[camera_id]
            try:
                frame_bytes = self._capture_frame(camera['rtsp_url'])
                self.analyze_snapshot(camera_id, frame_bytes, 'image/jpeg', camera['site_id'])
            except Exception as exc:
                camera['last_error'] = str(exc)
            stop_event.wait(camera['sample_interval_seconds'])
        self.cameras[camera_id]['running'] = False

    def _capture_frame(self, rtsp_url: str) -> bytes:
        capture = cv2.VideoCapture(rtsp_url)
        try:
            if not capture.isOpened():
                raise RuntimeError('Could not open RTSP stream')
            ok, frame = capture.read()
            if not ok or frame is None:
                raise RuntimeError('Could not read frame from RTSP stream')
            ok, buffer = cv2.imencode('.jpg', frame)
            if not ok:
                raise RuntimeError('Could not encode frame')
            return buffer.tobytes()
        finally:
            capture.release()

    def _mask_url(self, url: str) -> str:
        if '@' not in url:
            return url
        scheme, rest = url.split('://', 1) if '://' in url else ('rtsp', url)
        host = rest.split('@', 1)[1]
        return f'{scheme}://***:***@{host}'


camera_manager = CameraManager()
