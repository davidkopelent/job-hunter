import requests
from bs4 import BeautifulSoup
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
    page = BeautifulSoup(html, "html.parser")
    # LinkedIn ends bold headings with their line breaks inside: <strong>Heading<br><br></strong>Text.
    # Markdown emphasis can't end in a break, so the breaks would be lost and the heading run into the text.
    for tag in reversed(page.find_all(["strong", "b", "em", "i"])):  # innermost first
        while tag.contents and (tag.contents[-1].name == "br" or not tag.contents[-1].get_text().strip()):
            tag.insert_after(tag.contents[-1].extract())
    # Empty paragraphs (<p><br></p>) used as spacers collapse into blank lines.
    return markdownify(str(page), heading_style="ATX", bullets="-", strip=["img"]).strip()
