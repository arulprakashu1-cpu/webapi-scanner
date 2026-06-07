"""PDF and JSON report generation."""
import json
import io
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT


SEVERITY_COLORS = {
    "Critical": colors.HexColor("#ef4444"),
    "High": colors.HexColor("#f97316"),
    "Medium": colors.HexColor("#eab308"),
    "Low": colors.HexColor("#3b82f6"),
    "Info": colors.HexColor("#6b7280"),
}

GRADE_COLORS = {
    "A+": colors.HexColor("#10b981"),
    "A": colors.HexColor("#22c55e"),
    "B": colors.HexColor("#eab308"),
    "C": colors.HexColor("#f97316"),
    "D": colors.HexColor("#ef4444"),
    "F": colors.HexColor("#7f1d1d"),
}


def generate_json_report(run: dict, findings: list) -> bytes:
    report = {
        "report_generated": datetime.utcnow().isoformat() + "Z",
        "scan": {
            "id": run.get("id"),
            "url": run.get("target_url"),
            "scan_name": run.get("scan_name"),
            "grade": run.get("grade"),
            "scanned_at": run.get("scanned_at"),
            "summary": {
                "critical": run.get("critical_count", 0),
                "high": run.get("high_count", 0),
                "medium": run.get("medium_count", 0),
                "low": run.get("low_count", 0),
                "info": run.get("info_count", 0),
            },
        },
        "virustotal": {
            "malicious": run.get("vt_malicious"),
            "suspicious": run.get("vt_suspicious"),
            "harmless": run.get("vt_harmless"),
            "verdict": run.get("vt_verdict"),
        } if run.get("vt_verdict") else None,
        "findings": [
            {
                "header_name": f["header_name"],
                "status": f["status"],
                "severity": f["severity"],
                "standard": f.get("standard"),
                "description": f.get("description"),
                "payload": f.get("payload"),
                "remediation": f.get("remediation"),
                "reference_links": json.loads(f["reference_links"]) if f.get("reference_links") else [],
            }
            for f in findings
        ],
    }
    return json.dumps(report, indent=2, default=str).encode("utf-8")


def generate_pdf_report(run: dict, findings: list) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=20*mm, bottomMargin=20*mm)
    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        "Title", parent=styles["Title"],
        fontName="Helvetica-Bold", fontSize=22, textColor=colors.HexColor("#0a0e1a"),
        spaceAfter=6,
    )
    h2_style = ParagraphStyle(
        "H2", parent=styles["Heading2"],
        fontName="Helvetica-Bold", fontSize=14, textColor=colors.HexColor("#1f2937"),
        spaceBefore=12, spaceAfter=6,
    )
    body_style = ParagraphStyle(
        "Body", parent=styles["Normal"],
        fontSize=9, textColor=colors.HexColor("#374151"), leading=14,
    )
    muted_style = ParagraphStyle(
        "Muted", parent=styles["Normal"],
        fontSize=8, textColor=colors.HexColor("#6b7280"), leading=12,
    )

    elements = []

    # Title block
    elements.append(Paragraph("Security Header Scanner", title_style))
    elements.append(Paragraph(f"<b>Scan Report</b> &mdash; {run.get('target_url', 'N/A')}", body_style))
    elements.append(Paragraph(
        f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')} &nbsp;|&nbsp; "
        f"Scan: {run.get('scan_name', 'N/A')} &nbsp;|&nbsp; "
        f"Date: {run.get('scanned_at', 'N/A')[:10]}",
        muted_style,
    ))
    elements.append(Spacer(1, 6*mm))

    # Grade badge
    grade = run.get("grade", "?")
    grade_color = GRADE_COLORS.get(grade, colors.gray)
    grade_data = [[Paragraph(f"<b>Overall Grade: {grade}</b>", ParagraphStyle(
        "Grade", parent=styles["Normal"],
        fontSize=18, fontName="Helvetica-Bold",
        textColor=colors.white, alignment=TA_CENTER,
    ))]]
    grade_table = Table(grade_data, colWidths=[120*mm])
    grade_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), grade_color),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("ROUNDEDCORNERS", [6, 6, 6, 6]),
    ]))
    elements.append(grade_table)
    elements.append(Spacer(1, 6*mm))

    # Summary counts
    elements.append(Paragraph("Severity Summary", h2_style))
    summary_data = [
        ["Severity", "Count"],
        ["Critical", str(run.get("critical_count", 0))],
        ["High", str(run.get("high_count", 0))],
        ["Medium", str(run.get("medium_count", 0))],
        ["Low", str(run.get("low_count", 0))],
        ["Info", str(run.get("info_count", 0))],
    ]
    summary_table = Table(summary_data, colWidths=[80*mm, 40*mm])
    summary_style = TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1f2937")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#f9fafb"), colors.white]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e5e7eb")),
        ("ALIGN", (1, 0), (1, -1), "CENTER"),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ])
    # Color severity cells
    sev_colors_map = {"Critical": "#fef2f2", "High": "#fff7ed", "Medium": "#fefce8", "Low": "#eff6ff", "Info": "#f9fafb"}
    for i, (sev, _) in enumerate(summary_data[1:], 1):
        bg = sev_colors_map.get(sev, "#ffffff")
        summary_style.add("BACKGROUND", (0, i), (0, i), colors.HexColor(bg))
    summary_table.setStyle(summary_style)
    elements.append(summary_table)
    elements.append(Spacer(1, 6*mm))

    # Findings table
    elements.append(Paragraph("Security Header Findings", h2_style))
    findings_data = [["#", "Header", "Status", "Severity", "Standard"]]
    for i, f in enumerate(findings, 1):
        findings_data.append([
            str(i),
            f["header_name"],
            f["status"].replace("_", " ").title(),
            f["severity"],
            f.get("standard", ""),
        ])
    findings_table = Table(findings_data, colWidths=[10*mm, 60*mm, 30*mm, 25*mm, 35*mm])
    ft_style = TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1f2937")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#f9fafb"), colors.white]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e5e7eb")),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("WORDWRAP", (1, 0), (1, -1), True),
    ])
    for i, f in enumerate(findings, 1):
        sev = f["severity"]
        c = SEVERITY_COLORS.get(sev, colors.gray)
        ft_style.add("TEXTCOLOR", (3, i), (3, i), c)
        ft_style.add("FONTNAME", (3, i), (3, i), "Helvetica-Bold")
    findings_table.setStyle(ft_style)
    elements.append(findings_table)

    doc.build(elements)
    return buffer.getvalue()
