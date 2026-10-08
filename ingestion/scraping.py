import requests
from markdownify import markdownify

session = requests.Session()
session.headers["User-Agent"] = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/140.0 Safari/537.36"
)


# Currency symbols on listing pages → ISO 4217 codes.
CURRENCY_SYMBOLS = {"€": "EUR", "$": "USD", "£": "GBP", "₹": "INR", "Kč": "CZK"}


def clean(text: str | None) -> str | None:
    """Collapse whitespace; empty becomes None."""
    return " ".join((text or "").split()) or None


def markdown(html: str) -> str:
    """A description's HTML as Markdown, so the feed can render its paragraphs, lists and emphasis."""
    # Empty paragraphs (<p><br></p>) used as spacers collapse into blank lines.
    return markdownify(html, heading_style="ATX", bullets="-", strip=["img"]).strip()
