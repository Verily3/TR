import { StyleSheet } from '@react-pdf/renderer';

/**
 * LeaderShift™ PDF Report — Minimal Executive Palette
 *
 * Design principles:
 *  - Black text, white background, single accent (Deep Navy)
 *  - No gradients, shadows, or decorative elements
 *  - "White space is authority"
 *  - "Do not try to make it impressive. Make it calm."
 */
export const colors = {
  primary: '#1B3A5C',        // Deep Navy — accent, headings, chart lines
  primaryLight: '#2A5580',   // Lighter navy for secondary elements
  primaryMuted: '#E8EDF2',   // Very light navy wash for subtle backgrounds
  black: '#000000',          // Primary text
  darkGray: '#333333',       // Secondary text
  mediumGray: '#666666',     // Tertiary text / labels
  lightGray: '#CCCCCC',      // Borders, grid lines
  veryLightGray: '#F5F5F5',  // Subtle backgrounds / alternating rows
  white: '#FFFFFF',          // Page background
};

export const raterTypeLabels: Record<string, string> = {
  self: 'Self',
  manager: 'Manager / Boss',
  peer: 'Peer',
  direct_report: 'Direct Report',
  others: 'Others',
};

export const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: colors.white,
    paddingTop: 50,
    paddingBottom: 60,
    paddingHorizontal: 50,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: colors.black,
  },
  pageNumber: {
    position: 'absolute',
    fontSize: 8,
    bottom: 25,
    right: 50,
    color: colors.mediumGray,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
  },
  subsectionTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
    marginBottom: 10,
    marginTop: 16,
  },
  bodyText: {
    fontSize: 10,
    lineHeight: 1.6,
    color: colors.black,
    marginBottom: 8,
  },
  mutedText: {
    fontSize: 9,
    color: colors.mediumGray,
    lineHeight: 1.5,
  },
  table: {
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
  },
  tableHeaderCell: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.lightGray,
  },
  tableRowAlt: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.lightGray,
    backgroundColor: colors.veryLightGray,
  },
  tableCell: {
    fontSize: 9,
    color: colors.black,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spacer: {
    marginBottom: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 50,
    right: 50,
    fontSize: 7,
    color: colors.mediumGray,
    borderTopWidth: 0.5,
    borderTopColor: colors.lightGray,
    paddingTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  // LeaderShift-specific styles
  coverTitle: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
    textAlign: 'center',
  },
  coverSubtitle: {
    fontSize: 16,
    fontFamily: 'Helvetica',
    color: colors.primary,
    textAlign: 'center',
    marginTop: 4,
  },
  coverByline: {
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: colors.mediumGray,
    textAlign: 'center',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  ceilingHeading: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: colors.black,
    letterSpacing: 3,
    marginBottom: 20,
  },
  ceilingNarrative: {
    fontSize: 11,
    lineHeight: 1.8,
    color: colors.darkGray,
    maxWidth: 420,
  },
  commentText: {
    fontSize: 9,
    fontStyle: 'italic',
    color: colors.darkGray,
    lineHeight: 1.5,
    marginBottom: 6,
    paddingLeft: 10,
  },
  thinRule: {
    borderBottomWidth: 0.5,
    borderBottomColor: colors.lightGray,
    marginVertical: 12,
  },
});
