package data

import (
	"encoding/json"
	"testing"
)

func TestGetEventKeepsCompleteJSONAndQualifiedFields(t *testing.T) {
	const original = `{"id":"evt_123456789012345","source":{"name":"Fixture"},"title":"Report","summary":"A report","contents":"## Event","date_published":"2026-10-30T12:00:00Z","source_window":{"start":"2026-10-30T11:00:00Z","end":"2026-10-30T13:00:00Z"},"language":"en","category":"defense","audience":"allied-forces","allied_relevance":"Provides allied situational awareness.","image_origin":"source","image_urls":["https://example.org/image.png"],"geo":{"lat":25.7,"lon":-80.1,"location_name":"Miami, Florida","precision":"city"},"links":[{"url":"https://example.org/report","text":"legacy link text"}],"legacy_note":{"retained":true}}`
	store := &Store{events: map[string]json.RawMessage{"evt_123456789012345": json.RawMessage(original)}}

	event, err := store.GetEvent("evt_123456789012345")
	if err != nil {
		t.Fatal(err)
	}
	if event == nil || event.ID != "evt_123456789012345" || event.SourceWindow == nil || event.SourceWindow.Start != "2026-10-30T11:00:00Z" || event.Geo == nil || event.Geo.LocationName != "Miami, Florida" || event.Geo.Precision != "city" || event.ImageOrigin != "source" || event.Links[0].Text != "legacy link text" {
		t.Fatalf("qualified fields were lost: %+v", event)
	}
	if string(event.RawJSON) != original {
		t.Fatal("original JSON was not retained")
	}

	missing, err := store.GetEvent("missing")
	if err != nil || missing != nil {
		t.Fatalf("missing event = %v, %v; want nil, nil", missing, err)
	}
}
