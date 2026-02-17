# CSAM Email Feature

This feature allows users to share assessment reports with their Microsoft Customer Success Account Manager (CSAM) if they have a Microsoft Unified Support Agreement.

## Implementation Overview

### 1. Survey Question Added

A new question group was added to the end of the questionnaire:

**Question:** "Do you have a Microsoft Unified Support Agreement with a named CSAM (Customer Success Account Manager)?"

**Answer Options:**

- Yes, I have a Unified Support Agreement with a named CSAM
- No, I don't have a Unified Support Agreement or CSAM
- I'm not sure

### 2. Optional Email Input

When users select "Yes" to having a CSAM, an optional email input field appears on the same page:

- **Field:** CSAM Email Address (Optional)
- **Description:** "If you'd like to share this report with your CSAM, provide their email address"
- **Validation:** Email format enforced by HTML5 input type
- **Styling:** Blue-highlighted box to draw attention

### 3. Email to CSAM Button

On the Results page, if a CSAM email was provided, a prominent button appears:

**Button:** "✉️ Email to CSAM"

**Functionality:**

- Only displays if CSAM email was provided during survey
- Generates a mailto: hyperlink with:
  - **To:** CSAM's email address
  - **Subject:** "Microsoft Agentic Solution Assessment - [Recommendation Type]"
  - **Body:** Complete assessment report in Markdown format including:
    - Recommendation title
    - Confidence level
    - All survey questions and answers
    - Detailed recommendation summary
    - Next steps and compliance considerations
    - Source links

### 4. User Flow

```
1. User completes questionnaire
2. On "Support & Account Management" step:
   - Selects "Yes" for having a CSAM
   - Email input field appears
   - Optionally enters CSAM's email address
3. Clicks "Get Recommendation"
4. Results page displays with all export options
5. If CSAM email provided → "Email to CSAM" button appears prominently
6. User clicks "Email to CSAM"
7. Default email client opens with:
   - Pre-filled recipient (CSAM email)
   - Pre-filled subject line
   - Complete report in email body
8. User can review/edit and send
```

## Technical Details

### Files Modified

1. **`packages/decision-engine/src/data/decision-model.v1.json`**
   - Added new "support" question group
   - Added "support_unified_agreement" question with 3 answer options
   - Weights set to 0 (doesn't affect scoring)

2. **`apps/web/src/store/wizardStore.ts`**
   - Added `csamEmail: string | null` field to state
   - Added `setCsamEmail()` action
   - Included in reset() function
   - Incremented version to 3 (clears old cache)

3. **`apps/web/src/pages/Wizard.tsx`**
   - Added `csamEmail` import from store
   - Added `csamEmailInput` local state for temp storage
   - Added `watch` to react-hook-form for conditional rendering
   - Added conditional email input field (only shows when CSAM selected)
   - Save CSAM email when leaving support step

4. **`apps/web/src/pages/Results.tsx`**
   - Added `csamEmail` import from store
   - Created `handleEmailToCSAM()` function:
     - Generates complete markdown report
     - Creates mailto: URL with encoded subject/body
     - Opens mailto link (launches default email client)
   - Added "Email to CSAM" button (conditionally rendered)

### State Management

The CSAM email is stored in Zustand's persisted state:

```typescript
interface WizardState {
  // ... other fields
  csamEmail: string | null;
  setCsamEmail: (email: string | null) => void;
}
```

**Persistence:** Saved to localStorage, survives page refreshes

**Reset:** Cleared when user clicks "Start Over"

### Email Generation

The mailto link includes:

**Subject (URL-encoded):**

```
Microsoft Agentic Solution Assessment - [M365 Copilot|Copilot Studio|etc.]
```

**Body (URL-encoded):**

```
Hi,

I've completed a Microsoft Agentic Solution assessment and wanted to share the results with you.

Recommendation: [Title]
Confidence Level: [high|medium|low]

Please find the detailed report below:

---

[Full Markdown Report]

Best regards
```

### Browser Compatibility

- **mailto: protocol** is supported by all modern browsers
- Opens user's default email client (Outlook, Gmail, Apple Mail, etc.)
- **Character limits:** Some email clients have URL length limits (~2000 chars)
  - If report is very long, body may be truncated
  - User can always use "Export Markdown" and attach manually

## Testing Instructions

### Test Case 1: User with CSAM

1. Start questionnaire: `npm run dev` → [http://localhost:3000/wizard](http://localhost:3000/wizard)
2. Complete all questions
3. On final step "Microsoft Support & Account Management":
   - Select: "Yes, I have a Unified Support Agreement with a named CSAM"
   - Verify email input field appears
   - Enter test email: `csam@example.com`
4. Click "Get Recommendation"
5. On Results page:
   - Verify "✉️ Email to CSAM" button appears
   - Button should be styled as primary (prominent)
6. Click "Email to CSAM"
7. Verify default email client opens with:
   - **To:** csam@example.com
   - **Subject:** Contains "Microsoft Agentic Solution Assessment"
   - **Body:** Contains complete report

### Test Case 2: User without CSAM

1. Start questionnaire
2. On support step, select: "No, I don't have a Unified Support Agreement or CSAM"
3. Verify email input field does NOT appear
4. Complete questionnaire
5. On Results page:
   - Verify "Email to CSAM" button does NOT appear
   - Other export buttons still work

### Test Case 3: User unsure about CSAM

1. Start questionnaire
2. On support step, select: "I'm not sure"
3. Verify email input field does NOT appear
4. Complete questionnaire
5. Results page should not show email button

### Test Case 4: Empty Email Field

1. Start questionnaire
2. On support step, select "Yes" (email field appears)
3. Leave email field empty
4. Complete questionnaire
5. Results page should not show email button (only if email provided)

### Test Case 5: Persistence

1. Start questionnaire
2. Enter CSAM email on support step
3. Refresh page (simulating browser refresh)
4. Verify state persists
5. Navigate to Results
6. Verify email button still works

## Edge Cases Handled

- **Empty email:** Button only shows if csamEmail exists and is not empty
- **Invalid email format:** HTML5 validation enforced on input field
- **URL encoding:** Subject and body properly encoded to handle special characters
- **State persistence:** CSAM email saved in localStorage
- **Reset functionality:** CSAM email cleared when "Start Over" clicked
- **Conditional rendering:** Email input only shows when CSAM option selected

## Future Enhancements (Optional)

1. **Email validation:** Add regex validation for email format
2. **Confirmation dialog:** Show confirmation before opening mailto
3. **Copy to clipboard:** Alternative button to copy report to clipboard
4. **Direct API sending:** Integrate with email API (SendGrid, etc.) for direct sending
5. **CSAM lookup:** Integration with Microsoft customer database to suggest CSAM emails
6. **Share history:** Track when reports were shared (with user consent)

## Security Considerations

- **PII Handling:** CSAM email stored client-side only (localStorage)
- **No server transmission:** Email address never sent to backend API
- **User consent:** Email input is optional
- **Mailto protocol:** Uses browser's default email client (no third-party service)
- **Data retention:** Email cleared on "Start Over" or browser cache clear

## User Experience Benefits

1. **Seamless sharing:** One-click to share with CSAM
2. **Pre-formatted report:** Professional markdown formatting
3. **Complete context:** All survey answers and recommendations included
4. **No manual copying:** Eliminates need to export and attach file
5. **Immediate action:** mailto opens directly in email client
6. **Optional feature:** Doesn't interfere if user doesn't have CSAM

---

## Summary

The CSAM email feature provides a streamlined way for Microsoft Unified Support customers to share assessment results with their dedicated Customer Success Account Manager. The implementation:

✅ Adds non-intrusive survey question at the end  
✅ Provides optional email input (only if user has CSAM)  
✅ Generates professional report with complete context  
✅ Uses standard mailto: protocol (no external dependencies)  
✅ Maintains user privacy (client-side only)  
✅ Enhances value for enterprise customers with support agreements

**Status:** ✅ Complete and ready for testing
**Estimated testing time:** 10-15 minutes
**User impact:** High value for Unified Support customers, invisible to others
