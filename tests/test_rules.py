import pytest

from scoring import rules


@pytest.mark.parametrize(
    "title, expected",
    [
        ("Data Engineer", 1),
        ("Senior Analytics Engineer", 1),
        ("Fullstack Developer", 0.6),
        ("Frontend Developer", 0.5),  # not caught by "developer"
        ("Backend Developer", 0.7),
        ("iOS Developer", 0),  # excluded roles win over "developer"
        ("Office Manager", 0),
        ("Barista", 0),
    ],
)
def test_score_role(title, expected):
    assert rules.score_role(title) == expected


@pytest.mark.parametrize(
    "title, expected",
    [("Data Engineer", 1), ("Senior Data Engineer", 0.6), ("Junior Data Engineer", 0.4), ("Lead Data Engineer", 0.2)],
)
def test_score_seniority(title, expected):
    assert rules.score_seniority(title) == expected


@pytest.mark.parametrize(
    "work_style, location, expected",
    [
        (["remote"], "Praha", 1),
        (["remote"], "Remote: Europe, United States", 1),
        (["remote"], "Remote: North America", rules.REMOTE_ABROAD),
        (["hybrid"], "Praha", 0.1),
        (["onsite", "remote"], "Praha", 1),  # the best allowed style counts
        (None, "Praha", rules.UNKNOWN),
    ],
)
def test_score_work_style(work_style, location, expected):
    assert rules.score_work_style(work_style, location) == expected


@pytest.mark.parametrize(
    "salary_max, currency, period, expected",
    [
        (120_000, "CZK", "month", 1),
        (50_000, "CZK", "month", 0),
        (45_000, "EUR", "year", 1),  # 93 750 CZK/month
        (25, "EUR", "hour", 1),  # 100 000 CZK/month
        (4_000_000, "INR", "year", rules.UNKNOWN),  # no exchange rate
        (None, None, None, rules.UNKNOWN),
    ],
)
def test_score_salary(salary_max, currency, period, expected):
    assert rules.score_salary(salary_max, currency, period) == expected


def test_match_stack():
    assert rules.match_stack("Python, dbt and Snowflake; PostgreSQL") == ["Snowflake", "dbt", "SQL", "Python"]


def test_score_total_is_weighted_sum():
    result = rules.score("Data Engineer", "Praha", ["remote"], 120_000, "CZK", "month", "Python, dbt, Snowflake")
    # Every sub-score is 1, so the total is the sum of the weights.
    assert result["score"] == 100
    assert result["technologies"] == ["Snowflake", "dbt", "Python"]
