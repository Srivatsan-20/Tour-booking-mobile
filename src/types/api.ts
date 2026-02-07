export type AgreementResponse = {
  id: string;
  customerName: string;
  phone: string;
  fromDate: string;
  toDate: string;
  busType: string;
  busCount: number | null;
  passengers: number | null;
  placesToCover: string;

  // Rent details (persisted in DB)
  perDayRent: number | null;
  includeMountainRent: boolean;
  mountainRent: number | null;
  useIndividualBusRates: boolean;
  busRates: Array<{
    perDayRent: number | null;
    includeMountainRent: boolean;
    mountainRent: number | null;
  }> | null;

  totalAmount: number | null;
  advancePaid: number | null;
  balance: number | null;
  notes: string;


  // Bus assignments (optional; returned by some endpoints)
  assignedBuses?: AssignedBusDto[] | null;
  isCancelled: boolean;
  isCompleted: boolean; // For ending tour
  cancelledAtUtc: string | null;
  createdAtUtc: string;
};

export type AssignedBusDto = {
  id: string;
  vehicleNumber: string;
  name: string | null;
};

export type BusResponse = {
  id: string;
  vehicleNumber: string;
  name: string | null;
  isActive: boolean;
  createdAtUtc: string;
};

export type ScheduleAgreementDto = {
  id: string;
  customerName: string;
  fromDate: string; // dd/MM/yyyy
  toDate: string; // dd/MM/yyyy
  busType: string;
  busCount: number | null;
  assignedBusIds: string[];
};

export type ScheduleResponse = {
  from: string; // yyyy-MM-dd
  to: string; // yyyy-MM-dd
  buses: BusResponse[];
  agreements: ScheduleAgreementDto[];
};

export type BusAssignmentConflictResponse = {
  message: string;
  conflicts: Array<{
    busId: string;
    busVehicleNumber: string;
    conflictingAgreementId: string;
    conflictingCustomerName: string;
    conflictingFromDate: string;
    conflictingToDate: string;
  }>;
};
