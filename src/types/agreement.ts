export type IndividualBusRateDraft = {
  perDayRent: string;
  includeMountainRent: boolean;
  mountainRent: string;
};

export type AgreementDraft = {
  customerName: string;
  phone: string;
  fromDate: string;
  toDate: string;
  busType: string;
  busCount: string;
  passengers: string;
  placesToCover: string;

  // Pricing inputs
  perDayRent: string;
  includeMountainRent: boolean;
  mountainRent: string;
  useIndividualBusRates: boolean;
  individualBusRates: IndividualBusRateDraft[];

  // Derived values (auto-calculated on the mobile app)
  totalAmount: string;
  advancePaid: string;
  balance: string;

  notes: string;
};

