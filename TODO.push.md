# Push (real-time socket) implementation plan

- [ ] Update backend/socket.ts to add user registration and emit events
- [ ] Update backend/routes.ts to emit:
  - [ ] patient:recommendation after /doctor/notify
  - [ ] doctor:call-request after /calls/request
- [ ] Update frontend:
  - [ ] Add socket listener on src/pages/HomePage.tsx for recommendation toasts
  - [ ] Add socket listener on src/pages/DoctorPatientPage.tsx for call-request toast + refresh list
- [ ] Quick manual test steps:
  - [ ] Doctor sends recommendation; patient should see toast
  - [ ] Patient requests call; doctor should see toast and pending count/list refresh

