import type { BusResponse } from './api';

export type FuelEntryDto = {
  id: string;
  place: string;
  liters: number;
  cost: number;
};

export type OtherExpenseDto = {
  id: string;
  description: string;
  amount: number;
};

export type BusExpenseDto = {
  id: string;
  busId: string | null;
  busVehicleNumber: string | null;
  busName: string | null;

  driverBatta: number;
  days: number;
  startKm: number | null;
  endKm: number | null;

  totalFuelCost: number;
  totalOtherExpenses: number;
  totalExpenses: number;

  fuelEntries: FuelEntryDto[];
  otherExpenses: OtherExpenseDto[];
};

export type AgreementAccountsResponse = {
  agreementId: string;
  incomeTotalAmount: number;
  totalExpenses: number;
  profitOrLoss: number;
  requiredBusCount: number;
  assignedBuses: BusResponse[];
  updatedAtUtc: string | null;
  busExpenses: BusExpenseDto[];
};

export type UpsertFuelEntryRequest = {
  place?: string | null;
  liters?: string | null;
  cost?: string | null;
};

export type UpsertOtherExpenseRequest = {
  description?: string | null;
  amount?: string | null;
};

export type UpsertBusExpenseRequest = {
  busId?: string | null;
  driverBatta?: string | null;
  days?: string | null;
  startKm?: string | null;
  endKm?: string | null;
  fuelEntries?: UpsertFuelEntryRequest[] | null;
  otherExpenses?: UpsertOtherExpenseRequest[] | null;
};

export type UpsertAgreementAccountsRequest = {
  busExpenses: UpsertBusExpenseRequest[];
};

export type AccountsSummaryItem = {
  agreementId: string;
  customerName: string;
  fromDate: string; // dd/MM/yyyy
  toDate: string; // dd/MM/yyyy
  busType: string;
  busCount: number | null;
  incomeTotalAmount: number;
  totalExpenses: number;
  profitOrLoss: number;
  isCancelled: boolean;
  createdAtUtc: string;
};
