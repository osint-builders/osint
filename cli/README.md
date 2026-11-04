# OSINT CLI

Download the executable for your platform from the [CLI release](https://github.com/osint-builders/osint/releases/tag/cli-latest). It includes the event data and search index, so queries work offline.

`cli-latest` is a rolling release. Each successful index build refreshes its five binaries and shows the build date, event count, index time, and source commit in the release details.

Released binaries check for a new CLI release daily, with hourly retries after a failed check. The check runs in the background. When an update is available, the CLI downloads the matching binary, verifies its SHA-256 digest, and installs it. The current command continues with its existing data. On Windows, installation finishes after the current command exits. An unavailable network or update does not stop a query.

Run `osintcli update` to check immediately. Set `OSINTCLI_NO_UPDATE=1` to disable automatic checks. Installing an update requires write access to the executable's directory.
