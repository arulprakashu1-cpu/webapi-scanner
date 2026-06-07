"""VirusTotal URL analysis integration."""
import os
import asyncio
import base64
import logging
import httpx

logger = logging.getLogger(__name__)

VT_API_KEY = os.getenv("VIRUSTOTAL_API_KEY", "")
VT_BASE = "https://www.virustotal.com/api/v3"


def _url_id(url: str) -> str:
    return base64.urlsafe_b64encode(url.encode()).rstrip(b"=").decode()


async def analyze_url(url: str) -> dict | None:
    if not VT_API_KEY:
        return None

    headers = {"x-apikey": VT_API_KEY}

    async with httpx.AsyncClient(timeout=30.0) as client:
        # Submit URL
        try:
            resp = await client.post(
                f"{VT_BASE}/urls",
                headers=headers,
                data={"url": url},
            )
            if resp.status_code not in (200, 201, 202):
                logger.warning(f"VT submit failed: {resp.status_code}")
                return None
            analysis_id = resp.json().get("data", {}).get("id")
        except Exception as e:
            logger.warning(f"VT submit error: {e}")
            return None

        if not analysis_id:
            # Try by URL ID directly
            analysis_id = _url_id(url)

        # Poll for results (max 30s)
        for _ in range(10):
            await asyncio.sleep(3)
            try:
                poll = await client.get(
                    f"{VT_BASE}/analyses/{analysis_id}",
                    headers=headers,
                )
                data = poll.json().get("data", {})
                attrs = data.get("attributes", {})
                if attrs.get("status") == "completed":
                    stats = attrs.get("stats", {})
                    results = attrs.get("results", {})

                    malicious = stats.get("malicious", 0)
                    suspicious = stats.get("suspicious", 0)
                    harmless = stats.get("harmless", 0)
                    undetected = stats.get("undetected", 0)

                    if malicious > 0:
                        verdict = "MALICIOUS"
                    elif suspicious > 0:
                        verdict = "SUSPICIOUS"
                    else:
                        verdict = "CLEAN"

                    # Top 5 engine verdicts
                    top_engines = []
                    for engine, result in results.items():
                        cat = result.get("category", "undetected")
                        if cat in ("malicious", "suspicious"):
                            top_engines.append({
                                "engine": engine,
                                "category": cat,
                                "result": result.get("result", ""),
                            })
                    top_engines = sorted(top_engines, key=lambda x: x["category"])[:5]

                    return {
                        "malicious": malicious,
                        "suspicious": suspicious,
                        "harmless": harmless,
                        "undetected": undetected,
                        "verdict": verdict,
                        "top_engines": top_engines,
                    }
            except Exception as e:
                logger.warning(f"VT poll error: {e}")

    return None
