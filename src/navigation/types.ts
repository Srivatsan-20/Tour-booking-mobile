import type { AgreementDraft } from '../types/agreement';
import type { AgreementResponse } from '../types/api';

export type RootStackParamList = {
  Home: undefined;
  AgreementForm: undefined;
  AgreementPreview: { draft: AgreementDraft };
  Bookings: undefined;
  AllTours: undefined;
  CancelledTours: undefined;
  BusAvailability: { focusAgreementId?: string } | undefined;
  BookingDetails: { agreement: AgreementResponse };
  BookingEdit: { agreement: AgreementResponse };
};

