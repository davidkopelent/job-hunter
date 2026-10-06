"""Shared Postgres access for every stage (ingestion, scoring). Each stage owns the SQL for the tables it writes."""

import os

import psycopg
from dotenv import load_dotenv

load_dotenv()


def connect() -> psycopg.Connection:
    # Autocommit: each `conn.transaction()` block is then its own real transaction.
    return psycopg.connect(os.environ["DATABASE_URL"], autocommit=True)
