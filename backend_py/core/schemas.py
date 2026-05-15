from pydantic import BaseModel
from typing import Any


class AnalyzePayload(BaseModel):
    siteId: str | None = None
    dailyLog: str | None = None
    schedule: dict[str, Any] | None = None
    weatherData: dict[str, Any] | None = None


class CameraRegisterRequest(BaseModel):
    camera_id: str
    rtsp_url: str
    site_id: str = 'site-a'
    sample_interval_seconds: int | None = None


class SnapshotMetadata(BaseModel):
    siteId: str | None = None
    dailyLog: str | None = None
    schedule: dict[str, Any] | None = None
    weatherData: dict[str, Any] | None = None
