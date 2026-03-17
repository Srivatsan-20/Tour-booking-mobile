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
    assignedBuses?: AssignedBusDto[] | null;
    isCancelled: boolean;
    isCompleted: boolean;
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
    busType: string;
    capacity: number;
    baseRate: number;
    homeCity: string | null;
    createdAtUtc: string;
};

export type ScheduleAgreementDto = {
    id: string;
    customerName: string;
    fromDate: string;
    toDate: string;
    busType: string;
    busCount: number | null;
    assignedBusIds: string[];
};

export type ScheduleResponse = {
    from: string;
    to: string;
    buses: BusResponse[];
    agreements: ScheduleAgreementDto[];
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

export type AccountsSummaryItem = {
    agreementId: string;
    customerName: string;
    fromDate: string;
    toDate: string;
    busType: string;
    busCount: number | null;
    incomeTotalAmount: number;
    totalExpenses: number;
    profitOrLoss: number;
    balance?: number | null;
    isCancelled: boolean;
    createdAtUtc: string;
};
