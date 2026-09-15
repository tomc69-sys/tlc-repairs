"""Build the public reviews list in reviews.html from approved JSON."""
import html
import json
from pathlib import Path

SITE = Path(__file__).resolve().parent.parent
APPROVED_FILE = SITE / "data" / "reviews-approved.json"
OUT_FILE = SITE / "reviews.html"
START = "<!--REVIEWS_START-->"
END = "<!--REVIEWS_END-->"
SCHEMA_START = "<!--REVIEWS_SCHEMA-->"
SCHEMA_END = "<!--/REVIEWS_SCHEMA-->"


def esc(text):
    return html.escape(str(text or ""), quote=True)


def esc_text(text):
    return html.escape(str(text or ""), quote=False)


def stars_html(rating):
    rating = max(0, min(5, int(rating or 0)))
    filled = "★" * rating
    empty = "☆" * (5 - rating)
    label = f"{rating} out of 5 stars"
    return (
        f'<div class="review-stars" role="img" aria-label="{esc(label)}">'
        f'<span class="review-stars-filled">{filled}</span>'
        f'<span class="review-stars-empty" aria-hidden="true">{empty}</span>'
        f"</div>"
    )


def format_meta(review):
    parts = []
    service = (review.get("service") or review.get("hunt_type") or "").strip()
    town = (review.get("town") or review.get("year") or "").strip()
    if service:
        parts.append(service)
    if town:
        parts.append(town)
    submitted = (review.get("approved_at") or review.get("submitted_at") or "").strip()
    if submitted and len(submitted) >= 10:
        parts.append(submitted[:10])
    return " · ".join(parts)


def render_review_card(review):
    name = esc_text(review.get("name", "Customer"))
    text = esc_text(review.get("text", "")).replace("\n", "<br>")
    meta = format_meta(review)
    meta_html = f'<p class="review-meta">{esc_text(meta)}</p>' if meta else ""
    rating = int(review.get("rating") or 0)
    return (
        f'<article class="review-card">'
        f"{stars_html(rating)}"
        f'<p class="review-text">{text}</p>'
        f'<p class="review-name">— {name}</p>'
        f"{meta_html}"
        f"</article>"
    )


def render_reviews_section(reviews):
    if not reviews:
        return (
            '<section class="reviews-list-section" id="customer-reviews" aria-label="Customer reviews">\n'
            "<h2>What people say</h2>\n"
            '<p class="reviews-empty">Customer reviews will appear here after they are approved. '
            "You can share yours using the form below.</p>\n"
            "</section>"
        )
    cards = "\n".join(render_review_card(r) for r in reviews)
    return (
        '<section class="reviews-list-section" id="customer-reviews" aria-label="Customer reviews">\n'
        "<h2>What people say</h2>\n"
        f'<div class="reviews-grid">\n{cards}\n</div>\n'
        "</section>"
    )


def schema_block(reviews):
    if not reviews:
        return "  <!--REVIEWS_SCHEMA-->\n  <!--/REVIEWS_SCHEMA-->"
    ratings = [int(r.get("rating") or 0) for r in reviews if r.get("rating")]
    avg = round(sum(ratings) / len(ratings), 1) if ratings else 0
    items = []
    for r in reviews[:12]:
        body = json.dumps(str(r.get("text") or ""), ensure_ascii=False)
        name = json.dumps(str(r.get("name") or "Customer"), ensure_ascii=False)
        rating = int(r.get("rating") or 0)
        items.append(
            "{"
            f'"@type":"Review","author":{{"@type":"Person","name":{name}}},'
            f'"reviewBody":{body},"reviewRating":{{"@type":"Rating","ratingValue":{rating},"bestRating":5}}'
            "}"
        )
    inner = ",".join(items)
    return (
        "  <!--REVIEWS_SCHEMA-->\n"
        '  <script type="application/ld+json">\n'
        "  {"
        '"@context":"https://schema.org","@type":"LocalBusiness","name":"TLC PC Repairs",'
        f'"aggregateRating":{{"@type":"AggregateRating","ratingValue":{avg},"reviewCount":{len(reviews)},"bestRating":5}},'
        f'"review":[{inner}]'
        "}\n"
        "  </script>\n"
        "  <!--/REVIEWS_SCHEMA-->"
    )


def load_approved():
    if not APPROVED_FILE.is_file():
        return []
    data = json.loads(APPROVED_FILE.read_text(encoding="utf-8"))
    reviews = data.get("reviews", []) if isinstance(data, dict) else data
    return reviews if isinstance(reviews, list) else []


def replace_block(text, start, end, inner):
    if start not in text or end not in text:
        raise RuntimeError(f"Missing {start} markers in reviews.html")
    before, rest = text.split(start, 1)
    _, after = rest.split(end, 1)
    return before + start + "\n" + inner + "\n" + end + after


def build():
    reviews = load_approved()
    page = OUT_FILE.read_text(encoding="utf-8")
    page = replace_block(page, START, END, render_reviews_section(reviews))
    if SCHEMA_START in page and SCHEMA_END in page:
        before, rest = page.split(SCHEMA_START, 1)
        _, after = rest.split(SCHEMA_END, 1)
        page = before.rstrip() + "\n" + schema_block(reviews) + after
    OUT_FILE.write_text(page, encoding="utf-8")
    return OUT_FILE


def main():
    out = build()
    print(f"Built {out.name} from {APPROVED_FILE.relative_to(SITE)} ({len(load_approved())} approved)")


if __name__ == "__main__":
    main()
