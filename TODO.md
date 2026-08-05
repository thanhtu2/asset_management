# Implementation Plan: Purchase Proposal Feature

## Status: In Progress

### 1. Database Migration ✅ [Completed - DB tables added]
- [x] Update `backend/src/config/init.sql` with new tables (roles, permissions, role_permissions, purchase_proposals)
- [x] Run database initialization

### 2. Backend Implementation ✅
- [x] Create `backend/src/models/PurchaseProposal.js`
- [x] Create `backend/src/controllers/purchaseProposal.controller.js` 
- [x] Create `backend/src/routes/purchase.routes.js`
- [x] Update `backend/src/app.js` - add route
- [x] Update role_permissions for new roles/permissions via UI

### 3. Frontend Implementation ✅
- [x] Create `frontend/src/pages/PurchaseProposalPage.jsx`
- [x] Update `frontend/src/api/index.js` - add purchaseProposalsAPI
- [x] Update `frontend/src/layouts/MainLayout.jsx` - add menu item
- [x] Lock inputs for submitted proposals, add dynamic RBAC approval buttons

### 4. Testing & Notifications
- [x] Create test users (purchase-requester, department-leader, director)
- [x] Test full workflow: create → dept approve → director approve
- [ ] Verify notifications

### 5. Completion
- [x] attempt_completion
