## TODO

### Backend start verification
- [ ] Confirm backend has a `dev` script in `backend/package.json` (it currently does NOT).
- [ ] Add a `dev` script to `backend/package.json` so `npm run dev` works.
- [ ] Start backend and verify `GET /health` returns {"status":"ok"}.
- [ ] Start frontend and verify login flow works end-to-end.

### Frontend console noise cleanup
- [x] Add favicon link to reduce `/favicon.ico` 404 noise (uses `/favicon.svg`).
- [x] Improve LoginPage error handling/console logging for 401 Unauthorized.
- [ ] Optionally remove React Router Future Flag warnings (requires checking react-router version/future flags). 

