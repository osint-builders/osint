"""Regression tests for retention and the published semantic index."""

from contextlib import redirect_stdout
import importlib.util
import io
import json
import os
from pathlib import Path
import shlex
import shutil
import subprocess
import sys
import tempfile
import types
import unittest
from unittest.mock import patch

import numpy as np


REPO_ROOT = Path(__file__).resolve().parents[3]
BUILD_INDEX = REPO_ROOT / "builder" / "embeddings" / "build_index.py"
VERIFY_INDEX = REPO_ROOT / "builder" / "embeddings" / "verify_index.py"
CLEANUP = REPO_ROOT / "data" / "scripts" / "cleanup-old-data.sh"
EMBEDDING_DIMS = 384


class FakeEmbedder:
    calls = 0

    def embed_texts(self, texts):
        type(self).calls += 1
        return np.ones((len(texts), EMBEDDING_DIMS), dtype=np.float32)


def load_builder():
    # Model weights are irrelevant to these artifact-consistency tests.
    fake_module = types.ModuleType("embedder")
    fake_module.Embedder = FakeEmbedder
    fake_module.prepare_embedding_text = lambda title, summary: f"{title} {summary}"
    with patch.dict(sys.modules, {"embedder": fake_module}):
        spec = importlib.util.spec_from_file_location("release_test_build_index", BUILD_INDEX)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
    return module, fake_module


def load_verifier(builder):
    with patch.dict(sys.modules, {"build_index": builder}):
        spec = importlib.util.spec_from_file_location("release_test_verify_index", VERIFY_INDEX)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
    return module


def event(event_id, *, geo=None):
    return {
        "id": event_id,
        "title": f"Event {event_id}",
        "summary": "A short summary",
        "contents": "Long contents for the fingerprint",
        "date_published": "2026-10-01T12:00:00Z",
        "source": {"name": "Fixture Source"},
        "geo": geo or {"lat": 12.0, "lon": 34.0},
    }


class BuildIndexConsistencyTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.builder, cls.fake_module = load_builder()
        cls.verifier = load_verifier(cls.builder)

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="osint-index-test-")
        self.root = Path(self.temp.name)
        (self.root / "data" / "events" / "2026-10").mkdir(parents=True)
        FakeEmbedder.calls = 0

    def tearDown(self):
        self.temp.cleanup()

    def write_events(self, filename, events):
        target = self.root / "data" / "events" / "2026-10" / filename
        target.write_text("".join(json.dumps(item) + "\n" for item in events), encoding="utf-8")
        return target

    def build(self):
        with patch.dict(sys.modules, {"embedder": self.fake_module}), patch.dict(
            os.environ, {"REPO_ROOT": str(self.root)}
        ), redirect_stdout(io.StringIO()):
            try:
                self.builder.main()
            except SystemExit as error:
                self.assertEqual(error.code, 0)

    def read_artifacts(self):
        output = self.root / "data" / "indexes"
        metadata = json.loads((output / "metadata.json").read_text(encoding="utf-8"))
        fingerprints = json.loads((output / "fingerprints.json").read_text(encoding="utf-8"))
        schema = json.loads((output / "schema.json").read_text(encoding="utf-8"))
        binary_size = (output / "embeddings.bin").stat().st_size
        return metadata, fingerprints, schema, binary_size

    def test_no_change_skips_embedding_when_all_artifacts_match(self):
        self.write_events("2026-10-01.jsonl", [event("one")])
        self.build()
        self.build()
        self.assertEqual(FakeEmbedder.calls, 1)

    def test_deleting_a_row_with_duplicate_id_rebuilds_all_artifacts(self):
        first = self.write_events("2026-10-01.jsonl", [event("shared")])
        self.write_events("2026-10-02.jsonl", [event("shared")])
        self.build()
        self.assertEqual(self.read_artifacts()[3], 2 * EMBEDDING_DIMS * 4)

        first.unlink()
        self.build()
        metadata, fingerprints, schema, binary_size = self.read_artifacts()
        self.assertEqual(FakeEmbedder.calls, 2)
        self.assertEqual([item["id"] for item in metadata], ["shared"])
        self.assertEqual(set(fingerprints), {"shared"})
        self.assertEqual(schema["event_count"], 1)
        self.assertEqual(binary_size, EMBEDDING_DIMS * 4)

    def test_metadata_only_change_updates_search_result(self):
        target = self.write_events("2026-10-01.jsonl", [event("one")])
        self.build()
        target.write_text(
            json.dumps(event("one", geo={"lat": 50.0, "lon": 60.0})) + "\n",
            encoding="utf-8",
        )
        self.build()
        metadata, _, _, _ = self.read_artifacts()
        self.assertEqual(metadata[0]["geo"], {"lat": 50.0, "lon": 60.0})

    def test_row_reordering_rebuilds_metadata_and_embedding_alignment(self):
        target = self.write_events("2026-10-01.jsonl", [event("one"), event("two")])
        self.build()
        target.write_text(
            "".join(json.dumps(item) + "\n" for item in [event("two"), event("one")]),
            encoding="utf-8",
        )
        self.build()
        metadata, _, schema, binary_size = self.read_artifacts()
        self.assertEqual([item["id"] for item in metadata], ["two", "one"])
        self.assertEqual(schema["event_count"], 2)
        self.assertEqual(binary_size, 2 * EMBEDDING_DIMS * 4)

    def test_missing_schema_is_repaired_on_no_change_run(self):
        self.write_events("2026-10-01.jsonl", [event("one")])
        self.build()
        schema_path = self.root / "data" / "indexes" / "schema.json"
        schema_path.unlink()
        self.build()
        self.assertEqual(self.read_artifacts()[2]["event_count"], 1)

    def test_empty_corpus_clears_previous_artifacts(self):
        target = self.write_events("2026-10-01.jsonl", [event("one")])
        self.build()
        target.unlink()
        self.build()
        metadata, fingerprints, schema, binary_size = self.read_artifacts()
        self.assertEqual(metadata, [])
        self.assertEqual(fingerprints, {})
        self.assertEqual(schema["event_count"], 0)
        self.assertEqual(binary_size, 0)
        self.assertEqual(FakeEmbedder.calls, 1)

    def test_release_verifier_checks_stats_and_semantic_metadata(self):
        self.write_events("2026-10-01.jsonl", [event("one")])
        self.build()
        indexes = self.root / "data" / "indexes"
        for name in ("by-source.json", "by-topic.json", "by-location.json"):
            (indexes / name).write_text("[]\n", encoding="utf-8")
        stats_path = self.root / "data" / "stats.json"
        stats = {
            "data_range": {"oldest_date": "2026-10-01", "newest_date": "2026-10-01"},
            "statistics": {"total_events": 1},
        }
        stats_path.write_text(json.dumps(stats), encoding="utf-8")

        with redirect_stdout(io.StringIO()):
            self.assertEqual(self.verifier.verify_release_data(self.root), 1)

        stats["statistics"]["total_events"] = 0
        stats_path.write_text(json.dumps(stats), encoding="utf-8")
        with redirect_stdout(io.StringIO()), self.assertRaisesRegex(ValueError, "event count"):
            self.verifier.verify_release_data(self.root)

        stats["statistics"]["total_events"] = 1
        stats_path.write_text(json.dumps(stats), encoding="utf-8")
        metadata_path = indexes / "metadata.json"
        metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
        metadata[0]["title"] = "Stale title"
        metadata_path.write_text(json.dumps(metadata), encoding="utf-8")
        with redirect_stdout(io.StringIO()), self.assertRaisesRegex(ValueError, "Semantic index"):
            self.verifier.verify_release_data(self.root)


class RetentionBoundaryTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="osint-retention-test-")
        self.root = Path(self.temp.name)
        scripts = self.root / "data" / "scripts"
        scripts.mkdir(parents=True)
        shutil.copyfile(CLEANUP, scripts / CLEANUP.name)
        self.script = scripts / CLEANUP.name
        self.events = self.root / "data" / "events"

    def tearDown(self):
        self.temp.cleanup()

    def write_day(self, day):
        month = self.events / day[:7]
        month.mkdir(parents=True, exist_ok=True)
        target = month / f"{day}.jsonl"
        target.write_text("{}\n", encoding="utf-8")
        return target

    @staticmethod
    def bash_path(path):
        if os.name != "nt":
            return str(path)
        completed = subprocess.run(
            ["bash", "-lc", f"wslpath -a {shlex.quote(str(path))}"],
            capture_output=True,
            text=True,
            check=True,
        )
        return completed.stdout.strip()

    def run_cleanup(self, dry_run=False):
        command = f"RETENTION_TODAY=2026-10-15 bash {shlex.quote(self.bash_path(self.script))}"
        if dry_run:
            command += " --dry-run"
        completed = subprocess.run(
            ["bash", "-lc", command],
            capture_output=True,
            text=True,
        )
        self.assertEqual(completed.returncode, 0, completed.stdout + completed.stderr)

    def test_exact_day_boundary_and_dry_run(self):
        # 90 days before October 15 is July 17; both sides of the cutoff
        # occupy the same month and expose month-only cleanup errors.
        expired_month = self.write_day("2026-06-30")
        expired_day = self.write_day("2026-07-16")
        cutoff_day = self.write_day("2026-07-17")
        newer_day = self.write_day("2026-07-18")

        self.run_cleanup(dry_run=True)
        self.assertTrue(all(p.exists() for p in [expired_month, expired_day, cutoff_day, newer_day]))

        self.run_cleanup()
        self.assertFalse(expired_month.exists())
        self.assertFalse(expired_day.exists())
        self.assertFalse(expired_month.parent.exists())
        self.assertTrue(cutoff_day.exists())
        self.assertTrue(newer_day.exists())

    def test_all_expired_files_can_be_removed(self):
        expired = self.write_day("2026-06-30")
        self.run_cleanup()
        self.assertFalse(expired.exists())
        self.assertTrue(self.events.exists())


if __name__ == "__main__":
    unittest.main()
