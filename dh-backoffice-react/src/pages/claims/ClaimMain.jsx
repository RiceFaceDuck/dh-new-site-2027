import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import BillingDashboard from '../billing/BillingMain';

import { useClaimData } from './hooks/useClaimData';
import ClaimHeader from './components/ClaimHeader';
import ClaimStatsRow from './components/ClaimStatsRow';
import ClaimTable from './components/table/ClaimTable';
import ClaimDetailModal from './components/detail/ClaimDetailModal';
import ClaimPrintView from './components/ClaimPrintView';

// ==========================================
// 📊 Component: Claim Dashboard Main
// ==========================================
export default function ClaimMain() {
  const {
    requests,
    loading,
    searchTerm, setSearchTerm,
    activeTab, setActiveTab,
    startDate, setStartDate,
    endDate, setEndDate,
    selectedRequest, setSelectedRequest,
    isProcessing, setIsProcessing,
    filteredRequests,
    stats
  } = useClaimData();

  const [copiedText, setCopiedText] = useState(null);

  const handleQuickCopy = (e, text) => {
    e.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handlePrint = () => {
    const printContent = document.getElementById('printable-claim');
    if (!printContent) return;

    const oldIframe = document.getElementById('dh-print-iframe-claim');
    if (oldIframe) oldIframe.remove();

    const iframe = document.createElement('iframe');
    iframe.id = 'dh-print-iframe-claim';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
        .map(style => style.outerHTML)
        .join('\n');

    const iframeDoc = iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(`
        <!DOCTYPE html>
        <html lang="th">
        <head>
            <meta charset="utf-8">
            <title>A5 Claim Form - ${selectedRequest?.payload?.claimId || selectedRequest?.payload?.returnId || 'Print'}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            ${styles}
            <style>
                @page { size: A5 portrait; margin: 5mm; }
                body { background: white !important; margin: 0; padding: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                .print-page { page-break-after: always; position: relative; padding: 5px; }
                .copy-page { filter: grayscale(100%); }
                .watermark-text {
                    position: absolute; top: 40%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg);
                    font-size: 80px; color: rgba(0, 0, 0, 0.05); font-weight: 900; z-index: 0; pointer-events: none; white-space: nowrap;
                }
                #printable-claim { display: block !important; width: 100% !important; padding: 0 !important; margin: 0 !important; box-shadow: none !important; border: none !important; }
                tr { page-break-inside: avoid; }
            </style>
        </head>
        <body>
            <div class="print-page">${printContent.innerHTML}</div>
            <div class="print-page copy-page"><div class="watermark-text">สำเนา</div>${printContent.innerHTML}</div>
            <script>
                window.onload = function() {
                    setTimeout(function() { window.focus(); window.print(); }, 800);
                };
            </script>
        </body>
        </html>
    `);
    iframeDoc.close();
  };

  return (
    <div className="animate-in fade-in duration-300 pb-10 bg-dh-base min-h-full">
      
      <ClaimHeader 
        startDate={startDate} setStartDate={setStartDate}
        endDate={endDate} setEndDate={setEndDate}
        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
      />

      <ClaimStatsRow stats={stats} activeTab={activeTab} setActiveTab={setActiveTab} />

      {activeTab === 'create' ? (
        <div className="bg-dh-surface rounded-xl shadow-sm border border-dh-border overflow-hidden p-0 h-[80vh]">
            <BillingDashboard />
        </div>
      ) : (
        <div className="bg-dh-surface rounded-xl shadow-sm border border-dh-border overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16"><RefreshCw className="w-6 h-6 animate-spin text-dh-accent"/></div>
          ) : (
            <ClaimTable 
              filteredRequests={filteredRequests} 
              setSelectedRequest={setSelectedRequest}
              copiedText={copiedText}
              handleQuickCopy={handleQuickCopy}
            />
          )}
        </div>
      )}

      {selectedRequest && (
        <ClaimDetailModal 
          selectedRequest={selectedRequest} 
          setSelectedRequest={setSelectedRequest}
          handlePrint={handlePrint}
          handleQuickCopy={handleQuickCopy}
          copiedText={copiedText}
          getStatusDisplay={() => {}} 
        />
      )}

      <ClaimPrintView req={selectedRequest} />

    </div>
  );
}