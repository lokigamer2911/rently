import jsPDF from 'jspdf';
import 'jspdf-autotable';

/** Parse stored signature JSON — supports both the evidence envelope and the legacy bare blob. */
const parseSignatures = (raw) => {
  try {
    const parsed = JSON.parse(raw || 'null');
    if (!parsed) return null;
    return parsed.parties || parsed; // envelope -> parties, legacy -> { renter, host }
  } catch {
    return null;
  }
};

const fmtDate = (iso) => {
  try {
    return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }) + ' UTC';
  } catch {
    return String(iso);
  }
};

/** Draw one signature image + its audit line. Returns the y position after it. */
const drawSignature = (doc, party, x, y, width) => {
  if (!party) return y;
  const isPng = typeof party.signature === 'string' && party.signature.startsWith('data:image/png');
  try {
    doc.addImage(party.signature, isPng ? 'PNG' : 'JPEG', x, y, width, 16);
  } catch {
    doc.text('(signature image unavailable)', x, y + 8);
  }
  let cursor = y + 20;
  doc.setFontSize(7);
  doc.setTextColor(90, 90, 90);
  if (party.signedAt) {
    doc.text(`Digitally signed on ${fmtDate(party.signedAt)}`, x, cursor);
    cursor += 4;
  }
  if (party.ip) {
    doc.text(`IP address: ${party.ip}`, x, cursor);
    cursor += 4;
  }
  if (party.userAgent) {
    const lines = doc.splitTextToSize(`Device: ${party.userAgent}`, width + 15);
    doc.text(lines.slice(0, 3), x, cursor);
    cursor += 4 * Math.min(lines.length, 3);
  }
  return cursor;
};

export const generateAgreement = (booking) => {
  const doc = new jsPDF();
  const { listing, renter, startDate, endDate, totalAmount } = booking;
  const owner = listing.owner;

  // Signature evidence (optional — older bookings predate the audit trail)
  const pickupMeta = booking.pickupSignatureMeta ? safeJson(booking.pickupSignatureMeta) : null;
  const returnMeta = booking.returnSignatureMeta ? safeJson(booking.returnSignatureMeta) : null;
  const pickupParties = parseSignatures(booking.pickupSignatures);
  const returnParties = parseSignatures(booking.returnSignatures);
  const hasAnySignature = !!(pickupParties?.renter || pickupParties?.host || returnParties?.renter || returnParties?.host);

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
  doc.text(`Platform account identity: verified at signup via Google/Firebase auth.`, 20, 79);

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

  // Section: Signatures & audit trail
  doc.setFont(undefined, 'bold');
  doc.setFontSize(14);
  doc.text('5. E-SIGNATURES', 20, finalY + 75);

  if (hasAnySignature) {
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);
    doc.text('Captured on the Rently platform at handover. Each signature is sealed with a', 20, finalY + 82);
    doc.text('SHA-256 evidence hash covering the image, timestamp, IP address and device.', 20, finalY + 86);

    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    let bottomY = 0;
    if (pickupParties) bottomY = Math.max(bottomY, drawSignature(doc, pickupParties.renter, 20, finalY + 92, 60));
    if (pickupParties) bottomY = Math.max(bottomY, drawSignature(doc, pickupParties.host, 120, finalY + 92, 60));
    if (bottomY > finalY + 96) {
      doc.setFontSize(7);
      doc.setTextColor(120, 120, 120);
      doc.text('Pickup handover', 20, finalY + 89);
    }

    // Return signatures on page 2 so the pickup audit block never collides
    if (returnParties) {
      doc.addPage();
      doc.setFont(undefined, 'bold');
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text('Return handover signatures', 20, 30);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(8);
      let ry = 38;
      ry = Math.max(ry, drawSignature(doc, returnParties.renter, 20, ry, 60));
      ry = Math.max(ry, drawSignature(doc, returnParties.host, 120, ry, 60));
    }
  } else {
    // Fallback for bookings signed before evidence capture existed
    doc.setFontSize(10);
    doc.text('__________________________', 20, finalY + 92);
    doc.text('Host Signature', 20, finalY + 100);

    doc.text('__________________________', 120, finalY + 92);
    doc.text('Renter Signature', 120, finalY + 100);
  }

  // Evidence integrity block — printed at the bottom of the last page
  const hashes = [pickupMeta?.envelope?.hash, returnMeta?.envelope?.hash].filter(Boolean);
  if (hashes.length) {
    doc.setFontSize(6.5);
    doc.setTextColor(120, 120, 120);
    let hy = 280;
    hashes.forEach((h, i) => {
      doc.text(`Evidence hash ${i + 1} (SHA-256): ${h.slice(0, 44)}…`, 20, hy);
      hy += 4;
    });
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Generated via Rentrex Security Engine - Trusted P2P Rentals', 70, 288);

  doc.save(`Rentrex_Agreement_${booking.id.substring(0, 8)}.pdf`);
};

function safeJson(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
