"""Deterministic scoring rules: what I'm looking for, and how a job's details map to sub-scores (0–1)."""

import re

# Points each sub-score is worth; the total is 0–100.
WEIGHTS = {"role": 35, "work_style": 35, "stack": 15, "seniority": 10, "salary": 5}

# Title patterns, checked in order; the first match wins, no match scores 0.
ROLES = [
    (r"\bios\b|android|mobile|\bqa\b|tester|testing|devops|devsecops|\bsre\b"
     r"|manager|sales|consultant|konzultant|recruiter|designer|support", 0),
    (r"data engineer|analytics engineer|data platform|data warehouse|\betl\b|big data|dataops"
     r"|datov\w* inženýr", 1),
    (r"full[- ]?stack", 0.6),
    # Before backend, so "Frontend Developer" isn't caught by "developer".
    (r"front[- ]?end|\bvue|\breact\b|angular", 0.5),
    (r"back[- ]?end|software engineer|software developer|developer|vývojář|programátor"
     r"|\bjava\b|\.net|c#|c\+\+|golang|\bgo\b", 0.7),
]

# Technologies I want to work with, searched in the title and description.
STACK = {
    "Snowflake": r"\bsnowflake\b",
    "dbt": r"\bdbt\b",
    "SQL": r"\bsql\b|postgres|mysql",
    "JavaScript/TypeScript": r"javascript|typescript",
    "PHP": r"\bphp\b",
    "Airflow": r"\bairflow\b",
    "Airbyte": r"\bairbyte\b",
    "Node.js": r"node\.?js\b",
    "Python": r"\bpython\b",
    "Vue.js": r"\bvue\b|vue\.?js\b",
    "Next.js": r"next\.?js\b",
    "C++": r"c\+\+",
}
# Mentioning this many of them is a full match.
STACK_FULL_MATCH = 3

# I'm mid-level: senior titles are a stretch, junior and lead titles a poor fit.
SENIORITY = [
    (r"\b(lead|principal|staff|head|architect|director)\b", 0.2),
    (r"\b(junior|jr|intern|internship|trainee|graduate|stáž|absolvent)\b", 0.4),
    (r"\b(senior|sr)\b", 0.6),
]
NO_SENIORITY = 1

# Remote only. A remote job based abroad may be restricted to that country.
REMOTE_REGION = r"czech|česk|prague|praha|brno|ostrava|europe|\beu\b|emea"
WORK_STYLE = {"remote": 1, "hybrid": 0.1, "onsite": 0}
REMOTE_ABROAD = 0.6
UNKNOWN = 0.5

# Stated salaries below this score 0. Few listings state one, so salary only nudges the total.
SALARY_FLOOR_CZK_MONTH = 60_000
CZK_PER = {"CZK": 1, "EUR": 25, "USD": 23, "GBP": 29}
CURRENCIES = {r"czk|kč": "CZK", r"€|eur": "EUR", r"\$|usd": "USD", r"£|gbp": "GBP"}
MONTHS_PER = {r"/\s*(yr|year)|annual|ročně": 1 / 12, r"/\s*(mo|month)|měsíc": 1,
              r"/\s*(hr|hour)|hodin": 160, r"/\s*(day|md)\b": 20}


def score_role(title: str) -> float:
    return next((score for pattern, score in ROLES if re.search(pattern, title, re.I)), 0)


def score_stack(text: str) -> float:
    matches = sum(1 for pattern in STACK.values() if re.search(pattern, text, re.I))
    return min(matches / STACK_FULL_MATCH, 1)


def score_seniority(title: str) -> float:
    return next((score for pattern, score in SENIORITY if re.search(pattern, title, re.I)), NO_SENIORITY)


def score_work_style(work_style: list[str] | None, location: str | None) -> float:
    if not work_style:
        return UNKNOWN
    if "remote" in work_style and location and not re.search(REMOTE_REGION, location, re.I):
        return REMOTE_ABROAD
    return max(WORK_STYLE[style] for style in work_style)


def score_salary(salary: str | None) -> float:
    if not salary:
        return UNKNOWN
    return 1 if salary_czk_month(salary) >= SALARY_FLOOR_CZK_MONTH else 0


def salary_czk_month(salary: str) -> float:
    """Top of the stated range in CZK per month, e.g. '€35,000.00/yr - €45,000.00/yr' → 93 750."""
    amount = max(float(re.sub(r"[,\s]", "", n)) for n in re.findall(r"\d[\d,\s]*(?:\.\d+)?", salary))
    currency = next(code for pattern, code in CURRENCIES.items() if re.search(pattern, salary, re.I))
    per_month = next(factor for pattern, factor in MONTHS_PER.items() if re.search(pattern, salary, re.I))
    return amount * CZK_PER[currency] * per_month


def score(
    title: str, location: str | None, work_style: list[str] | None, salary: str | None, description: str | None
) -> dict:
    scores = {
        "role": score_role(title),
        "work_style": score_work_style(work_style, location),
        "stack": score_stack(f"{title} {description or ''}"),
        "seniority": score_seniority(title),
        "salary": score_salary(salary),
    }
    return {**scores, "score": round(sum(WEIGHTS[name] * value for name, value in scores.items()))}
