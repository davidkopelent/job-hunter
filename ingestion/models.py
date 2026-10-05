from dataclasses import dataclass


@dataclass
class Job:
    source: str
    source_id: str
    url: str
    title: str
    company: str
    location: str