import * as React from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { ChevronLeft, ChevronRight, Filter, Info, Plus, Calendar, Settings, Bus } from 'lucide-react-native';

import type { RootStackParamList } from '../navigation/types';
import { getSchedule } from '../api/schedule';
import { createBus } from '../api/buses';
import {
  assignBusToAgreement,
  getAgreementById,
  unassignBusFromAgreement,
  updateAgreement,
  type CreateAgreementRequest,
} from '../api/agreements';
import { ApiError } from '../api/ApiError';
import type { BusAssignmentConflictResponse, BusResponse, ScheduleAgreementDto, ScheduleResponse } from '../types/api';
import { ScreenContainer } from '../components/ScreenContainer';

type Props = NativeStackScreenProps<RootStackParamList, 'BusAvailability'>;

const ROW_H = 44;
const BUS_W = 140;
const DATE_W = 100;

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function formatIsoDate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function formatDateDDMMYYYY(d: Date): string {
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function parseDateDDMMYYYY(input: string): Date | null {
  const m = input.trim().match(/^([0-9]{1,2})\/([0-9]{1,2})\/([0-9]{4})$/);
  if (!m) return null;
  const dd = Number(m[1]);
  const mm = Number(m[2]);
  const yyyy = Number(m[3]);
  const d = new Date(yyyy, mm - 1, dd);
  if (d.getFullYear() !== yyyy || d.getMonth() !== mm - 1 || d.getDate() !== dd) return null;
  return d;
}

function addDays(d: Date, delta: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + delta);
  return x;
}

function monthStart(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function monthEnd(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function monthTitle(d: Date): string {
  // Locale-safe enough (numbers-only UI elsewhere)
  return d.toLocaleString(undefined, { month: 'long', year: 'numeric' });
}

function busLabel(bus: BusResponse): { primary: string; secondary?: string } {
  // Requirement: show actual vehicle numbers; show name if available
  const vehicle = bus.vehicleNumber;
  const name = bus.name?.trim();
  return name ? { primary: vehicle, secondary: name } : { primary: vehicle };
}

function isConflictBody(x: any): x is BusAssignmentConflictResponse {
  return !!x && typeof x === 'object' && typeof x.message === 'string' && Array.isArray(x.conflicts);
}

function toUpdateRequestFromAgreement(a: any, fromDate: string, toDate: string): CreateAgreementRequest {
  return {
    customerName: a.customerName ?? '',
    phone: a.phone ?? '',
    fromDate,
    toDate,
    busType: a.busType ?? '',
    busCount: a.busCount == null ? '' : String(a.busCount),
    passengers: a.passengers == null ? '' : String(a.passengers),
    placesToCover: a.placesToCover ?? '',

    perDayRent: a.perDayRent == null ? '' : String(a.perDayRent),
    includeMountainRent: !!a.includeMountainRent,
    mountainRent: a.mountainRent == null ? '' : String(a.mountainRent),
    useIndividualBusRates: !!a.useIndividualBusRates,
    busRates: (a.busRates ?? []).map((r: any) => ({
      perDayRent: r?.perDayRent == null ? '' : String(r.perDayRent),
      includeMountainRent: !!r?.includeMountainRent,
      mountainRent: r?.mountainRent == null ? '' : String(r.mountainRent),
    })),

    totalAmount: a.totalAmount == null ? '' : String(a.totalAmount),
    // Preserve current advancePaid when shifting dates (do not overwrite it).
    advancePaid: a.advancePaid == null ? '' : String(a.advancePaid),
    notes: a.notes ?? '',
  };
}

type Block = {
  agreementId: string;
  busId: string;
  customerName: string;
  fromIndex: number;
  toIndex: number;
  fromDate: string;
  toDate: string;
};

function DraggableBlock(props: {
  block: Block;
  busIndex: number;
  focused: boolean;
  onPress: () => void;
  onDrop: (args: { type: 'moveBus'; targetBusIndex: number } | { type: 'shiftDates'; deltaDays: number }) => void;
}) {
  const { block, busIndex, focused, onPress, onDrop } = props;

  const pos = React.useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const dragEnabledRef = React.useRef(false);
  const didDragRef = React.useRef(false);
  const [dragging, setDragging] = React.useState(false);
  const longPressTimer = React.useRef<any>(null);

  const pan = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: () => dragEnabledRef.current,
        onPanResponderGrant: () => {
          pos.setOffset({ x: (pos as any).x?._value ?? 0, y: (pos as any).y?._value ?? 0 });
          pos.setValue({ x: 0, y: 0 });
        },
        onPanResponderMove: Animated.event([null, { dx: pos.x, dy: pos.y }], { useNativeDriver: false }),
        onPanResponderRelease: (_evt, g) => {
          pos.flattenOffset();
          const dx = g.dx;
          const dy = g.dy;

          // If we actually perform a drop action, suppress the subsequent tap handler.
          didDragRef.current = false;

          dragEnabledRef.current = false;
          setDragging(false);

          // snap back visually
          Animated.timing(pos, { toValue: { x: 0, y: 0 }, duration: 120, useNativeDriver: false }).start();

          // Decide action: bus move OR date shift (not both) to keep this reliable.
          if (Math.abs(dx) > Math.abs(dy)) {
            const deltaCols = Math.round(dx / BUS_W);
            if (deltaCols !== 0) {
              didDragRef.current = true;
              onDrop({ type: 'moveBus', targetBusIndex: busIndex + deltaCols });
            }
            return;
          }
          const deltaDays = Math.round(dy / ROW_H);
          if (deltaDays !== 0) {
            didDragRef.current = true;
            onDrop({ type: 'shiftDates', deltaDays });
          }
        },
      }),
    [busIndex, onDrop, pos],
  );

  const top = block.fromIndex * ROW_H + 2;
  const height = (block.toIndex - block.fromIndex + 1) * ROW_H - 4;

  return (
    <Animated.View
      {...pan.panHandlers}
      style={[
        styles.block,
        {
          top,
          height,
          transform: pos.getTranslateTransform(),
          borderColor: focused ? '#2563EB' : '#A5B4FC',
          backgroundColor: focused ? '#E0E7FF' : 'white',
          zIndex: dragging ? 50 : 5,
          opacity: dragging ? 0.9 : 1,
          borderWidth: focused ? 2 : 1,
          left: 2,
          right: 2,
        },
      ]}
      onTouchStart={() => {
        longPressTimer.current = setTimeout(() => {
          dragEnabledRef.current = true;
          setDragging(true);
        }, 220);
        didDragRef.current = false;
      }}
      onTouchEnd={() => {
        if (longPressTimer.current) clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
        // After a drag/drop, Android can still fire this touch-end; ignore it once.
        if (didDragRef.current) {
          didDragRef.current = false;
          return;
        }
        if (!dragEnabledRef.current) onPress();
      }}
    >
      <Text numberOfLines={1} style={styles.blockTitle}>
        {block.customerName}
      </Text>
      <Text numberOfLines={1} style={styles.blockSub}>
        {block.fromDate} - {block.toDate}
      </Text>
    </Animated.View>
  );
}

export function BusAvailabilityScreen({ navigation, route }: Props) {
  const { t } = useTranslation();

  const focusAgreementId = route.params?.focusAgreementId;

  const [cursor, setCursor] = React.useState<Date>(() => monthStart(new Date()));
  const [schedule, setSchedule] = React.useState<ScheduleResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [addBusOpen, setAddBusOpen] = React.useState(false);
  const [busVehicleNumber, setBusVehicleNumber] = React.useState('');
  const [busName, setBusName] = React.useState('');
  const [busyAddBus, setBusyAddBus] = React.useState(false);

  const [assignModal, setAssignModal] = React.useState<{ busId: string; dayIso: string } | null>(null);
  const [selected, setSelected] = React.useState<{ busId: string; agreement: ScheduleAgreementDto } | null>(null);
  const [busyAction, setBusyAction] = React.useState(false);

  const [busFilterOpen, setBusFilterOpen] = React.useState(false);
  const [selectedBusIds, setSelectedBusIds] = React.useState<string[] | null>(null); // null = All buses

  const headerHRef = React.useRef<ScrollView>(null);
  const bodyHRef = React.useRef<ScrollView>(null);
  const vRef = React.useRef<ScrollView>(null);
  const syncingRef = React.useRef(false);

  React.useEffect(() => {
    navigation.setOptions({ title: t('busAvailability.title') });
  }, [navigation, t]);

  const days = React.useMemo(() => {
    const start = monthStart(cursor);
    const end = monthEnd(cursor);
    const out: Array<{ d: Date; iso: string; label: string }> = [];
    for (let dt = new Date(start); dt.getTime() <= end.getTime(); dt = addDays(dt, 1)) {
      out.push({ d: new Date(dt), iso: formatIsoDate(dt), label: formatDateDDMMYYYY(dt) });
    }
    return out;
  }, [cursor]);

  const dayIndexByIso = React.useMemo(() => {
    const map = new Map<string, number>();
    days.forEach((x, idx) => map.set(x.iso, idx));
    return map;
  }, [days]);

  const load = React.useCallback(async () => {
    const start = monthStart(cursor);
    const end = monthEnd(cursor);
    setLoading(true);
    setError(null);
    try {
      const res = await getSchedule(formatIsoDate(start), formatIsoDate(end));
      setSchedule(res);
    } catch (e: any) {
      setError(e?.message ? String(e.message) : String(e));
    } finally {
      setLoading(false);
    }
  }, [cursor]);

  useFocusEffect(
    React.useCallback(() => {
      void load();
    }, [load]),
  );

  // If we deep-link to an agreement, scroll to its fromDate row once schedule loads.
  React.useEffect(() => {
    if (!focusAgreementId || !schedule) return;
    const a = schedule.agreements.find((x) => x.id === focusAgreementId);
    const from = parseDateDDMMYYYY(a?.fromDate ?? '');
    if (!from) return;
    const iso = formatIsoDate(from);
    const idx = dayIndexByIso.get(iso);
    if (idx == null) return;
    vRef.current?.scrollTo({ y: Math.max(0, idx * ROW_H - ROW_H * 2), animated: true });
  }, [dayIndexByIso, focusAgreementId, schedule]);

  const blocksByBus = React.useMemo(() => {
    const map = new Map<string, Block[]>();
    if (!schedule) return map;

    const monthStartDate = days[0]?.d;
    const monthEndDate = days[days.length - 1]?.d;
    if (!monthStartDate || !monthEndDate) return map;

    for (const a of schedule.agreements) {
      const from = parseDateDDMMYYYY(a.fromDate);
      const to = parseDateDDMMYYYY(a.toDate);
      if (!from || !to) continue;

      // Clamp to visible month range so cross-month bookings still render.
      const visibleFrom = new Date(Math.max(from.getTime(), monthStartDate.getTime()));
      const visibleTo = new Date(Math.min(to.getTime(), monthEndDate.getTime()));
      const fromIdx = dayIndexByIso.get(formatIsoDate(visibleFrom));
      const toIdx = dayIndexByIso.get(formatIsoDate(visibleTo));
      if (fromIdx == null || toIdx == null) continue;

      for (const busId of a.assignedBusIds ?? []) {
        const b: Block = {
          agreementId: a.id,
          busId,
          customerName: a.customerName,
          fromIndex: Math.min(fromIdx, toIdx),
          toIndex: Math.max(fromIdx, toIdx),
          fromDate: a.fromDate,
          toDate: a.toDate,
        };
        map.set(busId, [...(map.get(busId) ?? []), b]);
      }
    }
    return map;
  }, [dayIndexByIso, days, schedule]);

  const selectedBus = React.useMemo(() => {
    if (!schedule) return null;
    if (!selectedBusIds || selectedBusIds.length !== 1) return null;
    return schedule.buses.find((b) => b.id === selectedBusIds[0]) ?? null;
  }, [schedule, selectedBusIds]);

  const gridBuses = React.useMemo(() => {
    const buses = schedule?.buses ?? [];
    if (!selectedBusIds || selectedBusIds.length === 0) return buses;
    const wanted = new Set(selectedBusIds);
    const filtered = buses.filter((b) => wanted.has(b.id));
    // If selection is stale (e.g., bus deleted), fallback to all buses.
    return filtered.length > 0 ? filtered : buses;
  }, [schedule, selectedBusIds]);

  const busFilterLabel = React.useMemo(() => {
    if (!schedule) return t('busAvailability.allBuses');
    if (!selectedBusIds || selectedBusIds.length === 0) return t('busAvailability.allBuses');
    if (selectedBusIds.length === 1) return selectedBus ? busLabel(selectedBus).primary : t('busAvailability.allBuses');
    return t('busAvailability.selectedBusesCount', { count: selectedBusIds.length });
  }, [schedule, selectedBus, selectedBusIds, t]);

  React.useEffect(() => {
    if (!schedule) return;
    if (!selectedBusIds || selectedBusIds.length === 0) return;
    const existing = new Set(schedule.buses.map((b) => b.id));
    const next = selectedBusIds.filter((id) => existing.has(id));
    if (next.length !== selectedBusIds.length) setSelectedBusIds(next.length > 0 ? next : null);
  }, [schedule, selectedBusIds]);

  React.useEffect(() => {
    // When switching filter/month, reset horizontal scroll so header/body stay aligned.
    headerHRef.current?.scrollTo({ x: 0, animated: false });
    bodyHRef.current?.scrollTo({ x: 0, animated: false });
  }, [cursor, selectedBusIds]);

  const confirmChange = React.useCallback(
    (title: string, message: string) =>
      new Promise<boolean>((resolve) => {
        Alert.alert(
          title,
          message,
          [
            { text: t('common.cancel'), style: 'cancel', onPress: () => resolve(false) },
            { text: t('common.ok'), onPress: () => resolve(true) },
          ],
          { cancelable: true },
        );
      }),
    [t],
  );

  const openConflictsIfAny = React.useCallback(
    (e: unknown) => {
      if (e instanceof ApiError && e.status === 409 && isConflictBody(e.body)) {
        const lines = e.body.conflicts
          .slice(0, 8)
          .map((c) => `• ${c.busVehicleNumber}: ${c.conflictingCustomerName} (${c.conflictingFromDate} - ${c.conflictingToDate})`);
        Alert.alert(t('busAvailability.conflictsTitle'), [e.body.message, ...lines].join('\n'));
        return true;
      }
      return false;
    },
    [t],
  );

  const onAddBus = async () => {
    if (!busVehicleNumber.trim()) return;
    setBusyAddBus(true);
    try {
      await createBus(busVehicleNumber.trim(), busName.trim() ? busName.trim() : undefined);
      setAddBusOpen(false);
      setBusVehicleNumber('');
      setBusName('');
      await load();
    } catch (e: any) {
      Alert.alert(t('common.errorTitle'), e?.message ? String(e.message) : String(e));
    } finally {
      setBusyAddBus(false);
    }
  };

  const onDrop = async (block: Block, args: { type: 'moveBus'; targetBusIndex: number } | { type: 'shiftDates'; deltaDays: number }) => {
    if (!schedule) return;
    if (busyAction) return;

    // Confirm only for drag & drop changes.
    if (args.type === 'moveBus') {
      const buses = gridBuses;
      const targetIdx = Math.max(0, Math.min(buses.length - 1, args.targetBusIndex));
      const targetBus = buses[targetIdx];
      if (!targetBus || targetBus.id === block.busId) return;

      // prevent duplicates
      const ag = schedule.agreements.find((x) => x.id === block.agreementId);
      if (ag?.assignedBusIds?.includes(targetBus.id)) {
        Alert.alert(t('common.validationTitle'), t('busAvailability.alreadyAssignedToBus'));
        return;
      }

      const fromBus = schedule.buses.find((b) => b.id === block.busId) ?? null;
      const fromBusLabel = fromBus ? busLabel(fromBus).primary : block.busId;
      const toBusLabel = busLabel(targetBus).primary;

      const msg = [
        `${t('busAvailability.summaryTour')}: ${block.customerName}`,
        `${t('busAvailability.summaryBus')}: ${fromBusLabel} → ${toBusLabel}`,
        `${t('busAvailability.summaryDates')}: ${block.fromDate} - ${block.toDate}`,
        '',
        t('busAvailability.confirmChangeQuestion'),
      ].join('\n');

      const ok = await confirmChange(t('busAvailability.confirmChangeTitle'), msg);
      if (!ok) return;

      setBusyAction(true);
      try {
        await unassignBusFromAgreement(block.agreementId, block.busId);
        try {
          await assignBusToAgreement(block.agreementId, targetBus.id);
        } catch (e) {
          // rollback best effort
          try {
            await assignBusToAgreement(block.agreementId, block.busId);
          } catch {
            // ignore
          }
          if (!openConflictsIfAny(e)) {
            Alert.alert(t('common.errorTitle'), e instanceof Error ? e.message : String(e));
          }
          return;
        }

        await load();
      } catch (e) {
        if (!openConflictsIfAny(e)) {
          Alert.alert(t('common.errorTitle'), e instanceof Error ? e.message : String(e));
        }
      } finally {
        setBusyAction(false);
      }
      return;
    }

    // shiftDates
    const agFull = await getAgreementById(block.agreementId);
    const from = parseDateDDMMYYYY(agFull.fromDate);
    const to = parseDateDDMMYYYY(agFull.toDate);
    if (!from || !to) return;
    const newFrom = formatDateDDMMYYYY(addDays(from, args.deltaDays));
    const newTo = formatDateDDMMYYYY(addDays(to, args.deltaDays));

    const bus = schedule.buses.find((b) => b.id === block.busId) ?? null;
    const busText = bus ? busLabel(bus).primary : block.busId;

    const msg = [
      `${t('busAvailability.summaryTour')}: ${agFull.customerName}`,
      `${t('busAvailability.summaryBus')}: ${busText}`,
      `${t('busAvailability.summaryDates')}: ${agFull.fromDate} - ${agFull.toDate} → ${newFrom} - ${newTo}`,
      '',
      t('busAvailability.confirmChangeQuestion'),
    ].join('\n');

    const ok = await confirmChange(t('busAvailability.confirmChangeTitle'), msg);
    if (!ok) return;

    setBusyAction(true);
    try {
      const req = toUpdateRequestFromAgreement(agFull, newFrom, newTo);
      await updateAgreement(block.agreementId, req);
      await load();
    } catch (e) {
      if (!openConflictsIfAny(e)) {
        Alert.alert(t('common.errorTitle'), e instanceof Error ? e.message : String(e));
      }
    } finally {
      setBusyAction(false);
    }
  };

  const bookingsForDayAndBus = React.useCallback(
    (busId: string, dayIso: string): ScheduleAgreementDto[] => {
      if (!schedule) return [];
      const d = dayIndexByIso.get(dayIso);
      if (d == null) return [];

      const monthStartDate = days[0]?.d;
      const monthEndDate = days[days.length - 1]?.d;
      if (!monthStartDate || !monthEndDate) return [];

      return schedule.agreements.filter((a) => {
        const from = parseDateDDMMYYYY(a.fromDate);
        const to = parseDateDDMMYYYY(a.toDate);
        if (!from || !to) return false;

        const visibleFrom = new Date(Math.max(from.getTime(), monthStartDate.getTime()));
        const visibleTo = new Date(Math.min(to.getTime(), monthEndDate.getTime()));
        const fromIdx = dayIndexByIso.get(formatIsoDate(visibleFrom));
        const toIdx = dayIndexByIso.get(formatIsoDate(visibleTo));
        if (fromIdx == null || toIdx == null) return false;

        const within = d >= Math.min(fromIdx, toIdx) && d <= Math.max(fromIdx, toIdx);
        if (!within) return false;
        const need = (a.busCount ?? 0) > (a.assignedBusIds?.length ?? 0);
        if (!need) return false;
        if (a.assignedBusIds?.includes(busId)) return false;
        return true;
      });
    },
    [dayIndexByIso, days, schedule],
  );

  const tryOpenBooking = async (id: string) => {
    try {
      const full = await getAgreementById(id);
      navigation.navigate('BookingDetails', { agreement: full });
    } catch (e: any) {
      Alert.alert(t('common.errorTitle'), e?.message ? String(e.message) : String(e));
    }
  };

  const renderBody = () => {
    if (loading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={{ marginTop: 10, color: '#6B7280' }}>{t('busAvailability.loading')}</Text>
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.center}>
          <Text style={styles.err}>{t('busAvailability.error')}</Text>
          <Text style={styles.errSub}>{error}</Text>
          <Pressable style={styles.retryBtn} onPress={() => void load()}>
            <Text style={styles.retryBtnText}>{t('busAvailability.retry')}</Text>
          </Pressable>
        </View>
      );
    }

    if (!schedule || schedule.buses.length === 0) {
      return (
        <View style={styles.center}>
          <Text style={{ color: '#6B7280', fontSize: 16 }}>{t('busAvailability.empty')}</Text>
          <Pressable style={styles.primaryBtn} onPress={() => setAddBusOpen(true)}>
            <Text style={styles.primaryBtnText}>{t('busAvailability.addBus')}</Text>
            <Plus size={18} color="white" />
          </Pressable>
        </View>
      );
    }

    return (
      <View style={{ flex: 1, backgroundColor: 'white' }}>
        {/* Header */}
        <View style={styles.gridHeader}>
          <View style={[styles.dateHeaderCell, { width: DATE_W }]}>
            <Text style={styles.headerText}>{t('busAvailability.dateHeader')}</Text>
          </View>
          <ScrollView
            horizontal
            ref={headerHRef}
            showsHorizontalScrollIndicator={false}
            scrollEnabled={false}
          >
            <View style={{ flexDirection: 'row' }}>
              {gridBuses.map((b) => {
                const label = busLabel(b);
                return (
                  <View key={b.id} style={[styles.busHeaderCell, { width: BUS_W }]}>
                    <Text numberOfLines={1} style={styles.busHeaderPrimary}>
                      {label.primary}
                    </Text>
                    {label.secondary ? (
                      <Text numberOfLines={1} style={styles.busHeaderSecondary}>
                        {label.secondary}
                      </Text>
                    ) : null}
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Body */}
        <ScrollView ref={vRef} style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row' }}>
            {/* Date column */}
            <View style={{ width: DATE_W, backgroundColor: '#F9FAFB', borderRightWidth: 1, borderRightColor: '#E5E7EB' }}>
              {days.map((day) => (
                <View key={day.iso} style={[styles.dateCell, { height: ROW_H }]}>
                  <Text style={styles.dateCellText}>{day.label.slice(0, 5)}</Text>
                  <Text style={styles.dateCellDay}>{day.d.toLocaleDateString(undefined, { weekday: 'short' })}</Text>
                </View>
              ))}
            </View>

            {/* Bus grid */}
            <ScrollView
              horizontal
              ref={bodyHRef}
              showsHorizontalScrollIndicator={true}
              onScroll={(e) => {
                if (syncingRef.current) return;
                syncingRef.current = true;
                const x = e.nativeEvent.contentOffset.x;
                headerHRef.current?.scrollTo({ x, animated: false });
                syncingRef.current = false;
              }}
              scrollEventThrottle={16}
            >
              <View style={{ flexDirection: 'row' }}>
                {gridBuses.map((bus, busIndex) => {
                  const blocks = blocksByBus.get(bus.id) ?? [];

                  return (
                    <View key={bus.id} style={[styles.busCol, { width: BUS_W, height: days.length * ROW_H }]}>
                      {/* Background cells */}
                      {days.map((day, rowIdx) => {
                        const booked = blocks.some((b) => rowIdx >= b.fromIndex && rowIdx <= b.toIndex);
                        const isWeekend = day.d.getDay() === 0 || day.d.getDay() === 6;
                        return (
                          <Pressable
                            key={day.iso}
                            style={[
                              styles.cell,
                              {
                                height: ROW_H,
                                backgroundColor: booked ? '#FEFCE8' : (isWeekend ? '#F3F4F6' : 'white'),
                              },
                            ]}
                            onPress={() => {
                              if (booked) return;
                              setAssignModal({ busId: bus.id, dayIso: day.iso });
                            }}
                          >
                          </Pressable>
                        );
                      })}

                      {/* Blocks overlay */}
                      <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
                        {blocks.map((b) => (
                          <DraggableBlock
                            key={`${b.agreementId}-${b.busId}`}
                            block={b}
                            busIndex={busIndex}
                            focused={!!focusAgreementId && b.agreementId === focusAgreementId}
                            onPress={() => {
                              const ag = schedule.agreements.find((x) => x.id === b.agreementId);
                              if (!ag) return;
                              setSelected({ busId: b.busId, agreement: ag });
                            }}
                            onDrop={(args) => void onDrop(b, args)}
                          />
                        ))}
                      </View>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </ScrollView>
      </View>
    );
  };

  const assignCandidates = React.useMemo(() => {
    if (!assignModal) return [];
    return bookingsForDayAndBus(assignModal.busId, assignModal.dayIso);
  }, [assignModal, bookingsForDayAndBus]);

  return (
    <ScreenContainer style={{ flex: 1, paddingHorizontal: 0 }}>
      {/* Top controls */}
      <View style={styles.topBar}>
        <View style={styles.navRow}>
          <Pressable style={styles.iconBtn} onPress={() => setCursor((d) => monthStart(addDays(d, -1)))}>
            <ChevronLeft size={20} color="#374151" />
          </Pressable>
          <Text numberOfLines={1} ellipsizeMode="tail" style={styles.monthTitle}>
            {monthTitle(cursor)}
          </Text>
          <Pressable style={styles.iconBtn} onPress={() => setCursor((d) => monthStart(addDays(monthEnd(d), 1)))}>
            <ChevronRight size={20} color="#374151" />
          </Pressable>
        </View>

        <View style={styles.actionsRow}>
          <Pressable style={styles.iconBtn} onPress={() => setCursor(monthStart(new Date()))}>
            <Calendar size={18} color="#374151" />
          </Pressable>

          <Pressable
            style={[styles.actionBtn, (!schedule || schedule.buses.length === 0) && { opacity: 0.5 }]}
            onPress={() => setBusFilterOpen(true)}
            disabled={!schedule || schedule.buses.length === 0}
          >
            <Filter size={16} color="#374151" />
            <Text numberOfLines={1} style={styles.actionBtnText}>
              {busFilterLabel}
            </Text>
          </Pressable>
        </View>
      </View>

      {renderBody()}

      <View style={styles.fabContainer}>
        <Pressable style={styles.fab} onPress={() => setAddBusOpen(true)}>
          <Plus size={24} color="white" />
        </Pressable>
      </View>

      {/* Bus filter modal */}
      <Modal visible={busFilterOpen} transparent animationType="fade" onRequestClose={() => setBusFilterOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { maxHeight: '80%' }]}>
            <Text style={styles.modalTitle}>{t('busAvailability.busFilterTitle')}</Text>
            <ScrollView style={{ marginTop: 10 }}>
              <Pressable
                style={styles.pickRow}
                onPress={() => {
                  setSelectedBusIds(null);
                }}
              >
                <Text style={[styles.pickTitle, selectedBusIds == null && { color: '#4F46E5' }]}>{`${selectedBusIds == null ? '✓ ' : ''}${t('busAvailability.allBuses')}`}</Text>
              </Pressable>

              {(schedule?.buses ?? []).map((b) => {
                const label = busLabel(b);
                const isSelected = !!selectedBusIds?.includes(b.id);
                return (
                  <Pressable
                    key={b.id}
                    style={styles.pickRow}
                    onPress={() => {
                      setSelectedBusIds((prev) => {
                        // If currently showing all, start a subset selection.
                        if (!prev || prev.length === 0) return [b.id];
                        if (prev.includes(b.id)) {
                          const next = prev.filter((x) => x !== b.id);
                          return next.length === 0 ? null : next;
                        }
                        return [...prev, b.id];
                      });
                    }}
                  >
                    <Text style={[styles.pickTitle, isSelected && { color: '#4F46E5' }]}>{`${isSelected ? '✓ ' : ''}${label.primary}`}</Text>
                    {label.secondary ? <Text style={styles.pickSub}>{label.secondary}</Text> : null}
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.modalRow}>
              <Pressable style={styles.secondaryBtn} onPress={() => setBusFilterOpen(false)}>
                <Text style={styles.secondaryBtnText}>{t('common.done')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Assign Modal (tap on empty cell) */}
      <Modal visible={!!assignModal} transparent animationType="fade" onRequestClose={() => setAssignModal(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('busAvailability.assignModalTitle')}</Text>
            {assignModal && (
              <Text style={{ marginTop: 4, color: '#6B7280' }}>
                {t('busAvailability.assignModalSubtitle', {
                  date: formatDateDDMMYYYY(new Date(assignModal.dayIso)),  // Fixed to use helper
                  bus: schedule?.buses.find((b) => b.id === assignModal.busId)?.vehicleNumber ?? 'Bus',
                })}
              </Text>
            )}

            <ScrollView style={{ maxHeight: 300, marginTop: 12 }}>
              {assignCandidates.length === 0 ? (
                <Text style={{ color: '#9CA3AF', paddingVertical: 10, fontStyle: 'italic' }}>
                  {t('busAvailability.noCandidates')}
                </Text>
              ) : (
                assignCandidates.map((c) => (
                  <Pressable
                    key={c.id}
                    style={styles.pickRow}
                    onPress={async () => {
                      if (!assignModal) return;
                      setBusyAction(true);
                      try {
                        await assignBusToAgreement(c.id, assignModal.busId);
                        setAssignModal(null);
                        await load();
                      } catch (e: any) {
                        openConflictsIfAny(e) || Alert.alert(t('common.errorTitle'), e?.message ?? 'Failed');
                      } finally {
                        setBusyAction(false);
                      }
                    }}
                  >
                    <View>
                      <Text style={styles.pickTitle}>{c.customerName}</Text>
                      <Text style={styles.pickSub}>{c.fromDate} - {c.toDate}</Text>
                    </View>
                    <Plus size={20} color="#4F46E5" />
                  </Pressable>
                ))
              )}
            </ScrollView>

            <View style={styles.modalRow}>
              <Pressable style={styles.secondaryBtn} onPress={() => setAssignModal(null)}>
                <Text style={styles.secondaryBtnText}>{t('common.cancel')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Selected Block Action Modal */}
      <Modal visible={!!selected} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{selected?.agreement.customerName}</Text>
            <Text style={{ marginTop: 4, color: '#6B7280' }}>
              {selected?.agreement.fromDate} - {selected?.agreement.toDate}
            </Text>

            <View style={{ gap: 10, marginTop: 20 }}>
              <Pressable
                style={styles.primaryBtn}
                onPress={() => {
                  setSelected(null);
                  if (selected) tryOpenBooking(selected.agreement.id);
                }}
              >
                <Info size={18} color="white" />
                <Text style={styles.primaryBtnText}>{t('busAvailability.viewDetails')}</Text>
              </Pressable>

              <Pressable
                style={[styles.secondaryBtn, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}
                onPress={async () => {
                  if (!selected) return;
                  const busId = selected.busId;
                  const agId = selected.agreement.id;
                  const bus = schedule?.buses.find(b => b.id === busId);
                  const busText = bus ? bus.vehicleNumber : busId;

                  Alert.alert(
                    t('busAvailability.unassignBus'),
                    `${t('busAvailability.unassignConfirm')} ${busText}?`,
                    [
                      { text: t('common.cancel'), style: 'cancel' },
                      {
                        text: t('busAvailability.unassign'),
                        style: 'destructive',
                        onPress: async () => {
                          setBusyAction(true);
                          try {
                            await unassignBusFromAgreement(agId, busId);
                            setSelected(null);
                            await load();
                          } catch (e: any) {
                            Alert.alert(t('common.errorTitle'), e?.message ?? 'Failed');
                          } finally {
                            setBusyAction(false);
                          }
                        }
                      }
                    ]
                  );
                }}
              >
                <Settings size={18} color="#DC2626" />
                <Text style={[styles.secondaryBtnText, { color: '#DC2626' }]}>{t('busAvailability.unassign')}</Text>
              </Pressable>

              <Pressable style={styles.secondaryBtn} onPress={() => setSelected(null)}>
                <Text style={styles.secondaryBtnText}>{t('common.close')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Bus modal */}
      <Modal visible={addBusOpen} transparent animationType="fade" onRequestClose={() => setAddBusOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('busAvailability.addBus')}</Text>

            <Text style={styles.modalLabel}>{t('manageAssignments.vehicleNumber')}</Text>
            <TextInput value={busVehicleNumber} onChangeText={setBusVehicleNumber} placeholder="TN01AB0001" style={styles.input} />

            <Text style={styles.modalLabel}>{t('manageAssignments.busNameOptional')}</Text>
            <TextInput value={busName} onChangeText={setBusName} placeholder="Mini / Big" style={styles.input} />

            <View style={styles.modalRow}>
              <Pressable style={styles.secondaryBtn} onPress={() => setAddBusOpen(false)} disabled={busyAddBus}>
                <Text style={styles.secondaryBtnText}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable style={styles.primaryBtn} onPress={onAddBus} disabled={busyAddBus}>
                <Text style={styles.primaryBtnText}>{busyAddBus ? t('common.saving') : t('common.save')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  monthTitle: { fontSize: 16, fontWeight: '800', color: '#111827', minWidth: 100, textAlign: 'center' },
  iconBtn: { padding: 8, borderRadius: 8, backgroundColor: '#F3F4F6' },

  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: 200,
  },
  actionBtnText: { fontSize: 13, fontWeight: '700', color: '#374151' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  err: { fontWeight: '800', color: '#B91C1C' },
  errSub: { color: '#6B7280', textAlign: 'center', marginTop: 4 },
  retryBtn: { marginTop: 12, backgroundColor: '#111827', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  retryBtnText: { color: 'white', fontWeight: '700' },

  gridHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', backgroundColor: '#F9FAFB' },
  dateHeaderCell: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    backgroundColor: '#F3F4F6',
  },
  headerText: { fontWeight: '800', color: '#374151', fontSize: 12 },

  busHeaderCell: {
    height: 50,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB'
  },
  busHeaderPrimary: { fontWeight: '800', color: '#111827', fontSize: 13 },
  busHeaderSecondary: { fontSize: 11, color: '#6B7280' },

  dateCell: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  dateCellText: { fontSize: 13, fontWeight: '700', color: '#374151' },
  dateCellDay: { fontSize: 10, color: '#9CA3AF' },

  busCol: { borderRightWidth: 1, borderRightColor: '#E5E7EB', position: 'relative' },
  cell: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },

  block: {
    position: 'absolute',
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'white',
    paddingHorizontal: 6,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  blockTitle: { fontSize: 12, fontWeight: '800', color: '#111827' },
  blockSub: { fontSize: 10, color: '#4B5563', marginTop: 1 },

  fabContainer: { position: 'absolute', bottom: 20, right: 20 },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 6
  },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 16 },
  modalCard: { backgroundColor: 'white', borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  modalLabel: { marginTop: 16, marginBottom: 6, fontWeight: '700', color: '#374151' },

  pickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  pickTitle: { fontWeight: '700', color: '#111827', fontSize: 14 },
  pickSub: { color: '#6B7280', fontSize: 12, marginTop: 1 },

  modalRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 24 },
  primaryBtn: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnText: { color: 'white', fontWeight: '700' },

  secondaryBtn: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryBtnText: { fontWeight: '700', color: '#374151' },

  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: '#F9FAFB'
  },
});
