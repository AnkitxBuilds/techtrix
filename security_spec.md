# FoodBridge Security Specification & Threat Model

## 1. Core Data Invariants

1. **Identity & Ownership Invariant:** A donor cannot create a donation on behalf of a different establishment or modify another donor's surplus listings.
2. **Privilege Escalation Invariant:** A user document created at `/users/{userId}` cannot grant itself `role: 'admin'`, nor can an organization document self-verify (`verified: true`). Only Food Safety Desk administrators can alter verification status.
3. **Safety & Status Locking Invariant:** Expired or flagged food listings cannot be accepted by any recipient. Listings that reach terminal status (`delivered` or `cancelled`) cannot be retroactively edited.
4. **Quota Integrity Invariant:** A recipient's quota allocation cannot be modified arbitrarily; acceptance must be accompanied by an atomic status transition from `available` to `accepted`.
5. **Audit Immutability Invariant:** Once an audit log is written to `/donations/{id}/history/{historyId}`, it cannot be edited or deleted by any actor.

---

## 2. The "Dirty Dozen" Attack Payloads

1. **Ghost Field Escalation:** Injecting `verified: true` into an unverified `/organizations/{orgId}` payload during profile update.
2. **Self-Admin Grant:** Setting `role: 'admin'` or writing to `/admins/{uid}` from an untrusted client session.
3. **Impersonation on Creation:** Creating a `/donations/{donationId}` with `donorId: 'victim-hotel'` while signed in as `malicious-user`.
4. **Double-Claim Race:** Two recipients attempting to write `status: 'accepted'` to the same donation simultaneously.
5. **Quota Bypass:** A recipient with 10 kg remaining capacity attempting to accept a 60 kg batch by omitting the quota check.
6. **Post-Delivery Invalidation:** Calling `deleteDoc` or setting `status: 'cancelled'` on an already delivered food consignment.
7. **Audit Log Tampering:** Updating an existing audit item in `/donations/{id}/history/{historyId}` to alter temperature check records.
8. **Expired Batch Claim:** Submitting an acceptance payload for a donation whose `deadlineAt` timestamp has elapsed.
9. **Unverified NGO Claim:** An organization with `verified: false` submitting an acceptance transition payload.
10. **Storage Mismatch Exploitation:** A recipient without certified cold storage attempting to accept frozen meat batches.
11. **Denial of Wallet ID Poisoning:** Attempting to create a document with a 50KB path ID or arbitrary unicode junk.
12. **Blanket Query Scraping:** Attempting an unindexed read across private user data collections without ownership filters.
