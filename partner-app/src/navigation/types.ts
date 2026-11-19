import type { AgreementDraft } from '../types/agreement';
import type { AgreementResponse } from '../types/api';

export type RootStackParamList = {
  // Auth
  Login: undefined;
  Register: undefined;

  // Main App
  Home: undefined;
  Profile: undefined;
  AgreementForm: undefined;
  AgreementPreview: { draft: AgreementDraft };
  Bookings: undefined;
  AllTours: undefined;
  CancelledTours: undefined;
  BusAvailability: { focusAgreementId?: string } | undefined;
  ManageAssignments: undefined;
  BookingDetails: { agreement: AgreementResponse };
  BookingEdit: { agreement: AgreementResponse };

  // Accounts
  AccountsSummary: undefined;
  TourAccount: { agreementId: string };
};

