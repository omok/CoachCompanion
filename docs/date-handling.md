# Date Handling in Coach Companion

## The Problem

JavaScript's `Date` object can cause timezone issues when converting between string representations and Date objects. This is because:

1. When creating a Date from a string like "2023-09-05" (without time), JavaScript assumes UTC midnight
2. When converting back to a string or displaying the date, it may shift by hours based on the local timezone
3. This can result in dates appearing to shift by a day (e.g., September 5 becoming September 4)

## Our Solution

To avoid these issues, we've adopted a consistent approach to date handling throughout the application:

1. **Client-side**: Use HTML date inputs that produce "YYYY-MM-DD" format strings
2. **API Communication**: Pass date strings directly in "YYYY-MM-DD" format without converting to Date objects
3. **Server-side**: Validate the "YYYY-MM-DD" format and store directly in the database
4. **Display**: Use a consistent formatting function to display dates to users

## Helper Functions

### Client-side

```typescript
// Format a date for display (e.g., "Sep 5, 2023")
function formatDisplayDate(dateString: string | Date): string {
  if (!dateString) return '';
  
  // Handle Date objects
  if (dateString instanceof Date) {
    try {
      return format(dateString, 'MMM d, yyyy');
    } catch (err) {
      console.error('Error formatting Date object:', err);
      return dateString.toLocaleDateString();
    }
  }
  
  // If it's already in YYYY-MM-DD format, use it directly
  if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    try {
      return format(parseISO(dateString), 'MMM d, yyyy');
    } catch (err) {
      console.error('Error formatting date string:', err);
      return dateString;
    }
  }
  
  // Otherwise try to parse it as an ISO string
  try {
    return format(new Date(String(dateString)), 'MMM d, yyyy');
  } catch (err) {
    console.error('Error formatting date:', err);
    return String(dateString);
  }
}

// Get today's date in YYYY-MM-DD format
function getTodayInYYYYMMDD(): string {
  return new Date().toLocaleDateString('en-CA'); // Returns YYYY-MM-DD
}
```

### Server-side

```typescript
// Validate date format
function isValidDateFormat(dateStr: string | null): boolean {
  if (!dateStr) return true; // null is valid
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
}
```

## Implementation Guidelines

### Client-side Code

1. **Form Inputs**: Always use `<input type="date">` for date fields
2. **Form Submission**: Pass the date string directly without creating Date objects
3. **Display**: Use the `formatDisplayDate` function for consistent formatting

### Server-side Code

1. **Validation**: Validate date strings using the `isValidDateFormat` function
2. **Schema**: Use `z.string()` for date fields without transforming to Date objects
3. **Database**: Store dates in the database's native date format

## Components Using This Approach

- Team Settings
- Practice Notes
- Attendance Tracker
- Payment Tracker
- Player Details

## Database Schema

In our PostgreSQL database, dates are stored as the `date` type, which accepts the "YYYY-MM-DD" format directly.

## Troubleshooting

If dates are still displaying incorrectly:

1. Check that the date is being passed as a string in "YYYY-MM-DD" format
2. Verify that no `new Date()` conversions are happening during API calls
3. Ensure the `formatDisplayDate` function is being used for display 