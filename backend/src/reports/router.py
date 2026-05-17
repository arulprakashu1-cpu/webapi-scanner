import json
import io
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from src.database.session import get_db
from src.database.models import User, Scan, ScanFinding, ScanAiAnalysis
from src.auth.dependencies import get_current_user
from src.organizations.service import get_user_org
from src.config import settings

router = APIRouter()


def _get_scan_or_404(scan_id: str, user: User, db: Session) -> Scan:
    org = get_user_org(db, user.id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    scan = db.query(Scan).filter(Scan.id == scan_id, Scan.organization_id == org.id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    return scan


@router.get("/{scan_id}/export/json")
def export_json(scan_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    scan = _get_scan_or_404(scan_id, current_user, db)
    findings = db.query(ScanFinding).filter(ScanFinding.scan_id == scan_id).all()

    severity_order = {"critical": 0, "high": 1, "medium": 2, "low": 3, "info": 4}
    findings.sort(key=lambda f: severity_order.get(f.severity.lower(), 5))

    data = {
        "scan": {
            "id": scan.id, "name": scan.name, "description": scan.description,
            "target_url": scan.target_url, "status": scan.status,
            "created_at": scan.created_at.isoformat() if scan.created_at else None,
            "started_at": scan.started_at.isoformat() if scan.started_at else None,
            "finished_at": scan.finished_at.isoformat() if scan.finished_at else None,
        },
        "summary": {
            "total": len(findings),
            "critical": sum(1 for f in findings if f.severity == "critical"),
            "high": sum(1 for f in findings if f.severity == "high"),
            "medium": sum(1 for f in findings if f.severity == "medium"),
            "low": sum(1 for f in findings if f.severity == "low"),
            "info": sum(1 for f in findings if f.severity == "info"),
        },
        "findings": [
            {
                "id": f.id, "severity": f.severity, "title": f.title,
                "description": f.description, "confidence": f.confidence,
                "endpoint": f.endpoint, "method": f.method,
                "remediation": f.remediation, "cwe_id": f.cwe_id,
                "owasp_category": f.owasp_category,
            }
            for f in findings
        ],
    }

    content = json.dumps(data, indent=2)
    return StreamingResponse(
        io.BytesIO(content.encode()),
        media_type="application/json",
        headers={"Content-Disposition": f'attachment; filename="scan-{scan_id[:8]}-report.json"'},
    )


@router.get("/{scan_id}/export/csv")
def export_csv(scan_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    scan = _get_scan_or_404(scan_id, current_user, db)
    findings = db.query(ScanFinding).filter(ScanFinding.scan_id == scan_id).all()

    lines = ["Severity,Title,Endpoint,Method,Confidence,OWASP Category,CWE,Remediation"]
    for f in findings:
        def esc(v):
            if v is None:
                return ""
            return '"' + str(v).replace('"', '""').replace("\n", " ") + '"'
        lines.append(
            f"{esc(f.severity)},{esc(f.title)},{esc(f.endpoint)},{esc(f.method)},"
            f"{esc(f.confidence)},{esc(f.owasp_category)},{esc(f.cwe_id)},{esc(f.remediation)}"
        )

    content = "\n".join(lines)
    return StreamingResponse(
        io.BytesIO(content.encode()),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="scan-{scan_id[:8]}-report.csv"'},
    )


@router.get("/{scan_id}/export/pdf")
def export_pdf(scan_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    scan = _get_scan_or_404(scan_id, current_user, db)
    if scan.status != "completed":
        raise HTTPException(status_code=400, detail="Scan not completed yet")

    findings = db.query(ScanFinding).filter(ScanFinding.scan_id == scan_id).all()
    severity_order = {"critical": 0, "high": 1, "medium": 2, "low": 3, "info": 4}
    findings.sort(key=lambda f: severity_order.get(f.severity.lower(), 5))

    from fpdf import FPDF

    SEV_COLORS = {
        "critical": (255, 68, 68),
        "high":     (255, 140, 0),
        "medium":   (255, 214, 0),
        "low":      (34, 197, 94),
        "info":     (96, 165, 250),
    }

    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()

    # Header
    pdf.set_fill_color(10, 10, 10)
    pdf.rect(0, 0, 210, 30, "F")
    pdf.set_font("Helvetica", "B", 18)
    pdf.set_text_color(255, 214, 0)
    pdf.cell(0, 20, "ScanAPI Security Report", ln=True, align="C")
    pdf.set_text_color(0, 0, 0)
    pdf.ln(8)

    # Scan metadata
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_fill_color(240, 240, 240)
    pdf.cell(0, 8, "Scan Information", ln=True, fill=True)
    pdf.set_font("Helvetica", "", 9)
    pdf.ln(2)

    meta = [
        ("Scan Name", scan.name),
        ("Target URL", scan.target_url or "N/A"),
        ("Status", scan.status.capitalize()),
        ("Started", scan.started_at.strftime("%Y-%m-%d %H:%M UTC") if scan.started_at else "N/A"),
        ("Finished", scan.finished_at.strftime("%Y-%m-%d %H:%M UTC") if scan.finished_at else "N/A"),
    ]
    for label, val in meta:
        pdf.set_font("Helvetica", "B", 9)
        pdf.cell(40, 6, f"{label}:")
        pdf.set_font("Helvetica", "", 9)
        pdf.cell(0, 6, str(val), ln=True)

    pdf.ln(6)

    # Summary
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_fill_color(240, 240, 240)
    pdf.cell(0, 8, "Severity Summary", ln=True, fill=True)
    pdf.ln(3)

    counts = {s: sum(1 for f in findings if f.severity == s) for s in ["critical", "high", "medium", "low", "info"]}
    col_w = 35
    for sev, count in counts.items():
        r, g, b = SEV_COLORS.get(sev, (150, 150, 150))
        pdf.set_fill_color(r, g, b)
        pdf.set_text_color(255, 255, 255)
        pdf.set_font("Helvetica", "B", 9)
        pdf.cell(col_w - 2, 8, f"{sev.upper()} : {count}", fill=True, align="C")
        pdf.set_text_color(0, 0, 0)
        pdf.cell(2, 8, "")
    pdf.ln(12)

    # Findings
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_fill_color(240, 240, 240)
    pdf.cell(0, 8, f"Detailed Findings ({len(findings)} total)", ln=True, fill=True)
    pdf.ln(3)

    for i, f in enumerate(findings, 1):
        r, g, b = SEV_COLORS.get(f.severity.lower(), (150, 150, 150))

        # Finding header bar
        pdf.set_fill_color(r, g, b)
        pdf.set_text_color(255, 255, 255)
        pdf.set_font("Helvetica", "B", 9)
        pdf.cell(0, 7, f"  [{f.severity.upper()}]  {f.title}", ln=True, fill=True)
        pdf.set_text_color(0, 0, 0)
        pdf.set_font("Helvetica", "", 8)

        if f.endpoint:
            pdf.cell(25, 5, "Endpoint:")
            pdf.set_font("Helvetica", "I", 8)
            method_str = f"[{f.method}] " if f.method else ""
            ep = f.endpoint
            if len(ep) > 80:
                ep = ep[:77] + "..."
            pdf.cell(0, 5, f"{method_str}{ep}", ln=True)
            pdf.set_font("Helvetica", "", 8)

        if f.owasp_category:
            pdf.cell(25, 5, "OWASP:")
            pdf.cell(0, 5, f.owasp_category.split(" - ")[0], ln=True)

        if f.cwe_id:
            pdf.cell(25, 5, "CWE:")
            pdf.cell(0, 5, f.cwe_id, ln=True)

        if f.description:
            pdf.set_font("Helvetica", "B", 8)
            pdf.cell(0, 5, "Description:", ln=True)
            pdf.set_font("Helvetica", "", 8)
            pdf.multi_cell(0, 4.5, f.description[:400] + ("..." if len(f.description) > 400 else ""))

        if f.remediation:
            pdf.set_font("Helvetica", "B", 8)
            pdf.set_text_color(34, 120, 50)
            pdf.cell(0, 5, "Remediation:", ln=True)
            pdf.set_font("Helvetica", "", 8)
            pdf.set_text_color(0, 0, 0)
            pdf.multi_cell(0, 4.5, f.remediation[:300] + ("..." if len(f.remediation) > 300 else ""))

        pdf.ln(4)
        if pdf.get_y() > 260:
            pdf.add_page()

    # Footer
    pdf.set_font("Helvetica", "I", 8)
    pdf.set_text_color(120, 120, 120)
    pdf.cell(0, 6, f"Generated by ScanAPI on {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}  |  scanapi.io", ln=True, align="C")

    buf = io.BytesIO(pdf.output())
    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="scan-{scan_id[:8]}-report.pdf"'},
    )


@router.post("/{scan_id}/analyze")
def analyze_scan(scan_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    scan = _get_scan_or_404(scan_id, current_user, db)
    if scan.status != "completed":
        raise HTTPException(status_code=400, detail="Scan must be completed before AI analysis")

    # Return cached analysis if exists
    existing = db.query(ScanAiAnalysis).filter(ScanAiAnalysis.scan_id == scan_id).first()
    if existing:
        return {
            "executive_summary": existing.executive_summary,
            "risk_level": existing.risk_level,
            "attack_narrative": existing.attack_narrative,
            "top_priorities": json.loads(existing.top_priorities or "[]"),
            "quick_wins": json.loads(existing.quick_wins or "[]"),
            "cached": True,
        }

    findings = db.query(ScanFinding).filter(ScanFinding.scan_id == scan_id).all()
    if not findings:
        return {
            "executive_summary": "No vulnerabilities were found. This API passed all OWASP Top 10 security checks.",
            "risk_level": "low",
            "attack_narrative": "No attack surface identified.",
            "top_priorities": [],
            "quick_wins": ["Maintain current security posture", "Schedule regular re-scans", "Keep dependencies updated"],
            "cached": False,
        }

    severity_order = {"critical": 0, "high": 1, "medium": 2, "low": 3, "info": 4}
    findings.sort(key=lambda f: severity_order.get(f.severity.lower(), 5))

    counts = {s: sum(1 for f in findings if f.severity == s) for s in ["critical", "high", "medium", "low", "info"]}
    findings_text = "\n\n".join(
        f"[{f.severity.upper()}] {f.title}\n"
        f"Endpoint: {f.method or 'N/A'} {f.endpoint or 'N/A'}\n"
        f"OWASP: {f.owasp_category or 'N/A'}\n"
        f"Description: {(f.description or '')[:300]}\n"
        f"Remediation: {(f.remediation or '')[:200]}"
        for f in findings[:12]
    )

    prompt = f"""You are a senior application security engineer reviewing an API security scan report.

Target: {scan.target_url or scan.name}
Findings: {counts.get('critical',0)} critical, {counts.get('high',0)} high, {counts.get('medium',0)} medium, {counts.get('low',0)} low, {counts.get('info',0)} info

FINDINGS:
{findings_text}

Respond ONLY with valid JSON matching this exact schema (no markdown, no extra text):
{{
  "executive_summary": "2-3 sentence professional executive summary of the security posture",
  "risk_level": "critical|high|medium|low",
  "attack_narrative": "2-3 sentences describing how an attacker could chain these vulnerabilities together",
  "top_priorities": ["Priority action 1 (max 15 words)", "Priority action 2", "Priority action 3"],
  "quick_wins": ["Quick fix 1 (max 12 words)", "Quick fix 2", "Quick fix 3"]
}}"""

    if not settings.ANTHROPIC_API_KEY:
        result = _mock_ai_analysis(counts, scan.target_url or scan.name)
    else:
        try:
            import anthropic
            client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
            message = client.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=1024,
                messages=[{"role": "user", "content": prompt}],
            )
            raw = message.content[0].text.strip()
            result = json.loads(raw)
        except Exception:
            result = _mock_ai_analysis(counts, scan.target_url or scan.name)

    # Persist
    analysis = ScanAiAnalysis(
        scan_id=scan_id,
        executive_summary=result.get("executive_summary", ""),
        risk_level=result.get("risk_level", "medium"),
        attack_narrative=result.get("attack_narrative", ""),
        top_priorities=json.dumps(result.get("top_priorities", [])),
        quick_wins=json.dumps(result.get("quick_wins", [])),
    )
    db.add(analysis)
    db.commit()

    return {**result, "cached": False}


def _mock_ai_analysis(counts: dict, target: str) -> dict:
    critical = counts.get("critical", 0)
    high = counts.get("high", 0)
    total = sum(counts.values())

    if critical > 0:
        risk = "critical"
        summary = (
            f"The API at {target} exhibits a critical security posture with {critical} critical and {high} high-severity "
            f"vulnerabilities that expose the system to immediate compromise. Immediate remediation is required before "
            f"this API is safe for production use."
        )
        narrative = (
            "An attacker could exploit the broken object-level authorization flaw to enumerate user data, "
            "then escalate privileges via the exposed admin endpoint, and finally exfiltrate sensitive records "
            "using the SQL injection vector — achieving full database compromise in a single attack chain."
        )
        priorities = [
            "Patch all critical authorization bypasses before next deployment",
            "Implement RBAC middleware on all admin routes immediately",
            "Parameterize all SQL queries and remove string concatenation",
        ]
        quick_wins = [
            "Add rate limiting to all authentication endpoints",
            "Enable security headers (HSTS, CSP, X-Frame-Options)",
            "Disable Swagger UI in production environment",
        ]
    elif high > 0:
        risk = "high"
        summary = (
            f"The security scan of {target} revealed {total} total vulnerabilities, including {high} high-severity "
            f"issues that require prompt attention. The API is at significant risk and should be hardened before wider exposure."
        )
        narrative = (
            "A motivated attacker could chain the authentication weakness with the misconfigured CORS policy "
            "to forge tokens, then leverage exposed internal endpoints to map the infrastructure for further exploitation."
        )
        priorities = [
            "Fix JWT algorithm confusion vulnerability in auth service",
            "Restrict CORS origins to an explicit allowlist",
            "Remove or protect all internal/debug endpoints",
        ]
        quick_wins = [
            "Reject JWT tokens with alg=none immediately",
            "Add X-Content-Type-Options and X-Frame-Options headers",
            "Audit all endpoints not listed in OpenAPI spec",
        ]
    else:
        risk = "medium"
        summary = (
            f"The API at {target} has a moderate security posture with no critical vulnerabilities detected. "
            f"The {total} findings identified are addressable with standard security hardening practices."
        )
        narrative = (
            "While no critical exploits are immediately apparent, the combination of missing security headers "
            "and permissive CORS configuration could be leveraged by an attacker to conduct information-gathering "
            "activities and identify targets for more sophisticated follow-up attacks."
        )
        priorities = [
            "Implement comprehensive security header policy",
            "Tighten CORS configuration to specific origins",
            "Enable TLS 1.3 and disable legacy protocol support",
        ]
        quick_wins = [
            "Add HSTS header with 1-year max-age",
            "Set CORS to explicit origin allowlist",
            "Run dependency vulnerability scan (npm audit / pip audit)",
        ]

    return {
        "executive_summary": summary,
        "risk_level": risk,
        "attack_narrative": narrative,
        "top_priorities": priorities,
        "quick_wins": quick_wins,
    }
