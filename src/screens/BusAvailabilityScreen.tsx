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
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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

import { Screen } from '../components/Screen';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, RADIUS, SHADOWS } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'BusAvailability'>;

const ROW_H = 48; // Increased for better touch target
const BUS_W = 140;
const DATE_W = 80;

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
  return d.toLocaleString(undefined, { month: 'long', year: 'numeric' });
}

function busLabel(bus: BusResponse): { primary: string; secondary?: string } {
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

          didDragRef.current = false;
          dragEnabledRef.current = false;
          setDragging(false);

          Animated.timing(pos, { toValue: { x: 0, y: 0 }, duration: 120, useNativeDriver: false }).start();

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
          borderColor: focused ? COLORS.primaryDark : COLORS.primary,
          backgroundColor: focused ? COLORS.primary : COLORS.primaryLight,
          zIndex: dragging ? 50 : 5,
          opacity: dragging ? 0.9 : 1,
          ...SHADOWS.soft,
        },
      ]}
      onTouchStart={() => {
        longPressTimer.current = setTimeout(() => {
          dragEnabledRef.current = true;
          setDragging(true);
        }, 300);
        didDragRef.current = false;
      }}
      onTouchEnd={() => {
        if (longPressTimer.current) clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
        if (didDragRef.current) {
          didDragRef.current = false;
          return;
        }
        if (!dragEnabledRef.current) onPress();
      }}
    >
      <Text numberOfLines={1} style={[styles.blockTitle, focused ? { color: COLORS.white } : { color: COLORS.primaryDark }]}>
        {block.customerName}
      </Text>
      <Text numberOfLines={1} style={[styles.blockSub, focused ? { color: COLORS.primaryLight } : { color: COLORS.primary }]}>
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
  const [selectedBusIds, setSelectedBusIds] = React.useState<string[] | null>(null);

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

      const visibleFrom = new Date(Math.max(from.getTime(), monthStartDate.getTime()));
      const visibleTo = new Date(Math.min(to.getTime(), monthEndDate.getTime()));
      const fromIdx = dayIndexByIso.get(formatIsoDate(visibleFrom));
      const toIdx = dayIndexByIso.get(formatIsoDate(visibleTo));
      if (fromIdx == null || toIdx == null) continue;

      for (const busId of a.assignedBusIds ?? []) {
        map.set(busId, [...(map.get(busId) ?? []), {
          agreementId: a.id,
          busId,
          customerName: a.customerName,
          fromIndex: Math.min(fromIdx, toIdx),
          toIndex: Math.max(fromIdx, toIdx),
          fromDate: a.fromDate,
          toDate: a.toDate,
        }]);
      }
    }
    return map;
  }, [dayIndexByIso, days, schedule]);

  const gridBuses = React.useMemo(() => {
    const buses = schedule?.buses ?? [];
    if (!selectedBusIds || selectedBusIds.length === 0) return buses;
    const wanted = new Set(selectedBusIds);
    const filtered = buses.filter((b) => wanted.has(b.id));
    return filtered.length > 0 ? filtered : buses;
  }, [schedule, selectedBusIds]);

  const busFilterLabel = React.useMemo(() => {
    if (!schedule || !selectedBusIds || selectedBusIds.length === 0) return t('busAvailability.allBuses');
    if (selectedBusIds.length === 1) return schedule.buses.find(b => b.id === selectedBusIds[0])?.vehicleNumber ?? t('busAvailability.allBuses');
    return t('busAvailability.selectedBusesCount', { count: selectedBusIds.length });
  }, [schedule, selectedBusIds, t]);

  React.useEffect(() => {
    headerHRef.current?.scrollTo({ x: 0, animated: false });
    bodyHRef.current?.scrollTo({ x: 0, animated: false });
  }, [cursor, selectedBusIds]);

  const confirmChange = React.useCallback(
    (title: string, message: string) =>
      new Promise<boolean>((resolve) => {
        Alert.alert(title, message, [
          { text: t('common.cancel'), style: 'cancel', onPress: () => resolve(false) },
          { text: t('common.ok'), onPress: () => resolve(true) },
        ], { cancelable: true });
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
    if (!schedule || busyAction) return;

    if (args.type === 'moveBus') {
      const buses = gridBuses;
      const targetIdx = Math.max(0, Math.min(buses.length - 1, args.targetBusIndex));
      const targetBus = buses[targetIdx];
      if (!targetBus || targetBus.id === block.busId) return;

      const ag = schedule.agreements.find((x) => x.id === block.agreementId);
      if (ag?.assignedBusIds?.includes(targetBus.id)) {
        Alert.alert(t('common.validationTitle'), t('busAvailability.alreadyAssignedToBus'));
        return;
      }

      const ok = await confirmChange(t('busAvailability.confirmChangeTitle'), t('busAvailability.confirmChangeQuestion'));
      if (!ok) return;

      setBusyAction(true);
      try {
        await unassignBusFromAgreement(block.agreementId, block.busId);
        try {
          await assignBusToAgreement(block.agreementId, targetBus.id);
        } catch (e) {
          try { await assignBusToAgreement(block.agreementId, block.busId); } catch { }
          if (!openConflictsIfAny(e)) Alert.alert(t('common.errorTitle'), String(e));
          return;
        }
        await load();
      } catch (e) {
        if (!openConflictsIfAny(e)) Alert.alert(t('common.errorTitle'), String(e));
      } finally {
        setBusyAction(false);
      }
      return;
    }

    const agFull = await getAgreementById(block.agreementId);
    const from = parseDateDDMMYYYY(agFull.fromDate);
    const to = parseDateDDMMYYYY(agFull.toDate);
    if (!from || !to) return;
    const newFrom = formatDateDDMMYYYY(addDays(from, args.deltaDays));
    const newTo = formatDateDDMMYYYY(addDays(to, args.deltaDays));

    const ok = await confirmChange(t('busAvailability.confirmChangeTitle'), t('busAvailability.confirmChangeQuestion'));
    if (!ok) return;

    setBusyAction(true);
    try {
      const req = toUpdateRequestFromAgreement(agFull, newFrom, newTo);
      await updateAgreement(block.agreementId, req);
      await load();
    } catch (e) {
      if (!openConflictsIfAny(e)) Alert.alert(t('common.errorTitle'), String(e));
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

  const renderBody = () => {
    if (loading) return <View style={styles.center}><ActivityIndicator color={COLORS.primary} size="large" /><Text style={{ marginTop: 10, color: COLORS.textSecondary }}>{t('busAvailability.loading')}</Text></View>;
    if (error) return <View style={styles.center}><Text style={styles.err}>{t('busAvailability.error')}</Text><Text style={styles.errSub}>{error}</Text><Button title={t('busAvailability.retry')} onPress={() => void load()} /></View>;
    if (!schedule || schedule.buses.length === 0) return <View style={styles.center}><Text style={{ color: COLORS.textSecondary, marginBottom: SPACING.md }}>{t('busAvailability.empty')}</Text><Button title={t('busAvailability.addBus')} onPress={() => setAddBusOpen(true)} /></View>;

    return (
      <View style={{ flex: 1 }}>
        <View style={styles.gridHeader}>
          <View style={[styles.dateHeaderCell, { width: DATE_W }]}>
            <Text style={styles.headerText}>{t('busAvailability.dateHeader')}</Text>
          </View>
          <ScrollView horizontal ref={headerHRef} showsHorizontalScrollIndicator={false} scrollEnabled={false}>
            <View style={{ flexDirection: 'row' }}>
              {gridBuses.map((b) => {
                const label = busLabel(b);
                return (
                  <View key={b.id} style={[styles.busHeaderCell, { width: BUS_W }]}>
                    <Text numberOfLines={1} style={styles.busHeaderPrimary}>{label.primary}</Text>
                    {label.secondary ? <Text numberOfLines={1} style={styles.busHeaderSecondary}>{label.secondary}</Text> : null}
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>

        <ScrollView ref={vRef} style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row' }}>
            <View style={{ width: DATE_W }}>
              {days.map((day) => (
                <View key={day.iso} style={[styles.dateCell, { height: ROW_H }]}>
                  <Text style={styles.dateCellText}>{day.label.slice(0, 5)}</Text>
                  <Text style={styles.dateCellDay}>{day.label.slice(0, 2)}</Text>
                </View>
              ))}
            </View>
            <ScrollView horizontal ref={bodyHRef} showsHorizontalScrollIndicator={true} onScroll={(e) => { if (syncingRef.current) return; syncingRef.current = true; headerHRef.current?.scrollTo({ x: e.nativeEvent.contentOffset.x, animated: false }); syncingRef.current = false; }} scrollEventThrottle={16}>
              <View style={{ flexDirection: 'row' }}>
                {gridBuses.map((bus, busIndex) => {
                  const blocks = blocksByBus.get(bus.id) ?? [];
                  return (
                    <View key={bus.id} style={[styles.busCol, { width: BUS_W, height: days.length * ROW_H }]}>
                      {days.map((day, rowIdx) => {
                        const booked = blocks.some((b) => rowIdx >= b.fromIndex && rowIdx <= b.toIndex);
                        return (
                          <Pressable key={day.iso} style={[styles.cell, { height: ROW_H, backgroundColor: booked ? COLORS.warningBg : COLORS.successBg }]} onPress={() => { if (booked) return; setAssignModal({ busId: bus.id, dayIso: day.iso }); }} />
                        );
                      })}
                      <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
                        {blocks.map((b) => (
                          <DraggableBlock key={`${b.agreementId}-${b.busId}`} block={b} busIndex={busIndex} focused={!!focusAgreementId && b.agreementId === focusAgreementId} onPress={() => { const ag = schedule.agreements.find((x) => x.id === b.agreementId); if (ag) setSelected({ busId: b.busId, agreement: ag }); }} onDrop={(args) => void onDrop(b, args)} />
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

  const assignCandidates = React.useMemo(() => { if (!assignModal) return []; return bookingsForDayAndBus(assignModal.busId, assignModal.dayIso); }, [assignModal, bookingsForDayAndBus]);

  return (
    <Screen style={styles.container} unsafe>
      <View style={styles.topBar}>
        <View style={styles.monthControls}>
          <Pressable style={styles.navBtn} onPress={() => setCursor((d) => monthStart(addDays(d, -1)))}>
            <MaterialCommunityIcons name="chevron-left" size={24} color={COLORS.textPrimary} />
          </Pressable>
          <Text style={styles.monthTitle}>{monthTitle(cursor)}</Text>
          <Pressable style={styles.navBtn} onPress={() => setCursor((d) => monthStart(addDays(monthEnd(d), 1)))}>
            <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.textPrimary} />
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 4 }}>
          <Button title={busFilterLabel} onPress={() => setBusFilterOpen(true)} variant="outline" size="sm" />
          <Button title={t('busAvailability.today')} onPress={() => setCursor(monthStart(new Date()))} variant="outline" size="sm" />
          <Button title={`+ ${t('busAvailability.addBus')}`} onPress={() => setAddBusOpen(true)} variant="primary" size="sm" />
        </ScrollView>
      </View>

      {renderBody()}

      {/* Bus filter modal */}
      <Modal visible={busFilterOpen} transparent animationType="fade" onRequestClose={() => setBusFilterOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { maxHeight: '80%' }]}>
            <Text style={styles.modalTitle}>{t('busAvailability.busFilterTitle')}</Text>
            <ScrollView style={{ marginTop: 10 }}>
              <Pressable style={styles.pickRow} onPress={() => setSelectedBusIds(null)}>
                <MaterialCommunityIcons name={selectedBusIds == null ? "checkbox-marked" : "checkbox-blank-outline"} size={24} color={COLORS.primary} />
                <Text style={styles.pickTitle}>{t('busAvailability.allBuses')}</Text>
              </Pressable>
              {(schedule?.buses ?? []).map((b) => {
                const label = busLabel(b);
                const isSelected = !!selectedBusIds?.includes(b.id);
                return (
                  <Pressable key={b.id} style={styles.pickRow} onPress={() => setSelectedBusIds((prev) => {
                    if (!prev || prev.length === 0) return [b.id];
                    if (prev.includes(b.id)) { const next = prev.filter((x) => x !== b.id); return next.length === 0 ? null : next; }
                    return [...prev, b.id];
                  })}>
                    <MaterialCommunityIcons name={isSelected ? "checkbox-marked" : "checkbox-blank-outline"} size={24} color={COLORS.primary} />
                    <View>
                      <Text style={styles.pickTitle}>{label.primary}</Text>
                      {label.secondary ? <Text style={styles.pickSub}>{label.secondary}</Text> : null}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
            <Button title={t('common.done')} onPress={() => setBusFilterOpen(false)} style={{ marginTop: SPACING.md }} />
          </View>
        </View>
      </Modal>

      {/* Add Bus modal */}
      <Modal visible={addBusOpen} transparent animationType="fade" onRequestClose={() => setAddBusOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('busAvailability.addBus')}</Text>
            <Input label={t('busAvailability.vehicleNumber')} value={busVehicleNumber} onChangeText={setBusVehicleNumber} placeholder="TN 01 AB 1234" autoCapitalize="characters" />
            <Input label={t('busAvailability.busNameOptional')} value={busName} onChangeText={setBusName} placeholder="Mini / Big" containerStyle={{ marginTop: SPACING.md }} />
            <View style={styles.modalActions}>
              <Button title={t('common.cancel')} onPress={() => setAddBusOpen(false)} variant="ghost" style={{ flex: 1 }} />
              <Button title={t('busAvailability.saveBus')} onPress={() => void onAddBus()} loading={busyAddBus} disabled={!busVehicleNumber.trim()} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Assign modal */}
      <Modal visible={!!assignModal} transparent animationType="fade" onRequestClose={() => setAssignModal(null)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { maxHeight: '80%' }]}>
            <Text style={styles.modalTitle}>{t('busAvailability.selectBooking')}</Text>
            <ScrollView style={{ marginTop: 10 }}>
              {assignCandidates.length === 0 ? <Text style={{ color: COLORS.textSecondary, textAlign: 'center', marginVertical: SPACING.lg }}>{t('busAvailability.noBookingsToAssign')}</Text> :
                assignCandidates.map((a) => (
                  <Pressable key={a.id} style={styles.pickRow} onPress={async () => {
                    if (!assignModal) return;
                    setBusyAction(true);
                    try { await assignBusToAgreement(a.id, assignModal.busId); setAssignModal(null); await load(); } catch (e) { if (!openConflictsIfAny(e)) Alert.alert(t('common.errorTitle'), String(e)); } finally { setBusyAction(false); }
                  }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.pickTitle}>{a.customerName}</Text>
                      <Text style={styles.pickSub}>{a.fromDate} - {a.toDate}</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.textTertiary} />
                  </Pressable>
                ))
              }
            </ScrollView>
            <Button title={t('common.cancel')} onPress={() => setAssignModal(null)} variant="ghost" style={{ marginTop: SPACING.md }} />
          </View>
        </View>
      </Modal>

      {/* Selected booking actions */}
      <Modal visible={!!selected} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{selected?.agreement.customerName ?? ''}</Text>
            <Text style={{ color: COLORS.textSecondary, marginBottom: SPACING.lg }}>{selected?.agreement.fromDate} - {selected?.agreement.toDate}</Text>
            <Button title={t('busAvailability.openBooking')} onPress={() => { if (!selected) return; void tryOpenBooking(selected.agreement.id); setSelected(null); }} variant="secondary" style={{ marginBottom: SPACING.sm }} />
            <Button title={t('busAvailability.unassign')} onPress={async () => { if (!selected) return; setBusyAction(true); try { await unassignBusFromAgreement(selected.agreement.id, selected.busId); setSelected(null); await load(); } catch (e: any) { Alert.alert(t('common.errorTitle'), String(e)); } finally { setBusyAction(false); } }} variant="danger" />
            <Button title={t('common.cancel')} onPress={() => setSelected(null)} variant="ghost" style={{ marginTop: SPACING.sm }} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: COLORS.background, flex: 1 },
  topBar: { padding: SPACING.sm, backgroundColor: COLORS.surface, ...SHADOWS.soft, zIndex: 10 },
  monthControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm },
  navBtn: { padding: SPACING.sm },
  monthTitle: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary, marginHorizontal: SPACING.md, minWidth: 120, textAlign: 'center' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  err: { fontWeight: 'bold', color: COLORS.error, fontSize: FONT_SIZE.lg },
  errSub: { color: COLORS.textSecondary, textAlign: 'center', marginBottom: SPACING.md },

  gridHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: COLORS.surface },
  dateHeaderCell: { height: 48, justifyContent: 'center', paddingHorizontal: SPACING.sm, borderRightWidth: 1, borderRightColor: COLORS.border },
  headerText: { fontWeight: 'bold', color: COLORS.textSecondary, fontSize: FONT_SIZE.xs },
  busHeaderCell: { height: 48, justifyContent: 'center', paddingHorizontal: SPACING.sm, borderRightWidth: 1, borderRightColor: COLORS.border, alignItems: 'center' },
  busHeaderPrimary: { fontWeight: 'bold', color: COLORS.textPrimary, fontSize: FONT_SIZE.sm },
  busHeaderSecondary: { color: COLORS.textSecondary, fontSize: 10 },

  dateCell: { justifyContent: 'center', paddingHorizontal: SPACING.sm, borderRightWidth: 1, borderRightColor: COLORS.border, borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: COLORS.surface, alignItems: 'center', flexDirection: 'row', gap: 4 },
  dateCellText: { fontWeight: 'bold', color: COLORS.textPrimary, fontSize: FONT_SIZE.xs },
  dateCellDay: { color: COLORS.textSecondary, fontSize: 10 },

  busCol: { borderRightWidth: 1, borderRightColor: COLORS.border },
  cell: { borderBottomWidth: 1, borderBottomColor: COLORS.border },

  block: { position: 'absolute', left: 4, right: 4, borderWidth: 1, borderRadius: RADIUS.sm, paddingHorizontal: 6, paddingVertical: 4 },
  blockTitle: { fontWeight: 'bold', fontSize: 11 },
  blockSub: { fontWeight: '500', fontSize: 9 },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: SPACING.lg },
  modalCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.lg },
  modalTitle: { fontSize: FONT_SIZE.lg, fontWeight: 'bold', marginBottom: SPACING.md, color: COLORS.textPrimary, textAlign: 'center' },
  modalActions: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.lg },
  pickRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.divider, gap: SPACING.md },
  pickTitle: { fontWeight: 'bold', color: COLORS.textPrimary, fontSize: FONT_SIZE.md },
  pickSub: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm },
});
