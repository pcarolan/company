"""Canvas models — viewport and positioning."""

from pydantic import BaseModel


class CanvasPosition(BaseModel):
    x: float
    y: float


class Viewport(BaseModel):
    """The user's current view of the infinite canvas."""
    center_x: float = 0.0
    center_y: float = 0.0
    zoom: float = 1.0
    width: float = 1920.0
    height: float = 1080.0
