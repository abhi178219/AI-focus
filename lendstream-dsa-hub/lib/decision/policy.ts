/**
 * Credit-policy thresholds used by the section views.
 *
 * These are POLICY, not data — they are the programme's own rules (floors,
 * caps, benchmark ratios), the same way `max_foir_percent` lives on a Product
 * row. Nothing here stands in for a figure that should have come off a
 * document: every applicant number is still read from a parsed document or a
 * lead column, and renders as "—" when it is absent.
 */

/** Assessed-margin grid by GST business type — surrogate income on turnover. */
export const GST_MARGINS: Record<string, number> = {
  WHOLESALER: 0.04,
  TRADER: 0.045,
  RETAILER: 0.05,
  SERVICE_PROVIDER: 0.06,
  MANUFACTURER: 0.075,
}

export const GST_POLICY = {
  foirOnMargin: 0.8,
  minAnnualTurnover: 1_00_00_000,
  maxMissedFilings: 2,
  volatilityWarnPercent: 35,
  volatilityCriticalPercent: 60,
  concentrationWarnPercent: 40,
  concentrationCriticalPercent: 60,
  /**
   * A GSTIN younger than this reads as limited business vintage regardless of
   * how long the applicant says the business has been trading.
   */
  minRegistrationVintageMonths: 12,
  /**
   * GSTR-1 against GSTR-3B outward supplies. Below the first figure the
   * difference is normally explainable (amendments, credit notes, timing);
   * above the second it is a material unexplained gap.
   */
  gstr1VsGstr3bTolerancePercent: 5,
  gstr1VsGstr3bCriticalPercent: 15,
  /** ITC claimed against the GSTR-2B auto-populated figure. */
  itcMismatchTolerancePercent: 10,
  /** Credit notes / sales reversals as a share of outward supplies. */
  creditNoteWarnPercent: 5,
  creditNoteCriticalPercent: 10,
  /** Share of GST liability discharged in cash — below this reads as ITC-heavy. */
  cashTaxShareWarnPercent: 10,
  /** Turnover step-up in the periods immediately before the application. */
  suddenStepUpPercent: 50,
  /** Unsecured-programme sanction caps by turnover band. */
  caps: [
    { upTo: 3_00_00_000, cap: 25_00_000 },
    { upTo: 5_00_00_000, cap: 35_00_000 },
    { upTo: Number.POSITIVE_INFINITY, cap: 50_00_000 },
  ],
}

export const BUREAU_POLICY = {
  bands: [
    { min: 750, max: 900, label: 'Excellent' },
    { min: 700, max: 749, label: 'Good' },
    { min: 650, max: 699, label: 'Fair' },
    { min: 550, max: 649, label: 'Poor' },
    { min: 300, max: 549, label: 'Very Poor' },
  ],
  minScoreUnsecured: 700,
  minScoreSecured: 690,
  maxActiveUnsecured: 4,
  maxCurrentDpd: 30,
  adverseLookbackMonths: 24,
  enquiryWarn6M: 4,
  enquiryCritical6M: 8,
  utilisationWarnPercent: 60,
  utilisationCriticalPercent: 85,
  minVintageMonths: 24,
}

export const BUSINESS_POLICY = {
  minVintageYears: 3,
  cycleGoodDays: 60,
  cycleModerateDays: 90,
  cycleWeakDays: 120,
  concentrationWarnPercent: 40,
  concentrationCriticalPercent: 60,
  /** Constitution strength, used only to weight the Business score. */
  constitutionStrength: {
    PUBLIC_LIMITED: 100, PRIVATE_LIMITED: 85, LLP: 75,
    PARTNERSHIP: 65, HUF: 55, PROPRIETORSHIP: 50,
  } as Record<string, number>,
}

export const COLLATERAL_POLICY = {
  ltvCaps: { RESIDENTIAL: 0.75, COMMERCIAL: 0.65, INDUSTRIAL: 0.6, PLOT: 0.5 } as Record<string, number>,
  maxPropertyAgeYears: 30,
  minSecurityCoverage: 1.25,
}

/** Margin the lender holds back on stock when the statement does not state one. */
export const STOCK_DEFAULT_MARGIN_PERCENT = 25

export const DSCR_POLICY = { pass: 1.25, refer: 1.1 }
