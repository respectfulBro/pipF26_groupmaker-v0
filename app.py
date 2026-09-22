"""GroupMaker v0 — backend.

Serves the roster, randomizes groups, and (in production) serves the
built frontend from frontend/dist.
"""

import csv
import json
import os
import random
from datetime import datetime, timezone

from flask import Flask, jsonify, request, send_from_directory

DIST_DIR = os.path.join(os.path.dirname(__file__), "frontend", "dist")
DATA_FILE = os.path.join(os.path.dirname(__file__), "data", "roster.json")
SURVEY_FILE = os.path.join(os.path.dirname(__file__), "data", "survey_responses.csv")

SURVEY_FIELDS = [
    {"name": "name", "type": "name", "optional": False},
    {
        "name": "school_year",
        "type": "dropdown",
        "optional": False,
        "values": ["First-year", "Sophomore", "Junior", "Senior", "Other"],
    },
    {"name": "working_style", "type": "text", "optional": False},
]
SURVEY_COLUMNS = [field["name"] for field in SURVEY_FIELDS]
SURVEY_HEADER = SURVEY_COLUMNS + ["submitted_at"]

app = Flask(__name__, static_folder=None)


def load_roster():
    with open(DATA_FILE, encoding="utf-8") as f:
        return json.load(f)


@app.get("/api/roster")
def get_roster():
    return jsonify(load_roster())


@app.post("/api/groups/randomize")
def randomize_groups():
    body = request.get_json(silent=True) or {}
    group_size = int(body.get("group_size", 10))
    group_size = max(2, min(group_size, 10))

    students = load_roster()["students"]
    random.shuffle(students)

    groups = [students[i : i + group_size] for i in range(0, len(students), group_size)]

    # Fold a too-small last group into the others, one member each.
    if len(groups) > 1 and len(groups[-1]) < max(2, group_size - 1):
        leftovers = groups.pop()
        for i, student in enumerate(leftovers):
            groups[i % len(groups)].append(student)

    return jsonify({"groups": [{"number": i + 1, "members": g} for i, g in enumerate(groups)]})


@app.post("/api/survey")
def submit_survey():
    body = request.get_json(silent=True) or {}
    roster_names = {student["name"] for student in load_roster()["students"]}
    missing = []
    errors = []
    row = {}

    for field in SURVEY_FIELDS:
        raw = body.get(field["name"])
        if field["type"] == "multi-select":
            values = raw if isinstance(raw, list) else []
            values = [str(v).strip() for v in values if str(v).strip()]
            if not values and not field["optional"]:
                missing.append(field["name"])
            allowed = set(field.get("values") or [])
            if values and allowed and any(v not in allowed for v in values):
                errors.append(f"invalid {field['name']}")
            row[field["name"]] = "; ".join(values)
            continue

        value = "" if raw is None else str(raw).strip()
        if not value and not field["optional"]:
            missing.append(field["name"])
            row[field["name"]] = value
            continue

        if field["type"] == "name" and value and value not in roster_names:
            errors.append("name must match a student on the roster")
        if field["type"] in ("dropdown", "scale") and value:
            allowed = field.get("values") or []
            if value not in {str(v) for v in allowed}:
                errors.append(f"invalid {field['name']}")
        row[field["name"]] = value

    if missing or errors:
        return jsonify(
            {
                "error": "Survey was not saved. Fix the highlighted issues and try again.",
                "missing": missing,
                "errors": errors,
            }
        ), 400

    row["submitted_at"] = datetime.now(timezone.utc).isoformat()
    os.makedirs(os.path.dirname(SURVEY_FILE), exist_ok=True)
    write_header = not os.path.isfile(SURVEY_FILE) or os.path.getsize(SURVEY_FILE) == 0
    with open(SURVEY_FILE, "a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=SURVEY_HEADER)
        if write_header:
            writer.writeheader()
        writer.writerow(row)

    return jsonify({"ok": True})


# ---- Serve the built frontend (production) ----------------------------------
# In development you won't use these routes: Vite serves the frontend at
# localhost:5173 and proxies /api requests here.


@app.get("/")
def index():
    return send_from_directory(DIST_DIR, "index.html")


@app.get("/<path:path>")
def assets(path):
    full = os.path.join(DIST_DIR, path)
    if os.path.isfile(full):
        return send_from_directory(DIST_DIR, path)
    return send_from_directory(DIST_DIR, "index.html")


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8000, debug=True)
