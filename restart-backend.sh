pkill -f 'node dist/index.js' || true
npm run build
node dist/index.js &
