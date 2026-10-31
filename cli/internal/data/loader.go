// Package data handles loading and decompressing the embedded OSINT data.
package data

import (
	"bytes"
	"compress/gzip"
	"encoding/binary"
	"encoding/json"
	"fmt"
	"io"
	"math"

	embedded "github.com/osint/cli/embed"
)

// Geo holds geographic information for an event.
type Geo struct {
	Lat          *float64 `json:"lat,omitempty"`
	Lon          *float64 `json:"lon,omitempty"`
	LocationName string   `json:"location_name,omitempty"`
	Precision    string   `json:"precision,omitempty"`
	Country      string   `json:"country,omitempty"`
	Region       string   `json:"region,omitempty"`
	City         string   `json:"city,omitempty"`
}

// Link holds a source URL.
type Link struct {
	URL   string `json:"url"`
	Label string `json:"label,omitempty"`
	Text  string `json:"text,omitempty"`
}

// SourceWindow records the original Identify scan window for a qualified event.
type SourceWindow struct {
	Start string `json:"start"`
	End   string `json:"end"`
}

// EventMeta is the searchable metadata for an event (from metadata.json).
type EventMeta struct {
	ID               string   `json:"id"`
	Title            string   `json:"title"`
	Summary          string   `json:"summary"`
	DateEvent        *string  `json:"date_event"`
	DatePublished    string   `json:"date_published"`
	Geo              *Geo     `json:"geo,omitempty"`
	Topics           []string `json:"topics"`
	Confidence       *float64 `json:"confidence"`
	SourceName       string   `json:"source_name"`
	Links            []Link   `json:"links"`
	LinkPreviewImage *string  `json:"link_preview_image"`
}

// EffectiveDate returns date_event if present, otherwise date_published.
func (e *EventMeta) EffectiveDate() string {
	if e.DateEvent != nil && *e.DateEvent != "" {
		return *e.DateEvent
	}
	return e.DatePublished
}

// Source holds the source object from a full event.
type Source struct {
	Name     string `json:"name"`
	Provider string `json:"provider,omitempty"`
	Email    string `json:"email,omitempty"`
}

// LinkPreview holds cached link preview data.
type LinkPreview struct {
	Title       string `json:"title,omitempty"`
	Description string `json:"description,omitempty"`
	Image       string `json:"image,omitempty"`
	URL         string `json:"url,omitempty"`
}

// FullEvent is the complete event record from the JSONL files.
type FullEvent struct {
	ID              string          `json:"id"`
	Source          Source          `json:"source"`
	Title           string          `json:"title"`
	Summary         string          `json:"summary"`
	Contents        string          `json:"contents"`
	DatePublished   string          `json:"date_published"`
	SourceWindow    *SourceWindow   `json:"source_window,omitempty"`
	DateEvent       *string         `json:"date_event,omitempty"`
	Links           []Link          `json:"links"`
	ImageURLs       []string        `json:"image_urls"`
	ImageOrigin     string          `json:"image_origin,omitempty"`
	Language        string          `json:"language,omitempty"`
	Category        string          `json:"category,omitempty"`
	Audience        string          `json:"audience,omitempty"`
	AlliedRelevance string          `json:"allied_relevance,omitempty"`
	Geo             *Geo            `json:"geo,omitempty"`
	Topics          []string        `json:"topics,omitempty"`
	Confidence      *float64        `json:"confidence,omitempty"`
	IngestedAt      string          `json:"ingested_at,omitempty"`
	LinkPreview     *LinkPreview    `json:"link_preview,omitempty"`
	RawJSON         json.RawMessage `json:"-"` // Complete original record for JSON output.
}

// Schema holds index metadata.
type Schema struct {
	Version        string `json:"version"`
	EmbeddingModel string `json:"embedding_model"`
	EmbeddingDims  int    `json:"embedding_dims"`
	EmbeddingFile  string `json:"embedding_file"`
	EventCount     int    `json:"event_count"`
	LastUpdated    string `json:"last_updated"`
}

// Store holds all loaded data in memory.
type Store struct {
	Metadata   []EventMeta
	events     map[string]json.RawMessage // complete JSONL rows, keyed by event ID
	Embeddings []float32                  // flat array, N*384
	Schema     Schema
	ByTopic    map[string][]string // topic -> event IDs
	ByLocation map[string][]string // location -> event IDs
	BySource   map[string][]string // source -> event IDs
	IDToIndex  map[string]int      // event ID -> index in Metadata/Embeddings
	Dims       int
}

// decompress reads a gzip-compressed byte slice and returns the decompressed content.
func decompress(data []byte) ([]byte, error) {
	r, err := gzip.NewReader(bytes.NewReader(data))
	if err != nil {
		return nil, fmt.Errorf("gzip reader: %w", err)
	}
	defer r.Close()
	return io.ReadAll(r)
}

// Load decompresses all embedded data and builds the in-memory store.
func Load() (*Store, error) {
	s := &Store{
		events: make(map[string]json.RawMessage),
		Dims:   384,
	}

	// Load schema
	schemaBytes, err := decompress(embedded.Schema)
	if err != nil {
		return nil, fmt.Errorf("decompress schema: %w", err)
	}
	if err := json.Unmarshal(schemaBytes, &s.Schema); err != nil {
		return nil, fmt.Errorf("parse schema: %w", err)
	}

	// Load metadata
	metaBytes, err := decompress(embedded.Metadata)
	if err != nil {
		return nil, fmt.Errorf("decompress metadata: %w", err)
	}
	if err := json.Unmarshal(metaBytes, &s.Metadata); err != nil {
		return nil, fmt.Errorf("parse metadata: %w", err)
	}

	// Build ID -> index map
	s.IDToIndex = make(map[string]int, len(s.Metadata))
	for i, m := range s.Metadata {
		s.IDToIndex[m.ID] = i
	}

	// Load embeddings (flat float32 binary)
	embBytes, err := decompress(embedded.Embeddings)
	if err != nil {
		return nil, fmt.Errorf("decompress embeddings: %w", err)
	}
	numFloats := len(embBytes) / 4
	s.Embeddings = make([]float32, numFloats)
	for i := 0; i < numFloats; i++ {
		bits := binary.LittleEndian.Uint32(embBytes[i*4 : (i+1)*4])
		s.Embeddings[i] = math.Float32frombits(bits)
	}

	// Load full events from concatenated JSONL
	eventsBytes, err := decompress(embedded.Events)
	if err != nil {
		return nil, fmt.Errorf("decompress events: %w", err)
	}
	for _, line := range bytes.Split(eventsBytes, []byte{'\n'}) {
		line = bytes.TrimSpace(line)
		if len(line) == 0 {
			continue
		}
		var evt struct {
			ID string `json:"id"`
		}
		if err := json.Unmarshal(line, &evt); err != nil || evt.ID == "" {
			continue // skip malformed lines
		}
		// Each slice references the one decompressed events buffer. Decode only
		// the requested event later, retaining unknown historical/future fields.
		s.events[evt.ID] = line
	}

	// Load index files
	s.ByTopic, _ = loadIndex(embedded.ByTopic)
	s.ByLocation, _ = loadIndex(embedded.ByLocation)
	s.BySource, _ = loadIndex(embedded.BySource)

	return s, nil
}

// GetEvent decodes one full event on demand and retains its original JSON.
// A nil event with no error means the ID was not found.
func (s *Store) GetEvent(id string) (*FullEvent, error) {
	raw, ok := s.events[id]
	if !ok {
		return nil, nil
	}
	var event FullEvent
	if err := json.Unmarshal(raw, &event); err != nil {
		return nil, fmt.Errorf("decode event %s: %w", id, err)
	}
	event.RawJSON = raw
	return &event, nil
}

func loadIndex(compressed []byte) (map[string][]string, error) {
	data, err := decompress(compressed)
	if err != nil {
		return nil, err
	}
	var idx map[string][]string
	if err := json.Unmarshal(data, &idx); err != nil {
		return nil, err
	}
	return idx, nil
}
