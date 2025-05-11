# Financial Dashboard with Insights

## Overview

The Financial Dashboard with Insights will provide coaches with a comprehensive view of their basketball program's financial health. This feature will visualize revenue trends, break down income by player, track outstanding balances, project future revenue, and display payment statuses, all with powerful filtering and export capabilities.

## Business Value

- **Financial Visibility**: Gives coaches a clear picture of their business's financial health
- **Revenue Forecasting**: Helps coaches predict future income and plan accordingly
- **Business Optimization**: Identifies which players/programs generate the most revenue
- **Cash Flow Management**: Highlights outstanding balances to improve collection
- **Tax Preparation**: Simplifies year-end financial reporting with export capabilities

## User Personas

### Coach Marcus
- Runs a basketball training business as his primary income
- Needs to track revenue across multiple teams and programs
- Wants to understand seasonal trends to plan marketing efforts
- Requires financial reports for tax purposes

### Coach Alicia
- Part-time coach with a growing client base
- Needs to track which players have outstanding balances
- Wants to understand which training packages are most profitable
- Requires simple financial insights without accounting expertise

## Feature Requirements

### Core Functionality

1. **Revenue Dashboard**
   - Display total revenue for selected time period
   - Show revenue trends with line/bar charts
   - Break down revenue by player, team, and package type
   - Compare current period to previous periods

2. **Payment Status Tracking**
   - Categorize payments as paid, pending, or overdue
   - Display outstanding balances by player
   - Show payment history with status indicators
   - Calculate total outstanding amount

3. **Revenue Projections**
   - Project future revenue based on current prepaid sessions
   - Forecast expected income from recurring payment plans
   - Identify revenue at risk from expiring packages
   - Show projected vs. actual revenue

4. **Financial Reporting**
   - Generate detailed financial reports for selected periods
   - Export data in CSV/Excel format for accounting purposes
   - Filter reports by date range, player, team, or payment type
   - Save report configurations for regular use

## Detailed Use Cases

### Use Case 1: Viewing Monthly Revenue Overview

**Primary Actor**: Coach  
**Preconditions**: Coach has recorded payments in the system  
**Postconditions**: None

**Main Flow**:
1. Coach navigates to the Financial Dashboard
2. System displays current month's total revenue by default
3. System shows revenue breakdown by:
   - Revenue by player (top 10 with option to see all)
   - Revenue by payment type (session packages, fixed fees, etc.)
   - Revenue by team
4. System displays comparison to previous month and same month last year
5. System shows trend chart of daily/weekly revenue for the month

**Alternative Flows**:
- Coach can change time period (week, month, quarter, year, custom)
- Coach can filter by specific teams or payment types
- Coach can drill down into specific revenue sources for more detail

### Use Case 2: Tracking Outstanding Balances

**Primary Actor**: Coach  
**Preconditions**: Some players have outstanding balances  
**Postconditions**: None

**Main Flow**:
1. Coach navigates to "Outstanding Balances" section of dashboard
2. System displays list of all players with outstanding balances
3. For each player, system shows:
   - Player name
   - Outstanding amount
   - Due date
   - Days overdue (if applicable)
   - Last payment date and amount
4. Coach can sort by amount, due date, or days overdue
5. System displays total outstanding amount at the top

**Alternative Flows**:
- Coach can filter to show only overdue balances
- Coach can send payment reminder directly from this view
- Coach can record a payment for a player from this view
- Coach can export the outstanding balances list

### Use Case 3: Forecasting Future Revenue

**Primary Actor**: Coach  
**Preconditions**: Players have prepaid sessions or recurring payment plans  
**Postconditions**: None

**Main Flow**:
1. Coach navigates to "Revenue Forecast" section
2. Coach selects forecast period (next month, quarter, etc.)
3. System calculates projected revenue based on:
   - Remaining prepaid sessions likely to be used in period
   - Scheduled recurring payments
   - Historical payment patterns
4. System displays projected revenue with confidence interval
5. System breaks down projections by revenue source
6. System identifies potential revenue at risk (expiring packages, etc.)

**Alternative Flows**:
- Coach can adjust forecast parameters (session usage rate, renewal probability)
- Coach can compare different forecast scenarios
- Coach can view month-by-month forecast for longer periods

### Use Case 4: Generating Financial Reports

**Primary Actor**: Coach  
**Preconditions**: Coach has recorded payments in the system  
**Postconditions**: Coach has exported or viewed financial report

**Main Flow**:
1. Coach navigates to "Financial Reports" section
2. Coach selects report type (revenue summary, detailed transactions, player summary)
3. Coach specifies date range for report
4. Coach selects additional filters if needed (team, payment type)
5. System generates report with appropriate visualizations and tables
6. Coach reviews report on screen
7. Coach exports report in desired format (PDF, CSV, Excel)

**Alternative Flows**:
- Coach can save report configuration for future use
- Coach can schedule regular report generation
- Coach can share report link with accountant or business partner
- Coach can compare reports from different periods

### Use Case 5: Analyzing Revenue by Player

**Primary Actor**: Coach  
**Preconditions**: Coach has recorded payments from multiple players  
**Postconditions**: None

**Main Flow**:
1. Coach navigates to "Player Revenue" section
2. System displays list of all players sorted by total revenue (highest to lowest)
3. For each player, system shows:
   - Total revenue generated
   - Number of payments
   - Average payment amount
   - Last payment date
   - Payment frequency
4. Coach selects a player to view detailed payment history
5. System displays timeline of all payments from selected player
6. System shows revenue trend for selected player

**Alternative Flows**:
- Coach can filter by date range or payment type
- Coach can group players by team or program
- Coach can identify players with decreasing payment frequency
- Coach can compare revenue between different players or groups

## UI Requirements

### Main Dashboard
- Summary cards showing key financial metrics
- Revenue trend chart with selectable time periods
- Breakdown visualizations (pie/bar charts)
- Quick filters for different views
- Alert indicators for overdue payments

### Outstanding Balances View
- Sortable table of players with balances
- Status indicators (on time, approaching due date, overdue)
- Quick action buttons for payment recording and reminders
- Summary statistics at top of view

### Revenue Forecast View
- Projection chart showing expected revenue over time
- Confidence interval visualization
- Breakdown of revenue sources
- Risk indicators for uncertain revenue
- Comparison to previous periods

### Financial Reports Interface
- Report type selection with preview thumbnails
- Date range and filter controls
- Report preview area
- Export format options
- Saved report configurations

## Technical Requirements

### Database Changes
- New views or aggregation tables for financial reporting
- Additional indexes for performance optimization
- Audit trail for all financial calculations

### API Endpoints
- `GET /api/teams/:teamId/financial/summary` - Get financial summary
- `GET /api/teams/:teamId/financial/revenue` - Get detailed revenue data
- `GET /api/teams/:teamId/financial/outstanding` - Get outstanding balances
- `GET /api/teams/:teamId/financial/forecast` - Get revenue forecast
- `GET /api/teams/:teamId/financial/reports/:reportType` - Generate specific report

### Integration Points
- Integrate with payment tracking system
- Integrate with session tracking system
- Integrate with attendance system
- Integrate with export functionality (CSV, Excel, PDF)

## Implementation Considerations

- Ensure calculations are accurate and consistent across all views
- Optimize query performance for large datasets
- Implement caching for frequently accessed financial data
- Design mobile-responsive views for on-the-go financial monitoring
- Ensure data privacy and access controls for sensitive financial information

## Success Metrics

- Reduction in time spent on financial management
- Improvement in outstanding balance collection rate
- Accuracy of revenue forecasts compared to actual results
- User engagement with financial insights
- Reduction in end-of-year tax preparation time
