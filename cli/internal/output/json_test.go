package output

import (
	"bytes"
	"encoding/json"
	"reflect"
	"testing"

	"github.com/osint/cli/internal/data"
)

func TestJSONGetPreservesQualifiedAndHistoricalFields(t *testing.T) {
	for name, original := range map[string]string{
		"qualified":  `{"id":"evt_123456789012345","source":{"name":"Fixture"},"title":"Report","summary":"A report","contents":"## Event","date_published":"2026-10-30T12:00:00Z","source_window":{"start":"2026-10-30T11:00:00Z","end":"2026-10-30T13:00:00Z"},"language":"en","category":"defense","audience":"allied-forces","allied_relevance":"Provides allied situational awareness.","image_origin":"default","image_urls":["https://osint.builders/favicon.svg"],"geo":{"lat":25.7,"lon":-80.1,"location_name":"Miami, Florida","precision":"city"},"links":[{"url":"https://example.org/report"}]}`,
		"historical": `{"id":"evt_20261030_001","source":{"name":"Fixture"},"title":"Old report","summary":"A past report","contents":"Historical body","date_published":"2026-10-30T12:00:00Z","image_urls":[],"geo":{"lat":25.7,"lon":-80.1,"location":"Miami area"},"links":[{"url":"https://example.org/old","text":"old link"}],"confidence_score":0.5}`,
	} {
		t.Run(name, func(t *testing.T) {
			var event data.FullEvent
			if err := json.Unmarshal([]byte(original), &event); err != nil {
				t.Fatal(err)
			}
			event.RawJSON = json.RawMessage(original)
			var output bytes.Buffer
			if err := (&JSONFormatter{}).WriteEvent(&output, &event); err != nil {
				t.Fatal(err)
			}
			var want, got map[string]any
			if err := json.Unmarshal([]byte(original), &want); err != nil {
				t.Fatal(err)
			}
			if err := json.Unmarshal(output.Bytes(), &got); err != nil {
				t.Fatal(err)
			}
			if !reflect.DeepEqual(got, want) {
				t.Fatalf("JSON get changed the event:\nwant %v\ngot  %v", want, got)
			}
		})
	}
}
