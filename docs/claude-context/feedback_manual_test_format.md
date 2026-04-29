---
name: CarBNB manual test handoff format
description: When user confirms a test section passed, print the NEXT section's full steps (not a one-line summary)
type: feedback
originSessionId: 45d3bee8-9adb-4917-a307-4510d175a6bd
---
When the user confirms a manual-test section passed (e.g. "T3-G is good"), the next reply must print the next section's **full numbered steps**, in the same format they were originally handed off.

Example of correct format:
```
T3-H · Detail page status actions
23. Go to /car-listings/{id} → click Approve Listing → status badge changes to Active, button changes to Suspend
24. Click Suspend → status changes to Suspended, Reactivate button appears
```

**Why:** The user is clicking through the steps in parallel; a one-line summary forces them to scroll back to find the full steps. Printing the numbered list again keeps the test instructions right where they are in the conversation.

**How to apply:**
- Use the same section label, same step numbers, same language I originally handed them.
- Don't re-explain or shorten — print the literal step text.
- Don't add meta commentary ("proceed to..." / "next up..."). Just the heading + numbered steps.
