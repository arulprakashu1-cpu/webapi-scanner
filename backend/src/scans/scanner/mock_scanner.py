import time
import random
from typing import List, Dict, Callable, Optional
from urllib.parse import urlparse


OWASP_FINDINGS_POOL = [
    {
        "severity": "critical",
        "title": "Broken Object Level Authorization (BOLA / IDOR)",
        "description": (
            "The API endpoint allows users to access or modify objects belonging to other users "
            "by manipulating the object identifier in the request. Tested by replacing the "
            "authenticated user's ID with sequential IDs — the server returned other users' data "
            "with HTTP 200. This is the #1 most critical API vulnerability."
        ),
        "confidence": "high",
        "remediation": (
            "Implement object-level authorization checks on every endpoint. Validate that the "
            "authenticated user owns or has explicit permission to access the requested object. "
            "Never rely solely on the object ID being unguessable (e.g., UUID) as a security control."
        ),
        "cwe_id": "CWE-639",
        "owasp_category": "API1:2023 - Broken Object Level Authorization",
        "method": "GET",
        "path": "/api/v1/users/{id}/data",
    },
    {
        "severity": "critical",
        "title": "Broken Function Level Authorization – Admin Endpoint Exposed",
        "description": (
            "Administrative API endpoints (/api/admin/users, /api/admin/config) are accessible "
            "using regular user JWT tokens. The server does not verify the admin role claim, "
            "allowing any authenticated user to perform privileged operations including reading "
            "all user records and modifying system configuration."
        ),
        "confidence": "high",
        "remediation": (
            "Enforce role-based access control (RBAC) at the function level using middleware. "
            "Admin routes must validate an 'admin' role in the JWT claims before processing. "
            "Audit all privileged endpoints and apply deny-by-default access policies."
        ),
        "cwe_id": "CWE-285",
        "owasp_category": "API5:2023 - Broken Function Level Authorization",
        "method": "GET",
        "path": "/api/admin/users",
    },
    {
        "severity": "high",
        "title": "Broken Authentication – JWT Algorithm Confusion (None Algorithm)",
        "description": (
            "The authentication endpoint accepts JWT tokens signed with the 'none' algorithm. "
            "An attacker can forge tokens with arbitrary claims (including admin: true) simply "
            "by base64-encoding a crafted payload and setting alg=none, bypassing all "
            "signature verification."
        ),
        "confidence": "high",
        "remediation": (
            "Reject any JWT with alg=none or an unexpected algorithm. Maintain an explicit "
            "allowlist of accepted algorithms (e.g., ['HS256'] or ['RS256']). Use a "
            "well-audited JWT library and never trust the algorithm header from client input."
        ),
        "cwe_id": "CWE-347",
        "owasp_category": "API2:2023 - Broken Authentication",
        "method": "POST",
        "path": "/api/v1/auth/verify",
    },
    {
        "severity": "high",
        "title": "Excessive Data Exposure – Sensitive Fields in API Response",
        "description": (
            "The /api/v1/users/me endpoint returns fields that should never be client-visible: "
            "password_hash, internal_user_id, stripe_customer_id, is_admin, failed_login_count, "
            "and raw Personally Identifiable Information (PII). A full ORM object is being "
            "serialized and returned without an explicit allowlist of safe fields."
        ),
        "confidence": "high",
        "remediation": (
            "Define explicit response schemas (DTOs) that only include fields safe for the "
            "client. Use response_model in FastAPI or serializers in Django. Never return "
            "raw ORM objects. Audit all API responses for accidental PII or internal data exposure."
        ),
        "cwe_id": "CWE-213",
        "owasp_category": "API3:2023 - Broken Object Property Level Authorization",
        "method": "GET",
        "path": "/api/v1/users/me",
    },
    {
        "severity": "high",
        "title": "Unrestricted Resource Consumption – No Rate Limiting",
        "description": (
            "The API does not implement rate limiting on any endpoint. The /api/v1/auth/login "
            "endpoint accepts unlimited authentication attempts, enabling brute-force attacks. "
            "The /api/v1/search endpoint processes expensive database queries without quota "
            "controls, making the service vulnerable to denial-of-service via API abuse."
        ),
        "confidence": "high",
        "remediation": (
            "Implement per-IP and per-user rate limiting using a token-bucket or sliding-window "
            "algorithm. Apply stricter limits to authentication endpoints. Add request size limits "
            "and query complexity analysis for search endpoints."
        ),
        "cwe_id": "CWE-770",
        "owasp_category": "API4:2023 - Unrestricted Resource Consumption",
        "method": "POST",
        "path": "/api/v1/auth/login",
    },
    {
        "severity": "high",
        "title": "SQL Injection via Unsanitized Query Parameter",
        "description": (
            "The /api/v1/products?search= parameter is concatenated directly into a SQL query "
            "without parameterization. Confirmed by injecting ' OR 1=1-- which returned all "
            "product records regardless of ownership."
        ),
        "confidence": "high",
        "remediation": (
            "Use parameterized queries or an ORM for all database interactions. Never "
            "concatenate user-supplied input into SQL strings. Implement input validation "
            "and an allowlist for query parameter characters."
        ),
        "cwe_id": "CWE-89",
        "owasp_category": "API10:2023 - Unsafe Consumption of APIs",
        "method": "GET",
        "path": "/api/v1/products",
    },
    {
        "severity": "medium",
        "title": "Server-Side Request Forgery (SSRF)",
        "description": (
            "The /api/v1/webhooks endpoint accepts a user-controlled callback URL and makes "
            "a server-side HTTP request without validation. Testing with http://169.254.169.254/ "
            "(AWS EC2 metadata) returned instance metadata including IAM role credentials."
        ),
        "confidence": "medium",
        "remediation": (
            "Validate all user-supplied URLs against an allowlist of permitted domains. "
            "Block requests to private IP ranges, cloud metadata endpoints, and localhost."
        ),
        "cwe_id": "CWE-918",
        "owasp_category": "API7:2023 - Server Side Request Forgery",
        "method": "POST",
        "path": "/api/v1/webhooks",
    },
    {
        "severity": "medium",
        "title": "Security Misconfiguration – Swagger UI Publicly Accessible",
        "description": (
            "The API documentation (Swagger UI / ReDoc) is accessible without authentication "
            "at /docs and /redoc. The spec exposes all endpoint paths, parameter names, "
            "authentication schemes, and example request/response bodies."
        ),
        "confidence": "high",
        "remediation": (
            "Disable Swagger UI in production or restrict access by IP range / VPN. "
            "Review all example values in the OpenAPI spec for hardcoded secrets."
        ),
        "cwe_id": "CWE-200",
        "owasp_category": "API8:2023 - Security Misconfiguration",
        "method": "GET",
        "path": "/docs",
    },
    {
        "severity": "medium",
        "title": "Security Misconfiguration – Missing Security Headers",
        "description": (
            "API responses are missing critical security headers: Strict-Transport-Security "
            "(HSTS), Content-Security-Policy (CSP), X-Content-Type-Options, X-Frame-Options, "
            "and Referrer-Policy."
        ),
        "confidence": "high",
        "remediation": (
            "Add all OWASP-recommended security headers to every API response: "
            "Strict-Transport-Security: max-age=31536000; includeSubDomains; preload, "
            "X-Content-Type-Options: nosniff, X-Frame-Options: DENY."
        ),
        "cwe_id": "CWE-693",
        "owasp_category": "API8:2023 - Security Misconfiguration",
        "method": "GET",
        "path": "/",
    },
    {
        "severity": "medium",
        "title": "Improper Inventory Management – Undocumented Debug Endpoint",
        "description": (
            "Discovered an undocumented endpoint /api/v1/internal/debug that returns extensive "
            "system information: application version, environment name, database connection "
            "string (with credentials), and recent error stack traces."
        ),
        "confidence": "medium",
        "remediation": (
            "Remove or disable all debug/internal endpoints before production deployment. "
            "Maintain a complete API inventory and ensure no endpoints exist outside the spec."
        ),
        "cwe_id": "CWE-1059",
        "owasp_category": "API9:2023 - Improper Inventory Management",
        "method": "GET",
        "path": "/api/v1/internal/debug",
    },
    {
        "severity": "medium",
        "title": "Mass Assignment Vulnerability",
        "description": (
            "The user update endpoint /api/v1/users/{id} accepts arbitrary JSON body fields "
            "and maps them directly to the user model. By including 'role': 'admin' or "
            "'is_verified': true in the request body, a regular user can escalate privileges."
        ),
        "confidence": "medium",
        "remediation": (
            "Use strict input validation schemas that explicitly define allowed fields. "
            "Never bind request bodies directly to database models."
        ),
        "cwe_id": "CWE-915",
        "owasp_category": "API3:2023 - Broken Object Property Level Authorization",
        "method": "PATCH",
        "path": "/api/v1/users/{id}",
    },
    {
        "severity": "low",
        "title": "Information Disclosure via Verbose Error Messages",
        "description": (
            "API error responses include full stack traces, internal file paths, database "
            "query strings, and framework version information."
        ),
        "confidence": "high",
        "remediation": (
            "Return generic error messages to API clients. Log detailed errors server-side only. "
            "Use structured error codes instead of raw exception messages."
        ),
        "cwe_id": "CWE-209",
        "owasp_category": "API8:2023 - Security Misconfiguration",
        "method": "POST",
        "path": "/api/v1/process",
    },
    {
        "severity": "low",
        "title": "Weak Password Policy – No Complexity Requirements",
        "description": (
            "The registration and password change endpoints accept passwords as short as "
            "1 character with no complexity requirements. No account lockout was triggered "
            "after 100 consecutive failed login attempts."
        ),
        "confidence": "high",
        "remediation": (
            "Enforce minimum password length of 12 characters. Check passwords against "
            "known-breached password lists. Implement account lockout after 5–10 failed attempts."
        ),
        "cwe_id": "CWE-521",
        "owasp_category": "API2:2023 - Broken Authentication",
        "method": "POST",
        "path": "/api/v1/auth/register",
    },
    {
        "severity": "low",
        "title": "Deprecated TLS Versions Supported (TLS 1.0 / 1.1)",
        "description": (
            "The server accepts TLS 1.0 and TLS 1.1 connections, which are deprecated by "
            "RFC 8996 and contain known vulnerabilities including BEAST and POODLE."
        ),
        "confidence": "high",
        "remediation": (
            "Configure the web server to support only TLS 1.2 (minimum) and TLS 1.3. "
            "Disable TLS 1.0 and 1.1 in your server configuration."
        ),
        "cwe_id": "CWE-326",
        "owasp_category": "API8:2023 - Security Misconfiguration",
        "method": "GET",
        "path": "/",
    },
    {
        "severity": "info",
        "title": "CORS Wildcard Origin Configured",
        "description": (
            "The Access-Control-Allow-Origin response header is set to '*' on all API endpoints. "
            "This overly permissive policy may expose public API data to unauthorized cross-origin requests."
        ),
        "confidence": "high",
        "remediation": (
            "Replace wildcard CORS with an explicit allowlist of trusted origins. "
            "Never combine Access-Control-Allow-Credentials: true with a wildcard origin."
        ),
        "cwe_id": "CWE-942",
        "owasp_category": "API8:2023 - Security Misconfiguration",
        "method": "GET",
        "path": "/",
    },
    {
        "severity": "info",
        "title": "API Version Disclosure in Response Headers",
        "description": (
            "The server returns X-API-Version, X-Powered-By, and Server headers in every "
            "response, disclosing the exact framework version and runtime."
        ),
        "confidence": "medium",
        "remediation": (
            "Remove or suppress unnecessary response headers that reveal technology stack information. "
            "Configure your server to omit Server and X-Powered-By headers."
        ),
        "cwe_id": "CWE-200",
        "owasp_category": "API9:2023 - Improper Inventory Management",
        "method": "GET",
        "path": "/",
    },
]

# Simulated common endpoint paths for realistic endpoint counts
COMMON_API_PATHS = [
    "/api/v1/users", "/api/v1/users/{id}", "/api/v1/auth/login",
    "/api/v1/auth/register", "/api/v1/auth/logout", "/api/v1/auth/refresh",
    "/api/v1/products", "/api/v1/products/{id}", "/api/v1/orders",
    "/api/v1/orders/{id}", "/api/v1/payments", "/api/v1/webhooks",
    "/api/v1/search", "/api/v1/admin/users", "/api/v1/admin/config",
    "/api/v1/internal/debug", "/api/v1/reports", "/api/v1/analytics",
    "/api/v1/notifications", "/api/v1/settings", "/health", "/docs", "/redoc",
    "/api/v2/users", "/api/v2/products", "/api/v2/auth",
]


def _probe_real_headers(target_url: str) -> dict:
    """Probe the real target URL for security header accuracy."""
    result = {
        "https_enforced": target_url.startswith("https://"),
        "hsts": False,
        "csp": False,
        "x_content_type": False,
        "x_frame": False,
        "cors_wildcard": False,
        "server_header": False,
        "reachable": False,
    }
    try:
        import httpx
        with httpx.Client(timeout=6.0, follow_redirects=True, verify=False) as client:
            resp = client.get(target_url)
            headers = {k.lower(): v for k, v in resp.headers.items()}
            result["reachable"] = True
            result["hsts"] = "strict-transport-security" in headers
            result["csp"] = "content-security-policy" in headers
            result["x_content_type"] = "x-content-type-options" in headers
            result["x_frame"] = "x-frame-options" in headers
            cors = headers.get("access-control-allow-origin", "")
            result["cors_wildcard"] = cors == "*"
            result["server_header"] = "server" in headers or "x-powered-by" in headers
    except Exception:
        pass
    return result


def run_mock_scan(scan_id: str, target_url: str, update_progress_fn: Callable[[int], None]) -> dict:
    """
    Simulate a real security scan with realistic timing.
    Returns: { findings: [...], meta: { endpoints_count, https_enforced, headers_pass, cors_safe, security_score } }
    """
    # Phase 1: DNS + connectivity probe
    update_progress_fn(5)
    time.sleep(1.5 + random.uniform(-0.3, 0.5))

    # Real header probe (non-blocking, best-effort)
    header_data = _probe_real_headers(target_url)

    update_progress_fn(15)
    time.sleep(2.0 + random.uniform(-0.5, 0.5))

    # Phase 2: Endpoint discovery
    parsed = urlparse(target_url)
    path_prefix = parsed.path.rstrip("/")
    endpoints_count = random.randint(18, 52)
    update_progress_fn(30)
    time.sleep(2.5 + random.uniform(-0.5, 0.5))

    # Phase 3: Authentication checks
    update_progress_fn(48)
    time.sleep(3.0 + random.uniform(-0.5, 0.5))

    # Phase 4: Authorization fuzzing
    update_progress_fn(62)
    time.sleep(3.0 + random.uniform(-0.5, 0.8))

    # Phase 5: Injection probes
    update_progress_fn(76)
    time.sleep(2.5 + random.uniform(-0.3, 0.5))

    # Phase 6: Data exposure checks
    update_progress_fn(88)
    time.sleep(2.0 + random.uniform(-0.3, 0.5))

    # Phase 7: Report compilation
    update_progress_fn(96)
    time.sleep(1.5)

    # Select findings (deterministic by URL to give consistent results)
    url_seed = sum(ord(c) for c in target_url)
    rng = random.Random(url_seed)
    num_findings = rng.randint(7, 14)
    pool = OWASP_FINDINGS_POOL.copy()
    rng.shuffle(pool)
    selected = pool[:min(num_findings, len(pool))]

    # Adjust findings based on real header probe
    findings = []
    for f in selected:
        item = {k: v for k, v in f.items() if k != "path"}
        item["endpoint"] = target_url.rstrip("/") + f["path"]
        item["finding_status"] = "new"

        # Make header findings accurate based on real data
        if "CORS" in f["title"] and not header_data["cors_wildcard"] and header_data["reachable"]:
            item["severity"] = "info"
            item["confidence"] = "medium"
            item["description"] = item["description"] + " Note: header probe suggests CORS may be configured."

        if "Security Headers" in f["title"] and header_data["reachable"]:
            if header_data["hsts"] and header_data["csp"] and header_data["x_content_type"]:
                item["severity"] = "info"
                item["confidence"] = "low"
                item["description"] = "Most security headers are present. Minor gaps detected in CSP directives."

        if "TLS" in f["title"] and header_data["https_enforced"]:
            item["confidence"] = "medium"

        findings.append(item)

    # Compute security score
    sev_counts = {
        "critical": sum(1 for f in findings if f["severity"] == "critical"),
        "high":     sum(1 for f in findings if f["severity"] == "high"),
        "medium":   sum(1 for f in findings if f["severity"] == "medium"),
        "low":      sum(1 for f in findings if f["severity"] == "low"),
        "info":     sum(1 for f in findings if f["severity"] == "info"),
    }
    score = max(0, 100 - sev_counts["critical"] * 22 - sev_counts["high"] * 10 - sev_counts["medium"] * 5 - sev_counts["low"] * 2)

    headers_pass = (
        header_data["hsts"] and
        header_data["x_content_type"] and
        header_data["x_frame"]
    ) if header_data["reachable"] else None

    return {
        "findings": findings,
        "meta": {
            "endpoints_count": endpoints_count,
            "https_enforced": header_data["https_enforced"],
            "headers_pass": headers_pass,
            "cors_safe": not header_data["cors_wildcard"] if header_data["reachable"] else None,
            "security_score": score,
        }
    }
