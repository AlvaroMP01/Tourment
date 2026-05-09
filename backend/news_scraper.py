import logging
import feedparser
import requests
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime

logger = logging.getLogger(__name__)

# Timeout para la request HTTP al feed externo. Sin esto, si VLR está caído o
# lento, cada GET /api/news cuelga el worker de Gunicorn hasta el timeout del
# OS (puede ser minutos) y rompe el endpoint para todos los usuarios.
RSS_TIMEOUT_SECONDS = 5


class NewsScraper:
    def __init__(self):
        self.url = "https://www.vlr.gg/rss"

    def get_latest_news(self, limit=10):
        try:
            # Bajamos el feed con timeout estricto, después se lo pasamos a
            # feedparser. feedparser.parse(url) directo NO acepta timeout.
            response = requests.get(
                self.url,
                timeout=RSS_TIMEOUT_SECONDS,
                headers={"User-Agent": "Tourment/1.0 (RSS reader)"},
            )
            response.raise_for_status()
            feed = feedparser.parse(response.content)
        except (requests.RequestException, requests.Timeout) as e:
            # Log estructurado en lugar de print: en Railway/prod los prints
            # sin formato son ilegibles entre los demás logs.
            logger.warning("Falla al obtener feed de VLR.gg: %s", e)
            return []
        except Exception as e:
            logger.exception("Error inesperado parseando feed de VLR.gg: %s", e)
            return []

        news_items = []
        for i, entry in enumerate(feed.entries[:limit]):
            news_items.append({
                "id": i + 1,
                "title": entry.get('title', 'Sin título'),
                "description": entry.get("description", entry.get("summary", "")),
                "link": entry.get('link', ''),
                "date": self._format_date(
                    entry.get("published", entry.get("updated", entry.get("pubDate", "")))
                ),
            })
        return news_items

    def _format_date(self, date_str):
        if not date_str:
            return datetime.now().strftime("%Y-%m-%d")
        if isinstance(date_str, datetime):
            dt = date_str
        else:
            try:
                dt = parsedate_to_datetime(str(date_str))
            except Exception:
                return datetime.now().strftime("%Y-%m-%d")

        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc).strftime("%Y-%m-%d")

if __name__ == "__main__":
    scraper = NewsScraper()
    news = scraper.get_latest_news(3)
    print(f"Found {len(news)} news items via RSS:")
    for n in news:
        print(n)
