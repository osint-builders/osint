#!/bin/bash
# Display example Word Event Entities for reference

echo "=== Word Event Entity Examples ==="
echo ""
echo "1. Natural Disaster Event (Complete)"
cat << 'EXAMPLE1'

{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "source": "reuters",
  "title": "Major Earthquake Strikes Turkey, Death Toll Rises",
  "summary": "A devastating 7.8 magnitude earthquake struck Turkey and Syria on February 6, 2023, causing widespread damage and thousands of casualties.",
  "details": "A major 7.8 magnitude earthquake struck Turkey and Syria at 04:17 UTC on Monday, February 6, 2023. The epicenter was located in Gaziantep Province, Turkey. Tremors were felt across the Middle East. Preliminary reports indicate over 5,000 casualties across both countries. Aftershocks continue. Emergency response underway.",
  "date_published": "2023-02-06T04:45:00Z",
  "date_occurred": "2023-02-06T04:17:00Z",
  "event_type": "natural-disaster",
  "severity": 9,
  "status": "ongoing",
  "geo": {
    "latitude": 37.27,
    "longitude": 37.02,
    "country": "TUR",
    "region": "Gaziantep",
    "city": "Gaziantep",
    "location_name": "Gaziantep Province, Turkey"
  },
  "links": [
    "https://www.reuters.com/world/middle-east/earthquake-deaths-2023-02-06/",
    "https://www.bbc.com/news/world-middle-east-64553314"
  ],
  "image_urls": [
    "https://example.com/earthquake-damage-01.jpg",
    "https://example.com/rescue-operations.jpg"
  ],
  "keywords": ["earthquake", "turkey", "disaster", "casualties"],
  "entities": [
    {"type": "location", "name": "Turkey"},
    {"type": "location", "name": "Syria"},
    {"type": "organization", "name": "Turkish Red Crescent"}
  ],
  "metadata": {
    "confidence": 0.95,
    "updated_at": "2023-02-07T12:30:00Z",
    "contributor": "system-crawler-001"
  }
}

EXAMPLE1

echo ""
echo "---"
echo ""
echo "2. Policy Announcement Event (Minimal Geographic)"
cat << 'EXAMPLE2'

{
  "id": "660f9510-f40c-52e5-b827-557766551111",
  "source": "official-eu",
  "title": "EU Announces New Climate Action Plan",
  "summary": "The European Union has announced an ambitious new climate action plan targeting carbon neutrality by 2050 with intermediate targets for 2030.",
  "details": "European Commission President announced the EU Green Deal, a comprehensive climate action plan. Key targets: 55% greenhouse gas reduction by 2030 (from 1990 levels), full carbon neutrality by 2050. Includes: carbon pricing, renewable energy targets, sustainable transport, circular economy measures. Budget allocation: €1 trillion over 10 years.",
  "date_published": "2023-02-07T10:00:00Z",
  "event_type": "policy",
  "severity": 7,
  "status": "active",
  "geo": {
    "country": "EUR",
    "location_name": "European Union"
  },
  "links": [
    "https://ec.europa.eu/info/strategy/priorities-2019-2024/european-green-deal_en"
  ],
  "image_urls": [
    "https://example.com/eu-climate-plan.jpg"
  ],
  "keywords": ["climate", "eu", "carbon-neutrality", "green-deal"],
  "entities": [
    {"type": "location", "name": "European Union"},
    {"type": "organization", "name": "European Commission"}
  ],
  "metadata": {
    "confidence": 0.98,
    "updated_at": "2023-02-07T10:00:00Z",
    "contributor": "admin-user"
  }
}

EXAMPLE2

echo ""
echo "---"
echo ""
echo "3. Social Unrest Event (Developing)"
cat << 'EXAMPLE3'

{
  "id": "770g0620-g51d-63f6-c938-668877662222",
  "source": "twitter-@newsagency",
  "title": "Protests Erupt in Downtown District",
  "summary": "Large-scale protests have begun in downtown area over policy changes. Police presence increased. Situation developing.",
  "details": "Thousands of protesters gathered in downtown Plaza starting around 14:00 local time. Initial reports indicate peaceful demonstration over proposed legislation. Police deployed with crowd control equipment. Some reports of minor scuffles. Media coverage ongoing. Organizers estimate 5,000+ participants.",
  "date_published": "2023-02-08T15:30:00Z",
  "date_occurred": "2023-02-08T14:00:00Z",
  "event_type": "protest",
  "severity": 5,
  "status": "developing",
  "geo": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "country": "USA",
    "region": "New York",
    "city": "New York",
    "location_name": "Downtown Plaza, New York City"
  },
  "links": [
    "https://twitter.com/newsagency/status/123456"
  ],
  "image_urls": [
    "https://example.com/protest-crowd.jpg",
    "https://example.com/police-presence.jpg"
  ],
  "keywords": ["protest", "downtown", "policy", "crowd"],
  "metadata": {
    "confidence": 0.65,
    "updated_at": "2023-02-08T16:00:00Z",
    "contributor": "system-crawler-002"
  }
}

EXAMPLE3

echo ""
echo "---"
echo ""
echo "Use analyze-entity.sh to inspect these examples:"
echo "  analyze-entity.sh example.json validate"
echo "  analyze-entity.sh example.json characterize"
echo "  analyze-entity.sh example.json fields"
