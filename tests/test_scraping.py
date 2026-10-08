from ingestion.scraping import markdown


def test_markdown_moves_breaks_out_of_bold():
    html = "<strong>Who We Are.<br><br></strong>Deel is a platform.<br><br><strong><em>Why us?<br></em></strong>Because."
    assert markdown(html) == "**Who We Are.**  \n  \nDeel is a platform.  \n  \n***Why us?***  \nBecause."
