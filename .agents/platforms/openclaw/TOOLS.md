# TOOLS.md — Local Gamukis Command Reference

Command notes for agents. This file does not configure tool availability.

- Frontend build: `cd Frontend && npm run build`
- Frontend test: `cd Frontend && npx react-scripts test --watchAll=false --runInBand`
- Backend test: `cd Backend && npm test`
- Backend dev: `cd Backend && npm run dev` (requires MySQL and Redis; do not start without task authorization)
- Agent setup validation: `node scripts/agents.mjs check`

Never record credentials, channel tokens, or database passwords in this file.
