'use client';

import { Download, Loader2 } from 'lucide-react';
import { useDownloadReport } from '@/hooks/api/useAssessments';

interface DownloadReportButtonProps {
  tenantId: string;
  assessmentId: string;
  assessmentName: string;
  disabled?: boolean;
}

export function DownloadReportButton({
  tenantId,
  assessmentId,
  assessmentName,
  disabled,
}: DownloadReportButtonProps) {
  const downloadReport = useDownloadReport(tenantId);

  const filename = `${assessmentName.replace(/[^a-zA-Z0-9]/g, '_')}_Report.pdf`;

  const handleDownload = () => {
    downloadReport.mutate({ assessmentId, filename });
  };

  return (
    <button
      onClick={handleDownload}
      disabled={disabled || downloadReport.isPending}
      className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {downloadReport.isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {downloadReport.isPending ? 'Generating...' : 'Download PDF Report'}
    </button>
  );
}
