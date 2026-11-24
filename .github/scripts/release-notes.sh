#!/usr/bin/env bash
# Print the release notes for a version from CHANGELOG.md.
#   release-notes.sh X.Y.Z            -> the "## X.Y.Z" section, without its heading
#   release-notes.sh X.Y.Z A.B.C      -> every section from X.Y.Z down to A.B.C (excluded), so that
#                                        one release carries all the versions bumped since the previous
#                                        tag; the headings are kept when there is more than one section.
set -euo pipefail
awk -v v="$1" -v prev="${2:-}" '
  /^## / {
    if (!started) {
      if ($2 != v) next
      started = 1
    } else if (prev == "" || $2 == prev) {
      exit
    }
    n++; head[n] = $0; body[n] = ""; next
  }
  started { if (body[n] == "" && $0 == "") next; body[n] = body[n] $0 "\n" }
  END {
    for (i = 1; i <= n; i++) {
      if (n > 1) printf "%s\n\n", head[i]
      printf "%s", body[i]
    }
  }
' CHANGELOG.md | sed -e '/./,$!d'
