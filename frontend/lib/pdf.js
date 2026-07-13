import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generateAgreement = (booking) => {
  const doc = new jsPDF();
  const { listing, renter, startDate, endDate, totalAmount } = booking;
  const owner = listing.owner;

  // Header
  doc.setFillColor(36, 60, 45); // Brand Dark Green
  doc.rect(0, 0, 210, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.text('RENTLY AGREEMENT', 20, 25);

  doc.setFontSize(10);
  doc.text(`Contract ID: ${booking.id.toUpperCase()}`, 140, 25);

  // Section: Parties
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('1. THE PARTIES', 20, 55);

  doc.setFont(undefined, 'normal');
  doc.setFontSize(10);
  doc.text(`HOST (Owner): ${owner?.name || 'Verified Member'}`, 20, 65);
  doc.text(`RENTER (Client): ${renter?.name || 'Verified Member'}`, 20, 72);
  doc.text(`Verification Status: DigiLocker Verified Identity 🛡️`, 20, 79);

  // Section: Item Details
  doc.setFont(undefined, 'bold');
  doc.setFontSize(14);
  doc.text('2. RENTAL GEAR DETAILS', 20, 95);

  doc.setFont(undefined, 'normal');
  doc.setFontSize(10);
  doc.text(`Item: ${listing.title}`, 20, 105);
  doc.text(`Category: ${listing.category?.name || 'General'}`, 20, 112);
  doc.text(`Period: ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`, 20, 119);

  // Section: Financials & Security
  doc.setFont(undefined, 'bold');
  doc.setFontSize(14);
  doc.text('3. FINANCIALS & SECURITY', 20, 135);

  doc.autoTable({
    startY: 140,
    head: [['Description', 'Amount / Details']],
    body: [
      ['Total Rental Fee', `Rs ${(totalAmount / 100).toLocaleString()}`],
      ['Security Type', listing.depositType === 'ALTERNATIVE' ? 'COLLATERAL / ID' : 'CASH DEPOSIT'],
      ['Security Requirement', listing.depositType === 'ALTERNATIVE' ? listing.depositNote : `Rs ${(listing.deposit / 100).toLocaleString()}`],
    ],
    theme: 'striped',
    headStyles: { fillColor: [36, 60, 45] }
  });

  // Section: Terms
  const finalY = doc.lastAutoTable.finalY || 160;
  doc.setFont(undefined, 'bold');
  doc.setFontSize(14);
  doc.text('4. TERMS OF USE', 20, finalY + 20);

  doc.setFont(undefined, 'normal');
  doc.setFontSize(8);
  const terms = [
    "- The Renter acknowledges receipt of the item in good working condition.",
    "- Any damages found upon return will be deducted from the security deposit or covered by collateral.",
    "- Late returns will incur a penalty of 1.5x the Price Per Day.",
    "- This agreement is facilitated by Rentrex Peer-to-Peer Marketplace.",
    "- Both parties agree to handle the item with professional care."
  ];

  terms.forEach((term, index) => {
    doc.text(term, 20, finalY + 30 + (index * 7));
  });

  // Signatures
  doc.setFontSize(10);
  doc.text('__________________________', 20, 260);
  doc.text('Host Signature', 20, 268);

  doc.text('__________________________', 120, 260);
  doc.text('Renter Signature', 120, 268);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Generated via Rentrex Security Engine - Trusted P2P Rentals', 70, 285);

  doc.save(`Rentrex_Agreement_${booking.id.substring(0, 8)}.pdf`);
};
