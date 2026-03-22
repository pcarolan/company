"""WebSocket endpoint for real-time canvas updates."""

from __future__ import annotations

import asyncio
import json
from typing import Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from ..services import CompanyState

ws_router = APIRouter()

# shared state — injected from main
state: CompanyState = CompanyState()
connections: list[WebSocket] = []


def set_state(s: CompanyState) -> None:
    global state
    state = s


async def broadcast(message: dict[str, Any]) -> None:
    """Send a message to all connected clients."""
    dead: list[WebSocket] = []
    for ws in connections:
        try:
            await ws.send_json(message)
        except Exception:
            dead.append(ws)
    for ws in dead:
        connections.remove(ws)


@ws_router.websocket("/ws")
async def canvas_ws(websocket: WebSocket):
    await websocket.accept()
    connections.append(websocket)

    # send initial state
    await websocket.send_json({
        "type": "init",
        "data": state.get_canvas_state(),
    })

    try:
        while True:
            raw = await websocket.receive_text()
            msg = json.loads(raw)
            await handle_client_message(msg, websocket)
    except WebSocketDisconnect:
        if websocket in connections:
            connections.remove(websocket)


async def handle_client_message(msg: dict, ws: WebSocket) -> None:
    """Handle messages from the frontend canvas."""
    msg_type = msg.get("type", "")

    if msg_type == "move_agent":
        agent_id = msg.get("agent_id", "")
        x = msg.get("x", 0)
        y = msg.get("y", 0)
        state.move_agent(agent_id, x, y)
        await broadcast({
            "type": "agent_moved",
            "data": {"agent_id": agent_id, "x": x, "y": y},
        })

    elif msg_type == "set_thinking":
        agent_id = msg.get("agent_id", "")
        thinking = msg.get("thinking")
        state.set_thinking(agent_id, thinking)
        await broadcast({
            "type": "agent_thinking",
            "data": {"agent_id": agent_id, "thinking": thinking},
        })

    elif msg_type == "send_message":
        from_id = msg.get("from_id", "")
        to_id = msg.get("to_id", "")
        text = msg.get("text", "")
        event = state.send_message(from_id, to_id, text)
        if event:
            await broadcast({
                "type": "agent_message",
                "data": {
                    "id": event.id,
                    "from_id": from_id,
                    "to_id": to_id,
                    "from_name": event.data.get("from_name", ""),
                    "to_name": event.data.get("to_name", ""),
                    "text": text,
                    "event": event.model_dump(mode="json"),
                },
            })

    elif msg_type == "ping":
        await ws.send_json({"type": "pong"})
