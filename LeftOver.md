1) add original RazorPay API keys int he code as well as on the render 





Please implement and refine the Notification System for CampusHive end-to-end (Backend + Mobile App Frontend):

1. Dynamic Unread Count & Bell Badge:
   - Make the NotificationBell component in `components/ui/NotificationBell.tsx` fetch the exact number of unread notifications from `GET /api/notifications`.
   - Calculate and display the exact unread count (e.g. 1, 4, 12, up to 99+) in the red badge. Hide the badge if there are 0 unread notifications.
   - Use `useFocusEffect` so the bell badge instantly updates whenever the user returns to any screen.

2. Replace All Header Bells:
   - Use the dynamic `<NotificationBell />` component across all app screen headers (`index.tsx`, `marketplace.tsx`, `profile.tsx`, `earnings.tsx`, etc.). Ensure no static/hardcoded red dots remain.

3. Marking Notifications as Read:
   - When the user opens `app/notifications.tsx` or taps on a notification card, call `PUT /api/notifications/:id/read` (or `PUT /api/notifications/read-all`) to mark them as read.
   - Ensure the bell count badge automatically clears/decrements in real time.

4. Backend Notification Triggers:
   - Trigger notifications on key app events (e.g. Order Created `ORDER_REQUEST`, Order Accepted `ORDER_ACCEPTED`, Payment Confirmation, New Reviews).

5. Verification & Clean Code:
   - Ensure clean TypeScript imports with no missing modules, and test that all database queries and endpoints return status 200 OK.
