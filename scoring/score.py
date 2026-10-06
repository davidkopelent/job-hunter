"""Scoring stage: score every open job from its details → `job_scores`."""

import db
from scoring import rules

UPSERT_SCORE = """
    insert into job_scores (job_id, score, role, seniority, work_style, stack, salary)
    values (%(job_id)s, %(score)s, %(role)s, %(seniority)s, %(work_style)s, %(stack)s, %(salary)s)
    on conflict (job_id) do update set
        score = excluded.score,
        role = excluded.role,
        seniority = excluded.seniority,
        work_style = excluded.work_style,
        stack = excluded.stack,
        salary = excluded.salary,
        scored_at = now()
"""


def score(conn) -> None:
    jobs = conn.execute("""
        select job_id, title, location, work_style, salary, description from job_details
        where not closed
    """).fetchall()

    # Every run rescores everything, so rule changes apply to all jobs.
    with conn.transaction():
        for job_id, title, location, work_style, salary, description in jobs:
            scores = rules.score(title, location, work_style, salary, description)
            conn.execute(UPSERT_SCORE, {"job_id": job_id, **scores})

    print(f"scored {len(jobs)} jobs")


if __name__ == "__main__":
    with db.connect() as conn:
        score(conn)
