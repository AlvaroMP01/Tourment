import feedparser
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime

class NewsScraper:
    def __init__(self):
        # Usamos el feed de Gameriv que es mucho más estable (RSS)
        self.url = "https://www.vlr.gg/rss"

    def get_latest_news(self, limit=10):
        try:
            # Parseamos el feed
            feed = feedparser.parse(self.url)

            news_items = []
            
            for i, entry in enumerate(feed.entries[:limit]):
                # Mapeamos los campos del RSS al formato que espera nuestro Frontend
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
        except Exception as e:
            print(f"Error scraping RSS feed: {e}")
            return []

    def _format_date(self, date_str):
        """Convierte la fecha del feed a un formato legible."""
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
    # Test rápido
    scraper = NewsScraper()
    news = scraper.get_latest_news(3)
    print(f"Found {len(news)} news items via RSS:")
    for n in news:
        print(n)
