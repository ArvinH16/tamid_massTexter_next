'use client';
import { useRef } from 'react';
import { QRCode } from 'react-qrcode-logo';
import jsPDF from 'jspdf';
import { Button } from './button';

interface OrgQrCodeProps {
  orgName: string;
  joinUrl: string;
}

export default function OrgQrCode({ orgName, joinUrl }: OrgQrCodeProps) {
  const qrRef = useRef<HTMLDivElement>(null);

  const handleDownloadPdf = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (!canvas) return;
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    pdf.setFontSize(20);
    pdf.text(`Join ${orgName}`, 40, 60);
    pdf.addImage(imgData, 'PNG', 40, 80, 250, 250);
    pdf.setFontSize(12);
    pdf.text(joinUrl, 40, 350);
    pdf.save(`${orgName.replace(/\s+/g, '_')}_QR.pdf`);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 bg-white rounded shadow-md">
      <div ref={qrRef} className="bg-white p-4 rounded">
        <QRCode value={joinUrl} size={220} quietZone={8} ecLevel="H" />
      </div>
      <div className="text-center">
        <div className="font-semibold text-lg mb-1">Scan to Join {orgName}</div>
        <div className="text-xs text-gray-500 break-all mb-2">{joinUrl}</div>
        <Button onClick={handleDownloadPdf} className="mt-2">Download as PDF</Button>
      </div>
    </div>
  );
} 