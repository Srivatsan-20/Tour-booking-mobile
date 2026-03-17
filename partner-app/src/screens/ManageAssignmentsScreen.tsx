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
import { Bus, Calendar, ChevronLeft, ChevronRight, Plus, RefreshCw, Trash2, X } from 'lucide-react-native';

import type { RootStackParamList } from '../navigation/types';
import type { BusResponse, ScheduleAgreementDto, ScheduleResponse } from '../types/api';
import { getSchedule } from '../api/schedule';
import { assignBusToAgreement, unassignBusFromAgreement } from '../api/agreements';
import { createBus, deleteBus, listBuses } from '../api/buses';
import { ApiError } from '../api/ApiError';
import { ScreenContainer } from '../components/ScreenContainer';
import { ListCard } from '../components/ListCard';

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
    <ScreenContainer style={{ flex: 1, paddingHorizontal: 0 }}>
      <View style={styles.topBar}>
        <View style={styles.monthRow}>
          <Pressable style={styles.iconBtn} onPress={() => setMonthAnchor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}>
            <ChevronLeft size={20} color="#374151" />
          </Pressable>
          <Text numberOfLines={1} ellipsizeMode="tail" style={styles.monthTitle}>
            {monthTitle}
          </Text>
          <Pressable style={styles.iconBtn} onPress={() => setMonthAnchor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}>
            <ChevronRight size={20} color="#374151" />
          </Pressable>
        </View>

        <View style={styles.actionsRow}>
          <Pressable style={styles.actionBtn} onPress={load} disabled={loading}>
            <RefreshCw size={16} color="#374151" />
          </Pressable>
          <Pressable style={[styles.actionBtn, { backgroundColor: '#111827' }]} onPress={() => setAddBusOpen(true)}>
            <Plus size={16} color="white" />
            <Text style={styles.addBusText}>{t('manageAssignments.addBus')}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.tabsContainer}>
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
      </View>

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={{ color: '#6B7280', marginTop: 10 }}>{t('common.loading')}</Text>
        </View>
      )}

      {!loading && error && (
        <View style={styles.center}>
          <Text style={styles.err}>{t('common.errorTitle')}</Text>
          <Text style={styles.errSub}>{error}</Text>
          <Pressable style={styles.retryBtn} onPress={load}>
            <Text style={styles.retryBtnText}>{t('common.retry')}</Text>
          </Pressable>
        </View>
      )}

      {!loading && !error && tab === 'unassigned' && (
        <View style={{ flex: 1 }}>
          <View style={styles.filterRow}>
            {['unassigned', 'assigned', 'all'].map((f) => (
              <Pressable
                key={f}
                style={[styles.filterBtn, tourFilter === f && styles.filterBtnActive]}
                onPress={() => setTourFilter(f as TourFilter)}
              >
                <Text style={[styles.filterText, tourFilter === f && styles.filterTextActive]}>
                  {f === 'unassigned' ? t('manageAssignments.filterUnassigned') :
                    f === 'assigned' ? t('manageAssignments.filterAssigned') :
                      t('manageAssignments.filterAll')}
                  {' '}({f === 'unassigned' ? tourCounts.unassigned : f === 'assigned' ? tourCounts.assigned : tourCounts.all})
                </Text>
              </Pressable>
            ))}
          </View>

          <ScrollView contentContainerStyle={styles.listContent}>
            {visibleTours.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>{t('manageAssignments.noTours')}</Text>
              </View>
            ) : (
              visibleTours.map((a) => {
                const required = requiredBusesCount(a);
                const assigned = a.assignedBusIds?.length ?? 0;
                return (
                  <ListCard
                    key={a.id}
                    title={a.customerName}
                    subtitle={`${a.fromDate} - ${a.toDate}`}
                    meta1={{
                      text: `${t('manageAssignments.buses')}: ${assigned}/${required}`,
                      icon: <Bus size={14} color="#6B7280" />
                    }}
                    status={assigned < required ? {
                      text: 'Pending Bus',
                      bg: '#FEF2F2',
                      color: '#B91C1C'
                    } : {
                      text: 'Assigned',
                      bg: '#ECFDF5',
                      color: '#047857'
                    }}
                    onPress={() => setSelected(a)}
                  />
                );
              })
            )}
          </ScrollView>
        </View>
      )}

      {!loading && !error && tab === 'buses' && (
        <ScrollView contentContainerStyle={styles.listContent}>
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
                    <View style={[styles.busPill, { backgroundColor: b.isActive ? '#DCFCE7' : '#FEE2E2' }]}>
                      <Text style={{ color: b.isActive ? '#14532D' : '#7F1D1D', fontSize: 11, fontWeight: '700' }}>
                        {b.isActive ? t('manageAssignments.active') : t('manageAssignments.inactive')}
                      </Text>
                    </View>
                  </View>

                  {b.isActive && (
                    <Pressable style={styles.dangerIconBtn} onPress={() => onDeleteBus(b)}>
                      <Trash2 size={18} color="#DC2626" />
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
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('manageAssignments.assignTitle')}</Text>
              <Pressable onPress={() => setSelected(null)}>
                <X size={24} color="#374151" />
              </Pressable>
            </View>

            <View style={styles.modalSubHeader}>
              <Text style={styles.modalCustomer}>{selected?.customerName}</Text>
              <Text style={styles.modalDate}>{selected?.fromDate} - {selected?.toDate}</Text>
            </View>

            {!!selectedBusSummary && <View style={styles.statusBox}><Text style={styles.modalSummary}>{selectedBusSummary.statusText}</Text></View>}

            <Text style={styles.modalSectionTitle}>{t('manageAssignments.assignedBuses')}</Text>
            {(selected?.assignedBusIds?.length ?? 0) === 0 ? (
              <Text style={styles.emptyTextSmall}>{t('manageAssignments.none')}</Text>
            ) : (
              selected!.assignedBusIds.map((id) => {
                const b = busById.get(id);
                const title = b ? busLabel(b).primary : id;
                return (
                  <View key={id} style={styles.assignedRow}>
                    <Text style={styles.assignedBusText}>{title}</Text>
                    <Pressable style={styles.unassignBtn} onPress={() => doUnassign(id)} disabled={busyAction}>
                      <Text style={styles.unassignBtnText}>{t('manageAssignments.unassign')}</Text>
                    </Pressable>
                  </View>
                );
              })
            )}

            <Text style={styles.modalSectionTitle}>{t('manageAssignments.assignBus')}</Text>
            <ScrollView style={{ maxHeight: 220, marginTop: 8 }}>
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
                      <View>
                        <Text style={styles.pickTitle}>{label.primary}</Text>
                        {!!label.secondary && <Text style={styles.pickSub}>{label.secondary}</Text>}
                        {already && <Text style={styles.pickSub}>{t('manageAssignments.alreadyAssigned')}</Text>}
                        {!!conflict && (
                          <Text style={[styles.pickSub, { color: '#B45309' }]}>
                            {t('manageAssignments.conflictWith')}: {conflict.customerName}
                          </Text>
                        )}
                      </View>
                      {!disabled && !already && <Plus size={20} color="#4F46E5" />}
                    </Pressable>
                  );
                })}
            </ScrollView>
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
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topBar: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  monthTitle: { fontSize: 16, fontWeight: '800', color: '#111827', textAlign: 'center', flexShrink: 1 },
  iconBtn: { padding: 8, borderRadius: 8, backgroundColor: '#F3F4F6' },

  actionsRow: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  addBusText: { fontSize: 13, fontWeight: '700', color: 'white' },

  tabsContainer: { backgroundColor: 'white', paddingHorizontal: 20, paddingTop: 10 },
  tabs: { flexDirection: 'row', padding: 4, backgroundColor: '#F3F4F6', borderRadius: 12 },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabBtnActive: { backgroundColor: 'white', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  tabText: { fontWeight: '600', color: '#6B7280', fontSize: 13 },
  tabTextActive: { color: '#111827', fontWeight: '800' },

  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 10,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 99,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: 'transparent'
  },
  filterBtnActive: { backgroundColor: '#EEF2FF', borderColor: '#818CF8' },
  filterText: { fontSize: 12, fontWeight: '700', color: '#4B5563' },
  filterTextActive: { color: '#4F46E5' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, gap: 10 },
  err: { fontWeight: '800', color: '#B91C1C' },
  errSub: { color: '#6B7280', textAlign: 'center' },
  retryBtn: { marginTop: 10, backgroundColor: '#111827', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  retryBtnText: { color: 'white', fontWeight: '700' },

  listContent: { padding: 20, gap: 10, paddingBottom: 40 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 40 },
  emptyText: { color: '#9CA3AF', fontSize: 14, fontWeight: '500' },

  busRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    backgroundColor: 'white',
    marginBottom: 0
  },
  busPrimary: { fontWeight: '800', color: '#111827', fontSize: 15 },
  busSecondary: { color: '#6B7280', fontSize: 13, marginTop: 2 },
  busPill: { alignSelf: 'flex-start', marginTop: 8, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  dangerIconBtn: { padding: 10, backgroundColor: '#FEF2F2', borderRadius: 10 },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 16 },
  modalCard: { backgroundColor: 'white', borderRadius: 20, padding: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  modalSubHeader: { marginTop: 4, marginBottom: 16 },
  modalCustomer: { fontSize: 16, fontWeight: '700', color: '#111827' },
  modalDate: { fontSize: 14, color: '#6B7280', marginTop: 2 },

  statusBox: { backgroundColor: '#F3F4F6', padding: 10, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 10 },
  modalSummary: { color: '#374151', fontWeight: '700', fontSize: 13 },

  modalSectionTitle: { marginTop: 16, fontSize: 14, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 },
  emptyTextSmall: { color: '#9CA3AF', marginTop: 8, fontStyle: 'italic' },

  assignedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  assignedBusText: { fontSize: 15, fontWeight: '700', color: '#111827' },
  unassignBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#FEF2F2', borderRadius: 8 },
  unassignBtnText: { color: '#DC2626', fontSize: 12, fontWeight: '700' },

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

  modalLabel: { marginTop: 16, marginBottom: 6, fontWeight: '700', color: '#374151' },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: '#F9FAFB'
  },
  modalRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 24 },
  primaryBtn: { backgroundColor: '#4F46E5', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10 },
  primaryBtnText: { color: 'white', fontWeight: '700' },
  secondaryBtn: { backgroundColor: '#F3F4F6', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10 },
  secondaryBtnText: { fontWeight: '700', color: '#374151' },
});
