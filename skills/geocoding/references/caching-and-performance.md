# Geocoding Cache

`builder/runtime/geocode.sh` owns the cache. By default it uses `/tmp/geocoding-cache.json`; set `GEOCODING_CACHE` before calling it only when a run needs its own cache path. The helper initializes a small set of known locations, reuses valid numeric coordinate results, and writes new lookup results. Do not overwrite the file with a prompt-defined cache or a manually copied coordinate table.

```bash
export GEOCODING_CACHE="$WORK_DIR/geocoding-cache.json"
GEO=$(bash builder/runtime/geocode.sh "Gaziantep, Turkey")
```

Network lookups wait one second and use bounded curl timeouts. Repeated valid queries can reuse cached coordinates; unresolved or malformed cached entries do not count as valid points. Concurrent agents should use separate cache files if they share a filesystem.

The cache improves lookup performance; it does not establish that a cached place matches the event. Choose the location from source evidence before querying, then inspect the result's `display_name` when ambiguity matters.
