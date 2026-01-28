import * as React from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
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

import type { RootStackParamList } from '../navigation/types';
import type { BusResponse, ScheduleAgreementDto, ScheduleResponse } from '../types/api';
import { getSchedule } from '../api/schedule';
import { assignBusToAgreement, unassignBusFromAgreement } from '../api/agreements';
import { createBus, deleteBus, listBuses } from '../api/buses';
import { ApiError } from '../api/ApiError';

type Props = NativeStackScreenProps<RootStackParamList, 'ManageAssignments'>;

type Tab = 'unassigned' | 'buses';
type TourFilter = 'unassigned' | 'assigned' | 'all';

function pad2(n: number) {
  return `${n}`.padStart(2, '0');
}

function formatIsoDate(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function startOfMonth(anchor: Date) {
  return new Date(anchor.getFullYear(), anchor.getMonth(), 1);
}

function endOfMonth(anchor: Date) {
  // day 0 of next month => last day of current month
  return new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
}

function parseDdMmYyyy(input: string): Date | null {
  const s = (input ?? '').trim();
  const m = /^([0-9]{1,2})\/([0-9]{1,2})\/([0-9]{4})$/.exec(s);
  if (!m) return null;
  const dd = Number(m[1]);
  const mm = Number(m[2]);
  const yyyy = Number(m[3]);
  if (!dd || !mm || !yyyy) return null;
  return new Date(yyyy, mm - 1, dd);
}

function overlapsInclusive(aFrom: Date, aTo: Date, bFrom: Date, bTo: Date) {
  return aFrom <= bTo && bFrom <= aTo;
}

function requiredBusesCount(a: ScheduleAgreementDto) {
  return a.busCount && a.busCount > 0 ? a.busCount : 1;
}

function isTourUnassignedOrPartial(a: ScheduleAgreementDto) {
  return (a.assignedBusIds?.length ?? 0) < requiredBusesCount(a);
}

function busLabel(bus: BusResponse) {
  const primary = bus.name?.trim() ? bus.name.trim() : bus.vehicleNumber;
  const secondary = bus.name?.trim() ? bus.vehicleNumber : '';
  return { primary, secondary };
}

export function ManageAssignmentsScreen({ navigation }: Props) {
  const { t } = useTranslation();

  const [tab, setTab] = React.useState<Tab>('unassigned');
  const [monthAnchor, setMonthAnchor] = React.useState(() => new Date());

  const [schedule, setSchedule] = React.useState<ScheduleResponse | null>(null);
  const [buses, setBuses] = React.useState<BusResponse[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [selected, setSelected] = React.useState<ScheduleAgreementDto | null>(null);
  const [busyAction, setBusyAction] = React.useState(false);

  const [tourFilter, setTourFilter] = React.useState<TourFilter>('unassigned');

  const [addBusOpen, setAddBusOpen] = React.useState(false);
  const [busVehicleNumber, setBusVehicleNumber] = React.useState('');
  const [busName, setBusName] = React.useState('');
  const [busyAddBus, setBusyAddBus] = React.useState(false);

  const range = React.useMemo(() => {
    const from = startOfMonth(monthAnchor);
    const to = endOfMonth(monthAnchor);
    return { from, to, fromIso: formatIsoDate(from), toIso: formatIsoDate(to) };
  }, [monthAnchor]);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, allBuses] = await Promise.all([
        getSchedule(range.fromIso, range.toIso),
        listBuses({ includeInactive: true }),
      ]);
      setSchedule(s);
      setBuses(allBuses);
      return { schedule: s, buses: allBuses };
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load');
      return null;
    } finally {
      setLoading(false);
    }
  }, [range.fromIso, range.toIso]);

  useFocusEffect(
    React.useCallback(() => {
      load();
    }, [load]),
  );

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: t('manageAssignments.title'),
      headerRight: () => (
        <Pressable onPress={() => navigation.popToTop()} style={{ paddingHorizontal: 10 }}>
          <Text style={{ fontWeight: '900' }}>{t('common.home')}</Text>
        </Pressable>
      ),
    });
  }, [navigation, t]);

  const monthTitle = React.useMemo(() => {
    const d = monthAnchor;
    return `${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear()}`;
  }, [monthAnchor]);

  const busById = React.useMemo(() => {
    const map = new Map<string, BusResponse>();
    for (const b of buses) map.set(b.id, b);
    return map;
  }, [buses]);

  // Show ALL tours for the selected month (assigned + unassigned).
  const tours = React.useMemo(() => {
    if (!schedule) return [] as ScheduleAgreementDto[];
    const items = schedule.agreements.slice();
    // Sort by fromDate ascending
    return items.sort((x, y) => (parseDdMmYyyy(x.fromDate)?.getTime() ?? 0) - (parseDdMmYyyy(y.fromDate)?.getTime() ?? 0));
  }, [schedule]);

  const tourCounts = React.useMemo(() => {
    const all = tours.length;
    const unassigned = tours.filter(isTourUnassignedOrPartial).length;
    const assigned = all - unassigned;
    return { all, unassigned, assigned };
  }, [tours]);

  const visibleTours = React.useMemo(() => {
    if (tourFilter === 'all') return tours;
    if (tourFilter === 'assigned') return tours.filter((a) => !isTourUnassignedOrPartial(a));
    return tours.filter(isTourUnassignedOrPartial);
  }, [tourFilter, tours]);

	  const selectedBusSummary = React.useMemo(() => {
	    if (!selected) return null;
	    const required = requiredBusesCount(selected);
	    const assigned = selected.assignedBusIds?.length ?? 0;
	    const pending = Math.max(0, required - assigned);
	    const statusText = pending <= 0 ? t('manageAssignments.allAssigned') : t('manageAssignments.notAssigned', { pending });
	    return { required, assigned, pending, statusText };
	  }, [selected]);

  function conflictInfo(busId: string, target: ScheduleAgreementDto) {
    if (!schedule) return null;
    const tFrom = parseDdMmYyyy(target.fromDate);
    const tTo = parseDdMmYyyy(target.toDate);
    if (!tFrom || !tTo) return null;

    for (const other of schedule.agreements) {
      if (other.id === target.id) continue;
      if (!other.assignedBusIds?.includes(busId)) continue;
      const oFrom = parseDdMmYyyy(other.fromDate);
      const oTo = parseDdMmYyyy(other.toDate);
      if (!oFrom || !oTo) continue;
      if (overlapsInclusive(tFrom, tTo, oFrom, oTo)) {
        return other;
      }
    }
    return null;
  }

  async function doAssign(busId: string) {
    if (!selected) return;
    setBusyAction(true);
    try {
      const selectedId = selected.id;
      await assignBusToAgreement(selected.id, busId);
      // keep modal open but refresh selected (use fresh schedule data)
      const loaded = await load();
      const refreshed = loaded?.schedule.agreements.find((x) => x.id === selectedId) ?? null;
      setSelected(refreshed);
    } catch (e: any) {
      if (e instanceof ApiError && e.status === 409) {
        Alert.alert(t('manageAssignments.conflictTitle'), e.message);
      } else {
        Alert.alert(t('common.errorTitle'), e?.message ?? 'Failed');
      }
    } finally {
      setBusyAction(false);
    }
  }

  async function doUnassign(busId: string) {
    if (!selected) return;
    setBusyAction(true);
    try {
      const selectedId = selected.id;
      await unassignBusFromAgreement(selected.id, busId);
      const loaded = await load();
      const refreshed = loaded?.schedule.agreements.find((x) => x.id === selectedId) ?? null;
      setSelected(refreshed);
    } catch (e: any) {
      Alert.alert(t('common.errorTitle'), e?.message ?? 'Failed');
    } finally {
      setBusyAction(false);
    }
  }

  async function onAddBus() {
    const vn = busVehicleNumber.trim();
    const nm = busName.trim();
    if (!vn) {
      Alert.alert(t('common.errorTitle'), t('manageAssignments.vehicleNumberRequired'));
      return;
    }
    setBusyAddBus(true);
    try {
      await createBus(vn, nm || undefined);
      setBusVehicleNumber('');
      setBusName('');
      setAddBusOpen(false);
      await load();
    } catch (e: any) {
      Alert.alert(t('common.errorTitle'), e?.message ?? 'Failed');
    } finally {
      setBusyAddBus(false);
    }
  }

  async function onDeleteBus(bus: BusResponse) {
    Alert.alert(
      t('manageAssignments.deleteBus'),
      `${t('manageAssignments.confirmDeleteBus')}\n\n${bus.vehicleNumber}`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('manageAssignments.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBus(bus.id);
              await load();
            } catch (e: any) {
              Alert.alert(t('common.errorTitle'), e?.message ?? 'Failed');
            }
          },
        },
      ],
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.topBar}>
        <View style={styles.monthRow}>
          <Pressable style={styles.smallBtn} onPress={() => setMonthAnchor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}>
            <Text style={styles.smallBtnText}>{'<'}</Text>
          </Pressable>
          <Text numberOfLines={1} ellipsizeMode="tail" style={styles.monthTitle}>
            {monthTitle}
          </Text>
          <Pressable style={styles.smallBtn} onPress={() => setMonthAnchor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}>
            <Text style={styles.smallBtnText}>{'>'}</Text>
          </Pressable>
        </View>

        <View style={styles.actionsRow}>
          <Pressable style={styles.smallBtnOutline} onPress={load} disabled={loading}>
            <Text style={styles.smallBtnOutlineText}>{t('common.refresh')}</Text>
          </Pressable>
          <Pressable style={styles.smallBtnOutline} onPress={() => setAddBusOpen(true)}>
            <Text style={styles.smallBtnOutlineText}>{t('manageAssignments.addBus')}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.tabs}>
        <Pressable style={[styles.tabBtn, tab === 'unassigned' && styles.tabBtnActive]} onPress={() => setTab('unassigned')}>
          <Text style={[styles.tabText, tab === 'unassigned' && styles.tabTextActive]}>
            {t('manageAssignments.tabUnassigned')} ({tours.length})
          </Text>
        </Pressable>
        <Pressable style={[styles.tabBtn, tab === 'buses' && styles.tabBtnActive]} onPress={() => setTab('buses')}>
          <Text style={[styles.tabText, tab === 'buses' && styles.tabTextActive]}>
            {t('manageAssignments.tabBuses')} ({buses.length})
          </Text>
        </Pressable>
      </View>

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={{ color: '#6B7280' }}>{t('common.loading')}</Text>
        </View>
      )}

      {!loading && error && (
        <View style={styles.center}>
          <Text style={styles.err}>{t('common.errorTitle')}</Text>
          <Text style={styles.errSub}>{error}</Text>
          <Pressable style={styles.primaryBtn} onPress={load}>
            <Text style={styles.primaryBtnText}>{t('common.retry')}</Text>
          </Pressable>
        </View>
      )}

      {!loading && !error && tab === 'unassigned' && (
        <View style={{ flex: 1 }}>
          <View style={styles.filterRow}>
            <Pressable
              style={[styles.filterBtn, tourFilter === 'unassigned' && styles.filterBtnActive]}
              onPress={() => setTourFilter('unassigned')}
            >
              <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.filterText, tourFilter === 'unassigned' && styles.filterTextActive]}>
                {t('manageAssignments.filterUnassigned')} ({tourCounts.unassigned})
              </Text>
            </Pressable>
            <Pressable style={[styles.filterBtn, tourFilter === 'assigned' && styles.filterBtnActive]} onPress={() => setTourFilter('assigned')}>
              <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.filterText, tourFilter === 'assigned' && styles.filterTextActive]}>
                {t('manageAssignments.filterAssigned')} ({tourCounts.assigned})
              </Text>
            </Pressable>
            <Pressable style={[styles.filterBtn, tourFilter === 'all' && styles.filterBtnActive]} onPress={() => setTourFilter('all')}>
              <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.filterText, tourFilter === 'all' && styles.filterTextActive]}>
                {t('manageAssignments.filterAll')} ({tourCounts.all})
              </Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 30 }}>
            {tours.length === 0 ? (
              <Text style={{ color: '#6B7280', textAlign: 'center', marginTop: 30 }}>{t('manageAssignments.noTours')}</Text>
            ) : visibleTours.length === 0 ? (
              <Text style={{ color: '#6B7280', textAlign: 'center', marginTop: 30 }}>
                {tourFilter === 'assigned'
                  ? t('manageAssignments.noAssigned')
                  : tourFilter === 'unassigned'
                    ? t('manageAssignments.noUnassigned')
                    : t('manageAssignments.noTours')}
              </Text>
            ) : (
              visibleTours.map((a) => {
                const required = requiredBusesCount(a);
                const assigned = a.assignedBusIds?.length ?? 0;
                return (
                  <Pressable key={a.id} style={styles.card} onPress={() => setSelected(a)}>
                    <Text numberOfLines={1} ellipsizeMode="tail" style={styles.cardTitle}>
                      {a.customerName}
                    </Text>
                    <Text numberOfLines={1} ellipsizeMode="tail" style={styles.cardSub}>
                      {a.fromDate} - {a.toDate}
                    </Text>
                    <Text numberOfLines={1} ellipsizeMode="tail" style={styles.cardSub}>
                      {t('manageAssignments.buses')}: {assigned}/{required} • {a.busType}
                    </Text>
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        </View>
      )}

      {!loading && !error && tab === 'buses' && (
        <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 30 }}>
          {buses
            .slice()
            .sort((a, b) => a.vehicleNumber.localeCompare(b.vehicleNumber))
            .map((b) => {
              const label = busLabel(b);
              return (
                <View key={b.id} style={styles.busRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.busPrimary}>{label.primary}</Text>
                    {!!label.secondary && <Text style={styles.busSecondary}>{label.secondary}</Text>}
                    <Text style={[styles.busPill, { backgroundColor: b.isActive ? '#DCFCE7' : '#FEE2E2', color: b.isActive ? '#14532D' : '#7F1D1D' }]}>
                      {b.isActive ? t('manageAssignments.active') : t('manageAssignments.inactive')}
                    </Text>
                  </View>

                  {b.isActive && (
                    <Pressable style={styles.dangerBtn} onPress={() => onDeleteBus(b)}>
                      <Text style={styles.dangerBtnText}>{t('manageAssignments.delete')}</Text>
                    </Pressable>
                  )}
                </View>
              );
            })}
        </ScrollView>
      )}

      {/* Unassigned -> Assign/Unassign modal */}
      <Modal visible={!!selected} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('manageAssignments.assignTitle')}</Text>
            <Text style={{ marginTop: 6, fontWeight: '900' }}>{selected?.customerName}</Text>
            <Text numberOfLines={1} ellipsizeMode="tail" style={{ color: '#6B7280', marginTop: 2 }}>
              {selected?.fromDate} - {selected?.toDate}
            </Text>
	            {!!selectedBusSummary && <Text style={styles.modalSummary}>{selectedBusSummary.statusText}</Text>}

            <Text style={styles.modalLabel}>{t('manageAssignments.assignedBuses')}</Text>
            {(selected?.assignedBusIds?.length ?? 0) === 0 ? (
              <Text style={{ color: '#6B7280', marginTop: 6 }}>{t('manageAssignments.none')}</Text>
            ) : (
              selected!.assignedBusIds.map((id) => {
                const b = busById.get(id);
                const title = b ? busLabel(b).primary : id;
                return (
                  <View key={id} style={styles.assignedRow}>
                    <Text style={{ flex: 1, fontWeight: '800' }}>{title}</Text>
                    <Pressable style={styles.secondaryBtn} onPress={() => doUnassign(id)} disabled={busyAction}>
                      <Text style={styles.secondaryBtnText}>{t('manageAssignments.unassign')}</Text>
                    </Pressable>
                  </View>
                );
              })
            )}

            <Text style={styles.modalLabel}>{t('manageAssignments.assignBus')}</Text>
            <ScrollView style={{ maxHeight: 220, marginTop: 6 }}>
              {(schedule?.buses ?? [])
                .filter((b) => b.isActive)
                .map((b) => {
                  const already = !!selected?.assignedBusIds?.includes(b.id);
                  const conflict = selected ? conflictInfo(b.id, selected) : null;
                  const disabled = already || !!conflict || busyAction;
                  const label = busLabel(b);
                  return (
                    <Pressable
                      key={b.id}
                      style={[styles.pickRow, disabled && { opacity: 0.5 }]}
                      onPress={() => doAssign(b.id)}
                      disabled={disabled}
                    >
                      <Text style={styles.pickTitle}>{label.primary}</Text>
                      {!!label.secondary && <Text style={styles.pickSub}>{label.secondary}</Text>}
                      {already && <Text style={styles.pickSub}>{t('manageAssignments.alreadyAssigned')}</Text>}
                      {!!conflict && (
                        <Text style={[styles.pickSub, { color: '#B45309' }]}>
                          {t('manageAssignments.conflictWith')}: {conflict.customerName}
                        </Text>
                      )}
                    </Pressable>
                  );
                })}
            </ScrollView>

            <View style={styles.modalRow}>
              <Pressable style={styles.secondaryBtn} onPress={() => setSelected(null)} disabled={busyAction}>
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
            <Text style={styles.modalTitle}>{t('manageAssignments.addBus')}</Text>

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
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 8,
    flexWrap: 'wrap',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  monthRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexGrow: 1, flexShrink: 1, minWidth: 160 },
  actionsRow: { flexDirection: 'row', gap: 8 },
  monthTitle: { fontSize: 16, fontWeight: '800', flexShrink: 1 },
  smallBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallBtnText: { color: 'white', fontSize: 18, fontWeight: '900' },
  smallBtnOutline: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  smallBtnOutlineText: { fontWeight: '800' },

  tabs: { flexDirection: 'row', padding: 10, gap: 10, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  tabBtn: { flex: 1, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  tabBtnActive: { backgroundColor: '#111827', borderColor: '#111827' },
  tabText: { fontWeight: '900', color: '#111827' },
  tabTextActive: { color: 'white' },

  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingTop: 10,
    gap: 8,
    flexWrap: 'wrap',
  },
  filterBtn: {
    minWidth: 120,
    flexGrow: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  filterBtnActive: { backgroundColor: '#111827', borderColor: '#111827' },
  filterText: { fontWeight: '900', color: '#111827' },
  filterTextActive: { color: 'white' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, gap: 10 },
  err: { fontWeight: '800', color: '#B91C1C' },
  errSub: { color: '#6B7280', textAlign: 'center' },

  card: { backgroundColor: 'white', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 10 },
  cardTitle: { fontWeight: '900', color: '#111827', fontSize: 15 },
  cardSub: { color: '#6B7280', marginTop: 2, lineHeight: 18 },

  busRow: { flexDirection: 'row', gap: 10, alignItems: 'center', padding: 12, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 14, backgroundColor: 'white', marginBottom: 10 },
  busPrimary: { fontWeight: '900', color: '#111827' },
  busSecondary: { color: '#6B7280', marginTop: 2 },
  busPill: { alignSelf: 'flex-start', marginTop: 8, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, overflow: 'hidden', fontWeight: '900' },
  dangerBtn: { backgroundColor: '#DC2626', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12 },
  dangerBtnText: { color: 'white', fontWeight: '900' },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', padding: 18 },
  modalCard: { backgroundColor: 'white', borderRadius: 14, padding: 14 },
  modalTitle: { fontSize: 16, fontWeight: '900' },
	  modalSummary: { marginTop: 6, color: '#374151', fontWeight: '800' },
  modalLabel: { marginTop: 12, fontWeight: '900', color: '#374151' },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 6,
  },
  modalRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 14 },

  primaryBtn: { backgroundColor: '#111827', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  primaryBtnText: { color: 'white', fontWeight: '900' },
  secondaryBtn: { borderWidth: 1, borderColor: '#D1D5DB', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  secondaryBtnText: { fontWeight: '900' },

  assignedRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  pickRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  pickTitle: { fontWeight: '900', color: '#111827' },
  pickSub: { color: '#6B7280', marginTop: 2 },
});
