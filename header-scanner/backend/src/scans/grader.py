"""Grade calculation matching securityheaders.com logic."""
from typing import List


def calculate_grade(findings: list, reachable: bool) -> tuple[str, dict]:
    """
    Returns (grade, counts) where counts = {critical, high, medium, low, info}.
    """
    if not reachable:
        return "F", {"critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0}

    counts = {"critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0}
    missing_critical = 0
    missing_high = 0
    missing_medium = 0
    info_leaks = 0

    for f in findings:
        sev = f["severity"].lower()
        status = f["status"]

        if status == "missing":
            counts[sev] = counts.get(sev, 0) + 1
            if sev == "critical":
                missing_critical += 1
            elif sev == "high":
                missing_high += 1
            elif sev == "medium":
                missing_medium += 1
            elif sev == "low":
                counts["low"] += 0  # already counted
            elif sev == "info":
                counts["info"] += 0

        elif status == "info_leak":
            counts["info"] = counts.get("info", 0) + 1
            info_leaks += 1

        elif status in ("present", "not_present", "absent"):
            pass  # good or neutral

    # Grading logic
    if missing_critical >= 2 and missing_high >= 2:
        grade = "F"
    elif missing_critical >= 2:
        grade = "D"
    elif missing_critical == 1:
        grade = "C"
    elif missing_high >= 2:
        grade = "B"
    elif missing_high == 1:
        grade = "B"
    elif missing_medium == 0 and info_leaks == 0:
        grade = "A+"
    elif missing_medium <= 1:
        grade = "A"
    else:
        grade = "A"

    return grade, counts
