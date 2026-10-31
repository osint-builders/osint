#!/usr/bin/env python3
"""Extract recent article candidates from an RSS 2.0 feed on stdin."""

import html
import ipaddress
import json
import os
import re
import sys
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from typing import Optional
from urllib.parse import urlparse
from xml.etree import ElementTree


def read_window(name: str) -> datetime:
    return datetime.fromisoformat(os.environ[name].replace("Z", "+00:00"))


def public_url(url: str, feed_host: Optional[str] = None) -> bool:
    try:
        parsed = urlparse(url)
        host = (parsed.hostname or "").lower().rstrip(".")
        port = parsed.port
    except ValueError:
        return False
    if parsed.scheme not in {"http", "https"} or not host:
        return False
    if parsed.username is not None or parsed.password is not None:
        return False
    if port is not None and port != (80 if parsed.scheme == "http" else 443):
        return False

    try:
        address = ipaddress.ip_address(host)
    except ValueError:
        if host == "localhost" or host.endswith((".localhost", ".local", ".internal")):
            return False
        labels = host.split(".")
        if len(labels) < 2 or not all(re.fullmatch(r"[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?", part) for part in labels):
            return False
        if not re.fullmatch(r"(?:[a-z]{2,63}|xn--[a-z0-9-]+)", labels[-1]):
            return False
    else:
        if not address.is_global:
            return False

    if feed_host:
        normalized = host.removeprefix("www.")
        publisher = feed_host.removeprefix("www.")
        if normalized != publisher and not normalized.endswith("." + publisher):
            return False
    return True


def candidates(feed: bytes) -> list[dict[str, str]]:
    root = ElementTree.fromstring(feed)
    channel = root.find("channel")
    if root.tag != "rss" or channel is None:
        raise ValueError("expected RSS 2.0 channel")

    start = read_window("RSS_WINDOW_START")
    end = read_window("RSS_WINDOW_END")
    limit = int(os.environ["RSS_MAX_CANDIDATES"])
    feed_url = os.environ.get("RSS_FEED_URL", "")
    if feed_url and not public_url(feed_url):
        raise ValueError("RSS feed URL is not public HTTP(S)")
    feed_host = (urlparse(feed_url).hostname or "").lower().rstrip(".") if feed_url else None
    articles: list[tuple[datetime, str, str]] = []
    dated_items = 0

    for item in channel.findall("item"):
        published = (item.findtext("pubDate") or "").strip()
        try:
            date = parsedate_to_datetime(published)
        except (TypeError, ValueError):
            continue
        if date.tzinfo is None:
            continue
        date = date.astimezone(timezone.utc)
        dated_items += 1
        if not start < date <= end:
            continue

        url = (item.findtext("link") or "").strip()
        if not public_url(url, feed_host):
            continue

        title = html.unescape((item.findtext("title") or "").strip())
        articles.append((date, url, title))

    result: list[dict[str, str]] = []
    seen_urls: set[str] = set()
    for date, url, title in sorted(articles, reverse=True):
        if url in seen_urls:
            continue
        result.append({
            "url": url,
            "snippet": title[:280],
            "published_at": date.isoformat().replace("+00:00", "Z"),
        })
        seen_urls.add(url)
        if len(result) == limit:
            break

    if channel.findall("item") and dated_items == 0:
        raise ValueError("RSS items lack parseable publication dates")
    return result


if __name__ == "__main__":
    try:
        print(json.dumps(candidates(sys.stdin.buffer.read())))
    except (ElementTree.ParseError, ValueError) as error:
        print(f"RSS parser: {error}", file=sys.stderr)
        sys.exit(1)
