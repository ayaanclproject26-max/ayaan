# Manual QA Discovered Bugs & Issues Log

**Project:** Ayaan Clothing B2B Export Platform  
**Tracking Started:** 2026-08-31  

---

## Fixed Small Bugs

| Bug ID | Feature | Description | File(s) Modified | Verified |
| :--- | :--- | :--- | :--- | :--- |
| **BUG-001** | Order Commercial Documents & Access Control | Fixed missing Sanctum auth & explicit customer ownership verification on `/api/v1/orders/{id}/documents/{docType}` | `backend/routes/api.php`, `backend/app/Http/Controllers/Api/V1/OrderController.php`, `backend/tests/Feature/Order/OrderCommercialDocumentsTest.php` | ✅ PASS (401 unauth, 403 non-owner, 200 owner, 200 admin) |

---

## Deferred / Documented Medium & Large Bugs

*No remaining deferred bugs.*

---

## Bug Details & Resolution History

### BUG-001: Commercial Document Route Missing Sanctum Authorization Middleware
- **BUG-ID:** BUG-001
- **FEATURE:** Order Commercial Documents & Access Control
- **SEVERITY:** High (Authorization Boundary)
- **URL:** `/api/v1/orders/{id}/documents/{docType}`
- **ROLE:** Customer / Guest
- **STATUS:** FIXED
- **DO NOT FIX NOW:** NO

#### Root Cause:
In `backend/routes/api.php`, `Route::get('/{id}/documents/{docType}')` was previously declared outside the `Route::middleware('auth:sanctum')` group. Because Sanctum middleware was omitted on this route, `$request->user()` evaluated to `null`, bypassing the customer ownership check `if ($user && $order->user_id !== null && ...)` in `OrderController::document()`.

#### Exact Fix:
1. **Route Protection:** Moved `Route::get('/{id}/documents/{docType}', [OrderController::class, 'document'])` inside `Route::middleware('auth:sanctum')` in [`backend/routes/api.php`](file:///Users/luhasan/Documents/ayaan/backend/routes/api.php#L133).
2. **Explicit Controller Authorization:** Updated [`OrderController::document()`](file:///Users/luhasan/Documents/ayaan/backend/app/Http/Controllers/Api/V1/OrderController.php#L590-L609) to explicitly enforce:
   - Unauthenticated requests immediately receive `401 Unauthorized`.
   - Authenticated customers requesting an order they do not own receive `403 Forbidden` (`You are not authorized to view commercial documents for this order`).
   - Order owner and Admin roles retain authorized access (subject to standard payment gating).
3. **Automated Test Coverage:** Added dedicated security feature tests in [`backend/tests/Feature/Order/OrderCommercialDocumentsTest.php`](file:///Users/luhasan/Documents/ayaan/backend/tests/Feature/Order/OrderCommercialDocumentsTest.php) verifying 401 on unauthenticated calls, 403 across all doc types (`ORDER_SHEET`, `PROFORMA_INVOICE`, `COMMERCIAL_INVOICE`, `PACKING_LIST`) for unauthorized users, and 200 for owner and admin.

#### Verification Result:
- Direct HTTP endpoint tests confirmed: Unauthenticated = 401, Customer A = 403, Customer B (owner) = 200, Admin = 200.
- Automated tests: 129 / 129 passed in `php artisan test`.
