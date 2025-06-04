import React from 'react';

interface AttendanceDataExporterProps {
  teamId: number;
  // TODO: Add props for selecting data to export, formats (CSV, PDF, etc.)
}

// Sample Data (consistent with other components)
const allPlayersForExport = [
  { id: 1, name: 'Player Aris' },
  { id: 2, name: 'Player Bea' },
  { id: 3, name: 'Player Cy' },
];
const sampleAttendanceHistoryForExport = [
  { playerId: 1, date: '2023-11-01', attended: true, sessionName: 'Morning Drill' },
  { playerId: 1, date: '2023-11-03', attended: true, sessionName: 'Strategy Sesh' },
  { playerId: 1, date: '2023-11-05', attended: false, sessionName: 'Speed Training' },
  { playerId: 2, date: '2023-11-01', attended: true, sessionName: 'Morning Drill' },
  { playerId: 2, date: '2023-11-03', attended: false, sessionName: 'Strategy Sesh' },
  { playerId: 3, date: '2023-11-01', attended: true, sessionName: 'Morning Drill' },
  { playerId: 1, date: '2023-10-02', attended: true, sessionName: 'Skills Practice' },
  { playerId: 2, date: '2023-10-04', attended: true, sessionName: 'Conditioning' },
];

const AttendanceDataExporter: React.FC<AttendanceDataExporterProps> = ({ teamId }) => {
  // TODO: Fetch actual data to be exported based on filters or teamId.
  // TODO: Implement PDF export (more complex, likely needs a library).

  const convertToCSV = (data: any[]) => {
    if (data.length === 0) return '';

    const headers = ['Date', 'Player Name', 'Session Name', 'Status'];
    const csvRows = [headers.join(',')]; // Add header row

    data.forEach(record => {
      const playerName = allPlayersForExport.find(p => p.id === record.playerId)?.name || 'Unknown';
      const status = record.attended ? 'Attended' : 'Absent';
      const values = [
        record.date,
        `"${playerName.replace(/"/g, '""')}"`, // Handle quotes in names
        `"${(record.sessionName || 'N/A').replace(/"/g, '""')}"`,
        status,
      ];
      csvRows.push(values.join(','));
    });

    return csvRows.join('\n');
  };

  const handleExportCSV = () => {
    const csvData = convertToCSV(sampleAttendanceHistoryForExport);
    if (!csvData) {
        alert("No data to export!");
        return;
    }
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) { // feature detection
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `team_${teamId}_attendance_export.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
        alert("CSV download is not supported in your browser.");
    }
  };

  const handleExportPDF = () => {
    // Placeholder for PDF export logic
    alert('PDF Export functionality is not yet implemented. This would typically involve libraries like jsPDF.');
  };


  return (
    <div className="bg-white shadow rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-2">Export Attendance Data</h3>
      <p className="text-sm text-gray-500 mb-4">Team ID: {teamId}</p>

      <div className="space-y-2 md:space-y-0 md:space-x-2">
        <button
          onClick={handleExportCSV}
          className="w-full md:w-auto px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300"
        >
          Export as CSV
        </button>
        <button
          onClick={handleExportPDF}
          className="w-full md:w-auto px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-300"
        >
          Export as PDF (Placeholder)
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-3">
        CSV export includes all available sample attendance history. Filters for export can be added.
      </p>
    </div>
  );
};

export default AttendanceDataExporter;
