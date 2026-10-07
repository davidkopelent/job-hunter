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
MONTHS_PER = {"year": 1 / 12, "month": 1, "day": 20, "hour": 160}


def score_role(title: str) -> float:
    return next((score for pattern, score in ROLES if re.search(pattern, title, re.I)), 0)


def match_stack(text: str) -> list[str]:
    return [name for name, pattern in STACK.items() if re.search(pattern, text, re.I)]


def score_stack(technologies: list[str]) -> float:
    return min(len(technologies) / STACK_FULL_MATCH, 1)


def score_seniority(title: str) -> float:
    return next((score for pattern, score in SENIORITY if re.search(pattern, title, re.I)), NO_SENIORITY)


def score_work_style(work_style: list[str] | None, location: str | None) -> float:
    if not work_style:
        return UNKNOWN
    if "remote" in work_style and location and not re.search(REMOTE_REGION, location, re.I):
        return REMOTE_ABROAD
    return max(WORK_STYLE[style] for style in work_style)


def score_salary(salary_max: float | None, currency: str | None, period: str | None) -> float:
    # Currencies without a rate (Wellfound lists e.g. INR) count as not stated.
    if salary_max is None or currency not in CZK_PER:
        return UNKNOWN
    czk_month = salary_max * CZK_PER[currency] * MONTHS_PER[period]
    return 1 if czk_month >= SALARY_FLOOR_CZK_MONTH else 0


def score(
    title: str,
    location: str | None,
    work_style: list[str] | None,
    salary_max: float | None,
    salary_currency: str | None,
    salary_period: str | None,
    description: str | None,
) -> dict:
    technologies = match_stack(f"{title} {description or ''}")
    scores = {
        "role": score_role(title),
        "work_style": score_work_style(work_style, location),
        "stack": score_stack(technologies),
        "seniority": score_seniority(title),
        "salary": score_salary(salary_max, salary_currency, salary_period),
    }
    total = round(sum(WEIGHTS[name] * value for name, value in scores.items()))
    return {**scores, "score": total, "technologies": technologies}
