"""Real HTTP header fetching and analysis engine."""
import json
import httpx
from urllib.parse import urlparse

HEADER_DEFINITIONS = [
    {
        "name": "Strict-Transport-Security",
        "severity": "Critical",
        "standard": "OWASP A05:2021",
        "type": "security",
        "description": (
            "HTTP Strict Transport Security (HSTS) tells browsers to only communicate with "
            "the server via HTTPS, preventing protocol downgrade attacks and cookie hijacking."
        ),
        "payload": "Strict-Transport-Security: max-age=31536000; includeSubDomains; preload",
        "remediation": (
            "Add the Strict-Transport-Security header with max-age of at least 1 year (31536000 seconds). "
            "Include 'includeSubDomains' to protect all subdomains. "
            "Add 'preload' and submit to the HSTS preload list for maximum protection."
        ),
        "reference_links": [
            "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security",
            "https://owasp.org/www-project-secure-headers/#strict-transport-security",
        ],
    },
    {
        "name": "Content-Security-Policy",
        "severity": "Critical",
        "standard": "OWASP A05:2021",
        "type": "security",
        "description": (
            "Content Security Policy (CSP) prevents cross-site scripting (XSS), data injection attacks, "
            "and clickjacking by controlling which resources the browser is permitted to load."
        ),
        "payload": "Content-Security-Policy: default-src 'self'; script-src 'self'; object-src 'none'",
        "remediation": (
            "Implement a Content-Security-Policy header. Start with a restrictive policy: "
            "`Content-Security-Policy: default-src 'self'`. "
            "Use a CSP evaluator tool to refine without breaking functionality. "
            "Avoid 'unsafe-inline' and 'unsafe-eval'."
        ),
        "reference_links": [
            "https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP",
            "https://csp-evaluator.withgoogle.com/",
            "https://owasp.org/www-project-secure-headers/#content-security-policy",
        ],
    },
    {
        "name": "X-Frame-Options",
        "severity": "High",
        "standard": "OWASP A05:2021",
        "type": "security",
        "description": (
            "X-Frame-Options prevents clickjacking attacks by controlling whether your page can be "
            "embedded in an iframe. Note: CSP frame-ancestors is the modern replacement."
        ),
        "payload": "X-Frame-Options: DENY",
        "remediation": (
            "Add `X-Frame-Options: DENY` to prevent all iframe embedding, or use "
            "`X-Frame-Options: SAMEORIGIN` to allow embedding only from the same origin. "
            "For modern browsers, prefer `Content-Security-Policy: frame-ancestors 'none'`."
        ),
        "reference_links": [
            "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options",
            "https://owasp.org/www-project-secure-headers/#x-frame-options",
        ],
    },
    {
        "name": "X-Content-Type-Options",
        "severity": "High",
        "standard": "OWASP A05:2021",
        "type": "security",
        "description": (
            "X-Content-Type-Options: nosniff prevents browsers from MIME-sniffing a response away from "
            "the declared content-type, blocking attacks that exploit MIME type confusion."
        ),
        "payload": "X-Content-Type-Options: nosniff",
        "remediation": (
            "Add `X-Content-Type-Options: nosniff` to all responses. "
            "This is a one-liner fix with no negative side effects for well-configured servers."
        ),
        "reference_links": [
            "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options",
            "https://owasp.org/www-project-secure-headers/#x-content-type-options",
        ],
    },
    {
        "name": "Referrer-Policy",
        "severity": "Medium",
        "standard": "OWASP A01:2021",
        "type": "security",
        "description": (
            "Referrer-Policy controls how much referrer information is included with requests. "
            "Without it, sensitive URL parameters may leak to third-party sites."
        ),
        "payload": "Referrer-Policy: strict-origin-when-cross-origin",
        "remediation": (
            "Add `Referrer-Policy: strict-origin-when-cross-origin` as a good default. "
            "Use `no-referrer` for maximum privacy, or `same-origin` to send the full URL only to same-origin requests."
        ),
        "reference_links": [
            "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy",
            "https://owasp.org/www-project-secure-headers/#referrer-policy",
        ],
    },
    {
        "name": "Permissions-Policy",
        "severity": "Medium",
        "standard": "OWASP A05:2021",
        "type": "security",
        "description": (
            "Permissions-Policy (formerly Feature-Policy) allows you to selectively enable, disable, "
            "or modify browser features and APIs. Prevents unauthorized use of powerful APIs like camera, "
            "microphone, and geolocation."
        ),
        "payload": "Permissions-Policy: geolocation=(), microphone=(), camera=()",
        "remediation": (
            "Add a Permissions-Policy header disabling features you don't use. "
            "Example: `Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=()`. "
            "Review the full list of controllable features and disable all non-essential ones."
        ),
        "reference_links": [
            "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Permissions-Policy",
            "https://www.permissionspolicy.com/",
        ],
    },
    {
        "name": "Cross-Origin-Embedder-Policy",
        "severity": "Medium",
        "standard": "OWASP A05:2021",
        "type": "security",
        "description": (
            "Cross-Origin-Embedder-Policy (COEP) prevents a document from loading cross-origin resources "
            "that don't explicitly grant permission, enabling powerful features like SharedArrayBuffer."
        ),
        "payload": "Cross-Origin-Embedder-Policy: require-corp",
        "remediation": (
            "Add `Cross-Origin-Embedder-Policy: require-corp` along with COOP. "
            "Ensure all cross-origin resources either set CORP or CORS headers. "
            "Test thoroughly as this may break cross-origin resource loading."
        ),
        "reference_links": [
            "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Embedder-Policy",
        ],
    },
    {
        "name": "Cross-Origin-Opener-Policy",
        "severity": "Medium",
        "standard": "OWASP A05:2021",
        "type": "security",
        "description": (
            "Cross-Origin-Opener-Policy (COOP) allows you to ensure a top-level document does not share "
            "a browsing context group with cross-origin documents, preventing cross-origin attacks."
        ),
        "payload": "Cross-Origin-Opener-Policy: same-origin",
        "remediation": (
            "Add `Cross-Origin-Opener-Policy: same-origin` to isolate your origin. "
            "Use `same-origin-allow-popups` if you need cross-origin popup functionality."
        ),
        "reference_links": [
            "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Opener-Policy",
        ],
    },
    {
        "name": "Cross-Origin-Resource-Policy",
        "severity": "Medium",
        "standard": "OWASP A05:2021",
        "type": "security",
        "description": (
            "Cross-Origin-Resource-Policy (CORP) prevents other origins from reading the response body "
            "of the annotated resource, protecting against cross-origin information leaks."
        ),
        "payload": "Cross-Origin-Resource-Policy: same-origin",
        "remediation": (
            "Add `Cross-Origin-Resource-Policy: same-origin` to restrict resource access to the same origin. "
            "Use `same-site` for same-site cross-origin requests, or `cross-origin` for public resources."
        ),
        "reference_links": [
            "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Resource-Policy",
        ],
    },
    {
        "name": "Cache-Control",
        "severity": "Low",
        "standard": "OWASP A02:2021",
        "type": "security",
        "description": (
            "Cache-Control directives control caching behavior for sensitive responses. "
            "Without it, browsers may cache sensitive data that could be accessed by other users "
            "on shared devices."
        ),
        "payload": "Cache-Control: no-store, no-cache, must-revalidate",
        "remediation": (
            "For pages with sensitive data, add `Cache-Control: no-store` to prevent caching. "
            "For public static assets, configure appropriate cache lifetimes. "
            "Consider `Cache-Control: no-cache` for pages that should always be validated."
        ),
        "reference_links": [
            "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control",
            "https://owasp.org/www-project-secure-headers/#cache-control",
        ],
    },
    {
        "name": "X-DNS-Prefetch-Control",
        "severity": "Low",
        "standard": "Info",
        "type": "security",
        "description": (
            "X-DNS-Prefetch-Control controls DNS prefetching. When disabled, it prevents "
            "browsers from performing DNS lookups for links in the page, reducing information leakage."
        ),
        "payload": "X-DNS-Prefetch-Control: off",
        "remediation": (
            "Add `X-DNS-Prefetch-Control: off` for privacy-sensitive pages. "
            "This is a low-impact header but demonstrates security awareness."
        ),
        "reference_links": [
            "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-DNS-Prefetch-Control",
        ],
    },
    {
        "name": "Expect-CT",
        "severity": "Info",
        "standard": "Info",
        "type": "deprecated",
        "description": (
            "Expect-CT enforced Certificate Transparency requirements. This header is deprecated "
            "as CT is now mandatory for all public CAs. Its presence is harmless but unnecessary."
        ),
        "payload": "",
        "remediation": "This header is deprecated (Chrome 107+). Remove it to clean up your response headers.",
        "reference_links": [
            "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Expect-CT",
        ],
    },
    {
        "name": "Server",
        "severity": "Info",
        "standard": "OWASP A05:2021",
        "type": "info_leak",
        "description": (
            "The Server header reveals your web server software and version, providing attackers "
            "with information to identify known vulnerabilities."
        ),
        "payload": "",
        "remediation": (
            "Remove or obfuscate the Server header. In Nginx: `server_tokens off;`. "
            "In Apache: `ServerTokens Prod; ServerSignature Off;`. "
            "In IIS: Remove the Server header via URL Rewrite rules or custom HttpModule."
        ),
        "reference_links": [
            "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Server",
            "https://owasp.org/www-project-secure-headers/#server",
        ],
    },
    {
        "name": "X-Powered-By",
        "severity": "Info",
        "standard": "OWASP A05:2021",
        "type": "info_leak",
        "description": (
            "The X-Powered-By header reveals the technology stack (e.g., PHP/7.4.0, Express). "
            "This information helps attackers target known vulnerabilities in specific frameworks."
        ),
        "payload": "",
        "remediation": (
            "Remove the X-Powered-By header. In Express.js: `app.disable('x-powered-by');`. "
            "In PHP: set `expose_php = Off` in php.ini. "
            "In ASP.NET: remove via web.config `<httpRuntime enableVersionHeader='false'/>`."
        ),
        "reference_links": [
            "https://owasp.org/www-project-secure-headers/#x-powered-by",
        ],
    },
]


async def fetch_and_analyze(url: str, extra_headers: dict | None = None) -> dict:
    """
    Fetch the URL and analyze security headers.
    Returns dict with: reachable, headers_received, findings, grade_inputs
    """
    request_headers = {"User-Agent": "SecurityScanner/1.0 (header-analysis)"}
    if extra_headers:
        request_headers.update(extra_headers)

    try:
        async with httpx.AsyncClient(
            follow_redirects=True,
            timeout=15.0,
            verify=False,
        ) as client:
            resp = await client.get(url, headers=request_headers)
            received = {k.lower(): v for k, v in resp.headers.items()}
    except Exception as e:
        return {
            "reachable": False,
            "error": str(e),
            "headers_received": {},
            "findings": [],
        }

    findings = []
    for hdef in HEADER_DEFINITIONS:
        name = hdef["name"]
        name_lower = name.lower()
        htype = hdef["type"]

        if htype == "info_leak":
            # Bad when PRESENT
            if name_lower in received:
                findings.append({
                    "header_name": name,
                    "status": "info_leak",
                    "severity": hdef["severity"],
                    "standard": hdef["standard"],
                    "description": hdef["description"],
                    "payload": received.get(name_lower, ""),
                    "remediation": hdef["remediation"],
                    "reference_links": json.dumps(hdef["reference_links"]),
                })
            else:
                findings.append({
                    "header_name": name,
                    "status": "not_present",  # good for info_leak
                    "severity": hdef["severity"],
                    "standard": hdef["standard"],
                    "description": hdef["description"],
                    "payload": "",
                    "remediation": hdef["remediation"],
                    "reference_links": json.dumps(hdef["reference_links"]),
                })
        elif htype == "deprecated":
            status = "present" if name_lower in received else "absent"
            findings.append({
                "header_name": name,
                "status": status,
                "severity": hdef["severity"],
                "standard": hdef["standard"],
                "description": hdef["description"],
                "payload": hdef["payload"],
                "remediation": hdef["remediation"],
                "reference_links": json.dumps(hdef["reference_links"]),
            })
        else:
            # Security header — bad when missing
            if name_lower in received:
                findings.append({
                    "header_name": name,
                    "status": "present",
                    "severity": hdef["severity"],
                    "standard": hdef["standard"],
                    "description": hdef["description"],
                    "payload": received.get(name_lower, ""),
                    "remediation": hdef["remediation"],
                    "reference_links": json.dumps(hdef["reference_links"]),
                })
            else:
                findings.append({
                    "header_name": name,
                    "status": "missing",
                    "severity": hdef["severity"],
                    "standard": hdef["standard"],
                    "description": hdef["description"],
                    "payload": hdef["payload"],
                    "remediation": hdef["remediation"],
                    "reference_links": json.dumps(hdef["reference_links"]),
                })

    return {
        "reachable": True,
        "headers_received": dict(received),
        "findings": findings,
    }
