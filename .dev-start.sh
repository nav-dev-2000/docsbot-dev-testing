#!/bin/bash
# Fix FIREBASE_SERVICE_ACCOUNT_KEY: replace literal newlines with \n escape sequences
# so that JSON.parse in firebase-server.config.js can parse it correctly.
if [ -n "$FIREBASE_SERVICE_ACCOUNT_KEY" ]; then
  export FIREBASE_SERVICE_ACCOUNT_KEY
  FIREBASE_SERVICE_ACCOUNT_KEY=$(python3 -c "
import os, json, sys
val = os.environ.get('FIREBASE_SERVICE_ACCOUNT_KEY', '')
try:
    parsed = json.loads(val, strict=False)
    print(json.dumps(parsed, separators=(',', ':')))
except Exception:
    print(val, end='')
")
fi
exec npm run dev
