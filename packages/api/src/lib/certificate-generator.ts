import React from 'react';
import { Document, Page, Text, View, renderToBuffer } from '@react-pdf/renderer';
import { StyleSheet } from '@react-pdf/renderer';

// ─── Palette ───────────────────────────────────────────────────────────────

const c = {
  navy: '#1B3A5C',
  navyLight: '#2A5580',
  navyMuted: '#E8EDF2',
  gold: '#B8963E', // Prestige accent for border/rule
  darkGray: '#333333',
  mediumGray: '#666666',
  lightGray: '#CCCCCC',
  veryLight: '#F8F9FA',
  white: '#FFFFFF',
};

// ─── Styles ────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    backgroundColor: c.white,
    paddingVertical: 60,
    paddingHorizontal: 70,
    fontFamily: 'Helvetica',
    color: c.darkGray,
    flexDirection: 'column',
    alignItems: 'center',
  },
  // Outer border frame
  border: {
    position: 'absolute',
    top: 20,
    bottom: 20,
    left: 20,
    right: 20,
    borderWidth: 1,
    borderColor: c.gold,
  },
  innerBorder: {
    position: 'absolute',
    top: 24,
    bottom: 24,
    left: 24,
    right: 24,
    borderWidth: 0.5,
    borderColor: c.lightGray,
  },
  // Header bar
  headerBar: {
    width: '100%',
    backgroundColor: c.navy,
    paddingVertical: 18,
    paddingHorizontal: 40,
    alignItems: 'center',
    marginBottom: 36,
  },
  platformLabel: {
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: c.navyMuted,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  platformName: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: c.white,
    letterSpacing: 1,
  },
  // Certificate title
  certificateLabel: {
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: c.gold,
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginBottom: 8,
    textAlign: 'center',
  },
  certificateTitle: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    color: c.navy,
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 32,
  },
  // Awarded to section
  awardedTo: {
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: c.mediumGray,
    letterSpacing: 2,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 10,
  },
  recipientName: {
    fontSize: 34,
    fontFamily: 'Helvetica-Bold',
    color: c.navy,
    textAlign: 'center',
    marginBottom: 6,
  },
  rule: {
    width: 120,
    height: 1,
    backgroundColor: c.gold,
    marginVertical: 20,
    alignSelf: 'center',
  },
  // Program section
  hasCompleted: {
    fontSize: 11,
    fontFamily: 'Helvetica',
    color: c.mediumGray,
    textAlign: 'center',
    marginBottom: 12,
  },
  programName: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: c.navy,
    textAlign: 'center',
    marginBottom: 4,
    maxWidth: 400,
  },
  programMeta: {
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: c.mediumGray,
    textAlign: 'center',
  },
  // Footer area
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 40,
    paddingTop: 16,
    borderTopWidth: 0.5,
    borderTopColor: c.lightGray,
  },
  footerBlock: {
    alignItems: 'center',
    flex: 1,
  },
  footerLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica',
    color: c.lightGray,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  footerValue: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: c.mediumGray,
  },
  footerDivider: {
    width: 0.5,
    backgroundColor: c.lightGray,
    marginHorizontal: 20,
    alignSelf: 'stretch',
  },
});

// ─── Types ─────────────────────────────────────────────────────────────────

export interface CertificateData {
  recipientName: string;
  programName: string;
  completedAt: Date;
  pointsEarned: number;
  issuedBy: string; // Tenant or agency name
  enrollmentId: string;
}

// ─── Certificate number (deterministic from enrollmentId) ──────────────────

function certNumber(enrollmentId: string, date: Date): string {
  const hex = enrollmentId.replace(/-/g, '').substring(0, 8).toUpperCase();
  const year = date.getFullYear();
  return `CERT-${year}-${hex}`;
}

// ─── Public API ────────────────────────────────────────────────────────────

export async function generateCertificate(data: CertificateData): Promise<Buffer> {
  const { recipientName, programName, completedAt, pointsEarned, issuedBy, enrollmentId } = data;

  const dateStr = completedAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const certNum = certNumber(enrollmentId, completedAt);

  const doc = React.createElement(
    Document,
    {
      title: `Certificate of Completion — ${programName}`,
      author: issuedBy,
      subject: `Awarded to ${recipientName}`,
    },
    React.createElement(
      Page,
      { size: 'A4', orientation: 'landscape', style: s.page },

      // Border frames
      React.createElement(View, { style: s.border }),
      React.createElement(View, { style: s.innerBorder }),

      // Header bar
      React.createElement(
        View,
        { style: s.headerBar },
        React.createElement(Text, { style: s.platformLabel }, 'Presented by'),
        React.createElement(Text, { style: s.platformName }, issuedBy)
      ),

      // Certificate heading
      React.createElement(Text, { style: s.certificateLabel }, 'Certificate'),
      React.createElement(Text, { style: s.certificateTitle }, 'of Completion'),

      // Awarded to
      React.createElement(Text, { style: s.awardedTo }, 'This certificate is awarded to'),
      React.createElement(Text, { style: s.recipientName }, recipientName),

      // Gold rule
      React.createElement(View, { style: s.rule }),

      // Program
      React.createElement(Text, { style: s.hasCompleted }, 'for successfully completing'),
      React.createElement(Text, { style: s.programName }, programName),
      pointsEarned > 0
        ? React.createElement(Text, { style: s.programMeta }, `${pointsEarned} points earned`)
        : null,

      // Footer
      React.createElement(
        View,
        { style: s.footerRow },
        React.createElement(
          View,
          { style: s.footerBlock },
          React.createElement(Text, { style: s.footerLabel }, 'Date Completed'),
          React.createElement(Text, { style: s.footerValue }, dateStr)
        ),
        React.createElement(View, { style: s.footerDivider }),
        React.createElement(
          View,
          { style: s.footerBlock },
          React.createElement(Text, { style: s.footerLabel }, 'Certificate ID'),
          React.createElement(Text, { style: s.footerValue }, certNum)
        ),
        React.createElement(View, { style: s.footerDivider }),
        React.createElement(
          View,
          { style: s.footerBlock },
          React.createElement(Text, { style: s.footerLabel }, 'Issued by'),
          React.createElement(Text, { style: s.footerValue }, issuedBy)
        )
      )
    )
  );

  return renderToBuffer(doc);
}
