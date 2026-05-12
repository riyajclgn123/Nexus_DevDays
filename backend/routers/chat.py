import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from database import get_db
from models import Parish, StateMetric, WorkforceGap, Opportunity, ExpansionSite, Alert
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/chat", tags=["chatbot"])

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    user_role: str
    conversation_history: Optional[List[ChatMessage]] = []


class ChatResponse(BaseModel):
    reply: str
    sources: List[str] = []


def get_live_context(db: Session, user_role: str) -> str:
    metrics = db.query(StateMetric).all()
    metrics_text = "\n".join([
        f"- {m.label}: {m.value_str or m.value} ({m.sub_label})"
        for m in metrics if m.label
    ])

    parishes = db.query(Parish).order_by(Parish.sps.desc()).all()
    parishes_text = "\n".join([
        f"- {p.name}: SPS={p.sps} Grade={p.grade} Graduation={p.graduation}% Mastery={p.proficiency}% Poverty={p.poverty}% Gap={p.gap} Enrollment={p.enrollment} Growth={p.growth}% Trend={p.trend}"
        for p in parishes
    ])

    workforce = db.query(WorkforceGap).order_by(WorkforceGap.gap.desc()).all()
    workforce_text = "\n".join([
        f"- {w.sector}: Demand={w.demand} Supply={w.supply} Gap={w.gap} Growth={w.growth_pct}"
        for w in workforce
    ])

    alerts = db.query(Alert).filter(Alert.is_active == True).all()
    alerts_text = "\n".join([
        f"- [{a.type.upper()}] {a.parish}: {a.message}"
        for a in alerts
    ])

    role_context = ""

    if user_role == "funder":
        opps = db.query(Opportunity).order_by(Opportunity.score.desc()).all()
        opp_lines = "\n".join([
            f"- {o.type} in {o.parish}: Score={o.score}/100 Impact={o.impact} Cost={o.cost} Students={o.students} Sector={o.workforce}. {o.rationale}"
            for o in opps
        ])
        role_context = f"\n\nINVESTMENT OPPORTUNITIES:\n{opp_lines}"

    elif user_role == "operator":
        sites = db.query(ExpansionSite).order_by(ExpansionSite.demand_score.desc()).all()
        site_lines = "\n".join([
            f"- {s.school_type} in {s.parish} ({s.region}): DemandScore={s.demand_score} Status={s.status} Unserved={s.unserved} Competition={s.competition} Timeline={s.timeline}. {s.key_fact}"
            for s in sites
        ])
        role_context = f"\n\nEXPANSION SITES:\n{site_lines}"

    return f"""STATE METRICS (LDOE 2024 + Census ACS 2024):
{metrics_text}

PARISH PERFORMANCE (LDOE 2024):
{parishes_text}

WORKFORCE GAPS (BLS Louisiana 2025):
{workforce_text}

SYSTEM ALERTS:
{alerts_text}
{role_context}"""


def build_system_prompt(user_role: str, live_data: str) -> str:
    role_descriptions = {
        "policymaker": "a Louisiana education policymaker or LDOE official",
        "funder": "a philanthropic funder looking for high-impact investment opportunities in Louisiana education",
        "operator": "a school operator evaluating expansion opportunities in Louisiana",
    }

    role_focus = {
        "policymaker": "Focus on SPS scores, graduation rates, parish gaps, chronic absenteeism, alerts, and intervention priorities.",
        "funder": "Focus on investment opportunities, impact scores, cost efficiency, workforce alignment, and ROI.",
        "operator": "Focus on expansion sites, demand scores, unserved students, competition levels, and enrollment forecasts.",
    }

    description = role_descriptions.get(user_role, "a Louisiana education stakeholder")
    focus = role_focus.get(user_role, "")

    system = f"""You are EduPulse AI, the intelligent data assistant for the Louisiana EduPulse platform.

You are speaking with {description}.

{focus}

STRICT RULES:
1. ONLY answer questions about Louisiana K-12 education, school performance, workforce gaps, demographics, or education investment in Louisiana.
2. If asked about anything unrelated such as sports, cooking, coding, or other topics, politely decline and redirect to education topics.
3. ALWAYS base your answers on the LIVE DATA provided below. Never make up numbers.
4. Cite data sources such as LDOE 2024, Census ACS 2024, BLS Louisiana when referencing specific numbers.
5. Be concise but specific. Use bullet points for lists.
6. End responses about specific parishes or opportunities with a relevant follow-up question.
7. If data is not available, say that specific data is not in the current dataset and work with what is available.
8. Speak as a trusted advisor, not a generic chatbot.

LIVE DATA FROM POSTGRESQL DATABASE:
{live_data}

You are EduPulse AI. Stay strictly on Louisiana education topics. Use the data above for accurate answers."""

    return system


@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest, db: Session = Depends(get_db)):
    if not GROQ_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="GROQ_API_KEY not configured. Add it to your backend/.env file. Get a free key at console.groq.com"
        )

    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    valid_roles = ["policymaker", "funder", "operator"]
    user_role = request.user_role if request.user_role in valid_roles else "policymaker"

    try:
        live_data = get_live_context(db, user_role)
        system_prompt = build_system_prompt(user_role, live_data)

        messages = [{"role": "system", "content": system_prompt}]

        for msg in (request.conversation_history or []):
            groq_role = "user" if msg.role == "user" else "assistant"
            messages.append({"role": groq_role, "content": msg.content})

        messages.append({"role": "user", "content": request.message})

        client = Groq(api_key=GROQ_API_KEY)
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.3,
            max_tokens=1024,
        )

        reply = response.choices[0].message.content

        sources = ["LDOE 2024 School Performance Scores", "US Census ACS 2024"]
        msg_lower = request.message.lower()
        if any(w in msg_lower for w in ["workforce", "job", "sector", "employment"]):
            sources.append("BLS Louisiana 2025")
        if any(w in msg_lower for w in ["opportunit", "invest", "fund"]):
            sources.append("EduPulse Opportunity Scoring Model")
        if any(w in msg_lower for w in ["site", "expand", "open", "location"]):
            sources.append("EduPulse Expansion Site Analysis")

        return ChatResponse(reply=reply, sources=sources)

    except Exception as e:
        error_msg = str(e)
        if "api_key" in error_msg.lower() or "authentication" in error_msg.lower():
            raise HTTPException(status_code=500, detail="Invalid GROQ_API_KEY. Check your backend/.env file.")
        if "rate_limit" in error_msg.lower():
            raise HTTPException(status_code=429, detail="Rate limit hit. Please wait a moment and try again.")
        raise HTTPException(status_code=500, detail=f"Chat error: {error_msg}")


@router.get("/suggestions/{role}")
def get_suggestions(role: str):
    suggestions = {
        "policymaker": [
            "Which parishes have the lowest SPS scores and need immediate intervention?",
            "How has Louisiana's statewide SPS score changed since COVID?",
            "What is the chronic absenteeism rate and which parishes are most affected?",
            "Which parishes have the highest poverty rates and lowest graduation rates?",
            "What are the critical alerts in our system right now?",
            "Show me parishes with declining enrollment trends.",
        ],
        "funder": [
            "Which investment opportunity has the highest impact score?",
            "Where should I invest $2M for maximum student impact in Louisiana?",
            "What is the workforce gap in the healthcare sector?",
            "Show me all High Impact opportunities ranked by cost efficiency.",
            "Which parishes have the biggest education to workforce gap?",
            "What sectors have the fastest growing job demand in Louisiana?",
        ],
        "operator": [
            "Which sites are Ready for expansion right now?",
            "Where is the highest unmet demand for schools in Louisiana?",
            "What is the demand score for Caddo Parish and why?",
            "Which parishes have low competition and high unserved student populations?",
            "How is the statewide SPS score projected to change by 2027?",
            "What school type is best suited for the Tangipahoa expansion site?",
        ],
    }
    return {"suggestions": suggestions.get(role, suggestions["policymaker"])}