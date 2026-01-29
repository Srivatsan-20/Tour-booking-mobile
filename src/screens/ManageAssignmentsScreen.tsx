import * as React from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
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
import type { BusResponse, ScheduleAgreementDto, ScheduleResponse } from '../types/api';
import { getSchedule } from '../api/schedule';
import { assignBusToAgreement, unassignBusFromAgreement } from '../api/agreements';
import { createBus, deleteBus, listBuses } from '../api/buses';
import { ApiError } from '../api/ApiError';

import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, RADIUS, SHADOWS } from '../theme';

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
          <MaterialCommunityIcons name="home" size={24} color={COLORS.primary} />
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

  const tours = React.useMemo(() => {
    if (!schedule) return [] as ScheduleAgreementDto[];
    const items = schedule.agreements.slice();
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
  }, [selected, t]);

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
    <Screen style={styles.container}>
      <View style={styles.topBar}>
        <View style={styles.monthRow}>
          <Pressable style={styles.navBtn} onPress={() => setMonthAnchor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}>
            <MaterialCommunityIcons name="chevron-left" size={28} color={COLORS.textPrimary} />
          </Pressable>
          <Text style={styles.monthTitle}>{monthTitle}</Text>
          <Pressable style={styles.navBtn} onPress={() => setMonthAnchor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}>
            <MaterialCommunityIcons name="chevron-right" size={28} color={COLORS.textPrimary} />
          </Pressable>
        </View>

        <View style={styles.actionsRow}>
          <Button title={t('common.refresh')} onPress={() => void load()} variant="outline" size="sm" />
          <Button title={t('manageAssignments.addBus')} onPress={() => setAddBusOpen(true)} variant="outline" size="sm" />
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
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={{ color: COLORS.textSecondary, marginTop: SPACING.md }}>{t('common.loading')}</Text>
        </View>
      )}

      {!loading && error && (
        <View style={styles.center}>
          <Text style={styles.err}>{t('common.errorTitle')}</Text>
          <Text style={styles.errSub}>{error}</Text>
          <Button title={t('common.retry')} onPress={() => void load()} />
        </View>
      )}

      {!loading && !error && tab === 'unassigned' && (
        <View style={{ flex: 1 }}>
          <View style={styles.filterRow}>
            <Pressable
              style={[styles.filterBtn, tourFilter === 'unassigned' && styles.filterBtnActive]}
              onPress={() => setTourFilter('unassigned')}
            >
              <Text style={[styles.filterText, tourFilter === 'unassigned' && styles.filterTextActive]}>
                {t('manageAssignments.filterUnassigned')} ({tourCounts.unassigned})
              </Text>
            </Pressable>
            <Pressable style={[styles.filterBtn, tourFilter === 'assigned' && styles.filterBtnActive]} onPress={() => setTourFilter('assigned')}>
              <Text style={[styles.filterText, tourFilter === 'assigned' && styles.filterTextActive]}>
                {t('manageAssignments.filterAssigned')} ({tourCounts.assigned})
              </Text>
            </Pressable>
            <Pressable style={[styles.filterBtn, tourFilter === 'all' && styles.filterBtnActive]} onPress={() => setTourFilter('all')}>
              <Text style={[styles.filterText, tourFilter === 'all' && styles.filterTextActive]}>
                {t('manageAssignments.filterAll')} ({tourCounts.all})
              </Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.listContent}>
            {tours.length === 0 ? (
              <Text style={styles.emptyText}>{t('manageAssignments.noTours')}</Text>
            ) : visibleTours.length === 0 ? (
              <Text style={styles.emptyText}>
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
                  <Card key={a.id} onPress={() => setSelected(a)} style={{ marginBottom: SPACING.md }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cardTitle}>{a.customerName}</Text>
                        <Text style={styles.cardSub}>{a.fromDate} - {a.toDate}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.cardSub, { fontWeight: FONT_WEIGHT.bold, color: COLORS.primary }]}>
                          {t('manageAssignments.buses')}: {assigned}/{required}
                        </Text>
                        <Text style={styles.cardSub}>{a.busType}</Text>
                      </View>
                    </View>
                  </Card>
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
                <Card key={b.id} style={{ marginBottom: SPACING.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.busPrimary}>{label.primary}</Text>
                    {!!label.secondary && <Text style={styles.busSecondary}>{label.secondary}</Text>}
                    <View style={[styles.busPill, { backgroundColor: b.isActive ? COLORS.successBg : COLORS.errorBg }]}>
                      <Text style={[styles.busPillText, { color: b.isActive ? COLORS.success : COLORS.error }]}>
                        {b.isActive ? t('manageAssignments.active') : t('manageAssignments.inactive')}
                      </Text>
                    </View>
                  </View>
                  <Button
                    title={t('manageAssignments.delete')}
                    onPress={() => onDeleteBus(b)}
                    variant="danger"
                    size="sm"
                    leftIcon={<MaterialCommunityIcons name="delete" size={16} color="white" />}
                  />
                </Card>
              );
            })}
        </ScrollView>
      )}

      {/* Unassigned -> Assign/Unassign modal */}
      <Modal visible={!!selected} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('manageAssignments.assignTitle')}</Text>
            <View style={{ marginBottom: SPACING.md }}>
              <Text style={{ fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary }}>{selected?.customerName}</Text>
              <Text style={{ color: COLORS.textSecondary }}>{selected?.fromDate} - {selected?.toDate}</Text>
              {!!selectedBusSummary && <Text style={{ marginTop: 4, color: COLORS.primary, fontWeight: FONT_WEIGHT.bold }}>{selectedBusSummary.statusText}</Text>}
            </View>

            <Text style={styles.modalLabel}>{t('manageAssignments.assignedBuses')}</Text>
            {(selected?.assignedBusIds?.length ?? 0) === 0 ? (
              <Text style={{ color: COLORS.textTertiary, marginVertical: SPACING.xs }}>{t('manageAssignments.none')}</Text>
            ) : (
              selected!.assignedBusIds.map((id) => {
                const b = busById.get(id);
                const title = b ? busLabel(b).primary : id;
                return (
                  <View key={id} style={styles.assignedRow}>
                    <Text style={{ flex: 1, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary }}>{title}</Text>
                    <Button title={t('manageAssignments.unassign')} onPress={() => doUnassign(id)} variant="ghost" size="sm" disabled={busyAction} />
                  </View>
                );
              })
            )}

            <Text style={styles.modalLabel}>{t('manageAssignments.assignBus')}</Text>
            <ScrollView style={{ maxHeight: 220, marginTop: SPACING.xs }}>
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
                        {already && <Text style={[styles.pickSub, { color: COLORS.success }]}>{t('manageAssignments.alreadyAssigned')}</Text>}
                        {!!conflict && (
                          <Text style={[styles.pickSub, { color: COLORS.warning }]}>
                            {t('manageAssignments.conflictWith')}: {conflict.customerName}
                          </Text>
                        )}
                      </View>
                      {!already && !conflict && <MaterialCommunityIcons name="plus-circle-outline" size={24} color={COLORS.primary} />}
                    </Pressable>
                  );
                })}
            </ScrollView>

            <Button title={t('common.close')} onPress={() => setSelected(null)} variant="secondary" style={{ marginTop: SPACING.lg }} disabled={busyAction} />
          </View>
        </View>
      </Modal>

      {/* Add Bus modal */}
      <Modal visible={addBusOpen} transparent animationType="fade" onRequestClose={() => setAddBusOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('manageAssignments.addBus')}</Text>

            <Input label={t('manageAssignments.vehicleNumber')} value={busVehicleNumber} onChangeText={setBusVehicleNumber} placeholder="TN01AB0001" autoCapitalize="characters" />
            <Input label={t('manageAssignments.busNameOptional')} value={busName} onChangeText={setBusName} placeholder="Mini / Big" containerStyle={{ marginTop: SPACING.md }} />

            <View style={styles.modalActions}>
              <Button title={t('common.cancel')} onPress={() => setAddBusOpen(false)} variant="ghost" style={{ flex: 1 }} />
              <Button title={busyAddBus ? t('common.saving') : t('common.save')} onPress={() => void onAddBus()} loading={busyAddBus} disabled={!busVehicleNumber.trim()} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: COLORS.background },
  topBar: {
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    ...SHADOWS.soft,
    zIndex: 10,
    gap: SPACING.md,
  },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.md },
  navBtn: { padding: SPACING.xs },
  monthTitle: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary, minWidth: 100, textAlign: 'center' },
  actionsRow: { flexDirection: 'row', justifyContent: 'center', gap: SPACING.sm },

  tabs: { flexDirection: 'row', padding: SPACING.sm, gap: SPACING.sm, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tabBtn: { flex: 1, paddingVertical: SPACING.sm, alignItems: 'center', borderRadius: RADIUS.md },
  tabBtnActive: { backgroundColor: COLORS.primaryLight },
  tabText: { fontWeight: FONT_WEIGHT.bold, color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.primary },

  filterRow: { flexDirection: 'row', padding: SPACING.sm, gap: SPACING.xs },
  filterBtn: { flex: 1, paddingVertical: SPACING.xs, paddingHorizontal: SPACING.sm, borderRadius: RADIUS.round, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', backgroundColor: COLORS.surface },
  filterBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontWeight: FONT_WEIGHT.bold, color: COLORS.textSecondary, fontSize: 11 },
  filterTextActive: { color: COLORS.surface },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  err: { fontWeight: 'bold', color: COLORS.error, fontSize: FONT_SIZE.lg },
  errSub: { color: COLORS.textSecondary, textAlign: 'center', marginBottom: SPACING.md },
  emptyText: { color: COLORS.textTertiary, textAlign: 'center', marginTop: SPACING.xl, fontSize: FONT_SIZE.md },

  listContent: { padding: SPACING.md, paddingBottom: SPACING.xl },
  cardTitle: { fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary, fontSize: FONT_SIZE.md },
  cardSub: { color: COLORS.textSecondary, marginTop: 2, fontSize: FONT_SIZE.sm },

  busPrimary: { fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary, fontSize: FONT_SIZE.md },
  busSecondary: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm },
  busPill: { alignSelf: 'flex-start', marginTop: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.round },
  busPillText: { fontWeight: FONT_WEIGHT.bold, fontSize: 10 },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: SPACING.lg },
  modalCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.lg },
  modalTitle: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, marginBottom: SPACING.lg, color: COLORS.textPrimary, textAlign: 'center' },
  modalLabel: { marginTop: SPACING.md, fontWeight: FONT_WEIGHT.bold, color: COLORS.textSecondary, fontSize: FONT_SIZE.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
  modalActions: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.lg },

  assignedRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.xs, paddingVertical: SPACING.xs, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  pickRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  pickTitle: { fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary, fontSize: FONT_SIZE.md },
  pickSub: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm },
});
