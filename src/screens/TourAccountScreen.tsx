import * as React from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  LayoutAnimation,
  UIManager
} from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChevronDown, ChevronUp, Plus, Trash2, FileText, Share2, Save, RefreshCw } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import type { RootStackParamList } from '../navigation/types';
import { getAgreementById } from '../api/agreements';
import { getAgreementAccounts, upsertAgreementAccounts } from '../api/accounts';
import type { AgreementResponse, BusResponse } from '../types/api';
import type { AgreementAccountsResponse } from '../types/accounts';
import { ScreenContainer } from '../components/ScreenContainer';
import { Theme } from '../constants/Theme';
import { generateAccountPdf } from '../utils/accountPdfGenerator';
import { useAuth } from '../context/AuthContext';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

type Props = NativeStackScreenProps<RootStackParamList, 'TourAccount'>;

type EditableFuel = { place: string; liters: string; cost: string };
type EditableOther = { description: string; amount: string };
type EditableBus = {
  busId: string | null;
  label: string;
  driverBatta: string;
  startKm: string;
  endKm: string;
  fuelEntries: EditableFuel[];
  otherExpenses: EditableOther[];
  // Transient fields for UI (mapped to otherExpenses on save)
  tolls: string;
  parking: string;
  permit: string;
};

function cleanDecimalInput(s: string): string {
  return s.replace(/[^0-9.]/g, '');
}

function cleanIntInput(s: string): string {
  return s.replace(/[^0-9]/g, '');
}

function toNum(s: string): number {
  const x = Number.parseFloat((s ?? '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(x) ? x : 0;
}

function toIntOrNull(s: string): string | null {
  const cleaned = cleanIntInput(s ?? '');
  return cleaned.trim() ? cleaned : null;
}

function toDecOrNull(s: string): string | null {
  const cleaned = cleanDecimalInput(s ?? '');
  return cleaned.trim() ? cleaned : null;
}

function busLabel(bus: BusResponse): string {
  const name = bus.name ? ` (${bus.name})` : '';
  return `${bus.vehicleNumber}${name}`;
}

// Helper to extract specific expenses from the list
function findExpense(others: EditableOther[], key: string): string {
  const found = others.find(o => o.description === key);
  return found ? found.amount : '';
}

function filterOutSpecialExpenses(others: EditableOther[]): EditableOther[] {
  const keys = ['Tolls', 'Parking', 'Permit/RTO'];
  return others.filter(o => !keys.includes(o.description));
}

function buildInitialBuses(accounts: AgreementAccountsResponse): EditableBus[] {
  const required = accounts.requiredBusCount > 0 ? accounts.requiredBusCount : 1;
  const assigned = accounts.assignedBuses ?? [];

  const existing = (accounts.busExpenses ?? []).map((be, idx) => {
    const label = be.busVehicleNumber ? `${be.busVehicleNumber}${be.busName ? ` (${be.busName})` : ''}` : `Bus ${idx + 1}`;

    // Extract special expenses
    const rawOthers = (be.otherExpenses ?? []).map((o) => ({
      description: o.description ?? '',
      amount: String(o.amount ?? 0),
    }));

    return {
      busId: be.busId ?? null,
      label,
      driverBatta: String(be.driverBatta ?? 0),
      startKm: be.startKm == null ? '' : String(be.startKm),
      endKm: be.endKm == null ? '' : String(be.endKm),
      fuelEntries: (be.fuelEntries ?? []).map((f) => ({
        place: f.place ?? '',
        liters: String(f.liters ?? 0),
        cost: String(f.cost ?? 0),
      })),
      otherExpenses: filterOutSpecialExpenses(rawOthers),
      tolls: findExpense(rawOthers, 'Tolls'),
      parking: findExpense(rawOthers, 'Parking'),
      permit: findExpense(rawOthers, 'Permit/RTO'),
    } as EditableBus;
  });

  if (existing.length > 0) {
    const byBusId = new Set(existing.map((x) => x.busId).filter(Boolean) as string[]);
    const appended: EditableBus[] = [];
    for (const b of assigned) {
      if (!byBusId.has(b.id)) {
        appended.push(createEmptyBus(b.id, busLabel(b)));
      }
    }
    const out = [...existing, ...appended];
    while (out.length < required) {
      out.push(createEmptyBus(null, `Bus ${out.length + 1}`));
    }
    return out;
  }

  const rows: EditableBus[] = [];
  for (const b of assigned) {
    rows.push(createEmptyBus(b.id, busLabel(b)));
  }
  while (rows.length < required) {
    rows.push(createEmptyBus(null, `Bus ${rows.length + 1}`));
  }
  return rows;
}

function createEmptyBus(busId: string | null, label: string): EditableBus {
  return {
    busId,
    label,
    driverBatta: '0',
    startKm: '',
    endKm: '',
    fuelEntries: [],
    otherExpenses: [],
    tolls: '',
    parking: '',
    permit: '',
  };
}

export function TourAccountScreen({ route, navigation }: Props) {
  const { t } = useTranslation();
  const { agreementId } = route.params;
  const { user } = useAuth(); // Added useAuth

  const [agreement, setAgreement] = React.useState<AgreementResponse | null>(null);
  const [accounts, setAccounts] = React.useState<AgreementAccountsResponse | null>(null);
  const [buses, setBuses] = React.useState<EditableBus[]>([]);
  const [collapsedBus, setCollapsedBus] = React.useState<Record<string, boolean>>({});
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  // Initial Load
  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [a, acc] = await Promise.all([
        getAgreementById(agreementId),
        getAgreementAccounts(agreementId),
      ]);
      setAgreement(a);
      setAccounts(acc);
      setBuses(buildInitialBuses(acc));
    } catch (e: any) {
      Alert.alert(t('common.errorTitle'), e?.message ? String(e.message) : String(e));
    } finally {
      setLoading(false);
    }
  }, [agreementId, t]);

  React.useEffect(() => {
    void load();
  }, [load]);

  // Headers
  React.useEffect(() => {
    navigation.setOptions({
      title: t('accounts.tourTitle'),
      headerRight: () => (
        <Pressable onPress={load} disabled={loading} style={{ marginRight: 8 }}>
          <RefreshCw size={20} color={Theme.colors.primary} />
        </Pressable>
      )
    });
  }, [navigation, t, loading, load]);

  // Calculations
  const totals = React.useMemo(() => {
    const totalExpenses = buses.reduce((sum, b) => {
      const driver = toNum(b.driverBatta);
      const fuel = (b.fuelEntries ?? []).reduce((s, f) => s + toNum(f.cost), 0);
      const other = (b.otherExpenses ?? []).reduce((s, o) => s + toNum(o.amount), 0);
      const special = toNum(b.tolls) + toNum(b.parking) + toNum(b.permit);
      return sum + driver + fuel + other + special;
    }, 0);
    const income = agreement?.totalAmount ?? accounts?.incomeTotalAmount ?? 0;
    const profitOrLoss = income - totalExpenses;
    return { income, totalExpenses, profitOrLoss };
  }, [accounts?.incomeTotalAmount, agreement?.totalAmount, buses]);

  const onSave = async () => {
    setSaving(true);
    try {
      const payload = {
        busExpenses: buses.map((b) => {
          // Merge special expenses back into otherExpenses
          const mergedOthers = [...(b.otherExpenses || [])];
          if (b.tolls.trim()) mergedOthers.push({ description: 'Tolls', amount: b.tolls });
          if (b.parking.trim()) mergedOthers.push({ description: 'Parking', amount: b.parking });
          if (b.permit.trim()) mergedOthers.push({ description: 'Permit/RTO', amount: b.permit });

          return {
            busId: b.busId,
            driverBatta: toDecOrNull(b.driverBatta),
            startKm: toIntOrNull(b.startKm),
            endKm: toIntOrNull(b.endKm),
            fuelEntries: (b.fuelEntries ?? [])
              .filter((f) => f.place.trim() || f.liters.trim() || f.cost.trim())
              .map((f) => ({
                place: f.place,
                liters: toDecOrNull(f.liters),
                cost: toDecOrNull(f.cost),
              })),
            otherExpenses: mergedOthers
              .filter((o) => o.description.trim() || o.amount.trim())
              .map((o) => ({
                description: o.description,
                amount: toDecOrNull(o.amount),
              })),
          };
        }),
      };

      const updated = await upsertAgreementAccounts(agreementId, payload);
      setAccounts(updated);
      setBuses(buildInitialBuses(updated));
      Alert.alert(t('common.successTitle'), t('accounts.saved'));
    } catch (e: any) {
      Alert.alert(t('common.errorTitle'), e?.message ? String(e.message) : String(e));
    } finally {
      setSaving(false);
    }
  };

  const onExportPdf = async () => {
    if (!agreement || !accounts) return;

    try {
      // Fallback if company details are missing
      const companyDetails = {
        companyName: user?.companyName || 'Tour Operator',
        address: user?.companyAddress || '',
        phone: user?.companyPhone || '',
        email: user?.email || '',
      };

      await generateAccountPdf(agreement, accounts, companyDetails);
    } catch (e) {
      Alert.alert(t('common.errorTitle'), 'Failed to generate PDF');
      console.error(e);
    }
  };

  const toggleCollapse = (key: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCollapsedBus(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
        <Text style={styles.small}>{t('common.loading')}</Text>
      </View>
    );
  }

  const isProfit = totals.profitOrLoss >= 0;

  return (
    <View style={styles.container}>
      {/* Sticky Summary Header */}
      <View style={styles.summaryHeader}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>{t('accounts.income')}</Text>
          <Text style={[styles.summaryValue, { color: Theme.colors.success }]}>
            ₹{totals.income.toLocaleString('en-IN')}
          </Text>
        </View>
        <View style={[styles.summaryItem, { borderLeftWidth: 1, borderLeftColor: '#e5e7eb', borderRightWidth: 1, borderRightColor: '#e5e7eb' }]}>
          <Text style={styles.summaryLabel}>{t('accounts.totalExpenses')}</Text>
          <Text style={[styles.summaryValue, { color: Theme.colors.danger }]}>
            ₹{totals.totalExpenses.toLocaleString('en-IN')}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>{t('accounts.profitOrLoss')}</Text>
          <Text style={[styles.summaryValue, isProfit ? { color: Theme.colors.success } : { color: Theme.colors.danger }]}>
            ₹{totals.profitOrLoss.toLocaleString('en-IN')}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {buses.map((b, idx) => {
          const collapseKey = b.busId ?? `idx-${idx}`;
          const isCollapsed = collapsedBus[collapseKey] ?? false;

          // Mileage Logic
          const totalLiters = (b.fuelEntries ?? []).reduce((s, f) => s + toNum(f.liters), 0);
          const startKm = b.startKm.trim() ? Number.parseInt(b.startKm, 10) : NaN;
          const endKm = b.endKm.trim() ? Number.parseInt(b.endKm, 10) : NaN;
          const hasDistance = Number.isFinite(startKm) && Number.isFinite(endKm) && endKm >= startKm;
          const distanceKm = hasDistance ? endKm - startKm : null;
          const mileage = distanceKm != null && totalLiters > 0 ? distanceKm / totalLiters : null;
          const lowMileage = mileage != null && mileage < 3.0;

          return (
            <View key={`${b.busId ?? 'none'}-${idx}`} style={styles.busCard}>
              <Pressable
                style={styles.busHeader}
                onPress={() => toggleCollapse(collapseKey)}
              >
                <Text style={styles.busTitle}>{t('accounts.bus')} {idx + 1}: {b.label}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  {mileage != null && (
                    <View style={[styles.badge, lowMileage ? styles.badgeDanger : styles.badgeSuccess]}>
                      <Text style={[styles.badgeText, lowMileage ? styles.textDanger : styles.textSuccess]}>
                        {mileage.toFixed(2)} km/L
                      </Text>
                    </View>
                  )}
                  {isCollapsed ? <ChevronDown size={20} color="#6b7280" /> : <ChevronUp size={20} color="#6b7280" />}
                </View>
              </Pressable>

              {!isCollapsed && (
                <View style={styles.busContent}>
                  {/* Odometer Section */}
                  <SectionLabel title={t('accounts.odometer')} />
                  <View style={styles.row}>
                    <LabeledInput
                      label={t('accounts.startKm')}
                      value={b.startKm}
                      onChangeText={(v) => {
                        const next = [...buses];
                        next[idx] = { ...next[idx], startKm: cleanIntInput(v) };
                        setBuses(next);
                      }}
                      keyboardType="number-pad"
                      style={{ flex: 1 }}
                    />
                    <LabeledInput
                      label={t('accounts.endKm')}
                      value={b.endKm}
                      onChangeText={(v) => {
                        const next = [...buses];
                        next[idx] = { ...next[idx], endKm: cleanIntInput(v) };
                        setBuses(next);
                      }}
                      keyboardType="number-pad"
                      style={{ flex: 1 }}
                    />
                  </View>
                  {distanceKm !== null && (
                    <Text style={styles.helperText}>Total Distance: {distanceKm} km</Text>
                  )}

                  {/* Expenses Section */}
                  <SectionLabel title="Trip Expenses" style={{ marginTop: 16 }} />
                  <LabeledInput
                    label={t('accounts.driverBatta')}
                    value={b.driverBatta}
                    onChangeText={(v) => {
                      const next = [...buses];
                      next[idx] = { ...next[idx], driverBatta: cleanDecimalInput(v) };
                      setBuses(next);
                    }}
                    keyboardType="numeric"
                  />

                  <View style={styles.row}>
                    <LabeledInput
                      label="Tolls"
                      value={b.tolls}
                      onChangeText={(v) => {
                        const next = [...buses];
                        next[idx] = { ...next[idx], tolls: cleanDecimalInput(v) };
                        setBuses(next);
                      }}
                      keyboardType="numeric"
                      style={{ flex: 1 }}
                    />
                    <LabeledInput
                      label="Parking"
                      value={b.parking}
                      onChangeText={(v) => {
                        const next = [...buses];
                        next[idx] = { ...next[idx], parking: cleanDecimalInput(v) };
                        setBuses(next);
                      }}
                      keyboardType="numeric"
                      style={{ flex: 1 }}
                    />
                  </View>
                  <LabeledInput
                    label="Permit / RTO"
                    value={b.permit}
                    onChangeText={(v) => {
                      const next = [...buses];
                      next[idx] = { ...next[idx], permit: cleanDecimalInput(v) };
                      setBuses(next);
                    }}
                    keyboardType="numeric"
                  />

                  {/* Fuel Log */}
                  <SectionLabel title={t('accounts.fuel')} style={{ marginTop: 16 }} />
                  {(b.fuelEntries ?? []).map((f, fIdx) => (
                    <View key={fIdx} style={styles.entryRow}>
                      <TextInput
                        style={[styles.input, { flex: 2 }]}
                        placeholder={t('accounts.place')}
                        value={f.place}
                        onChangeText={(v) => {
                          const next = [...buses];
                          const fuel = [...next[idx].fuelEntries];
                          fuel[fIdx] = { ...fuel[fIdx], place: v };
                          next[idx] = { ...next[idx], fuelEntries: fuel };
                          setBuses(next);
                        }}
                      />
                      <TextInput
                        style={[styles.input, { flex: 1 }]}
                        placeholder="L"
                        keyboardType="numeric"
                        value={f.liters}
                        onChangeText={(v) => {
                          const next = [...buses];
                          const fuel = [...next[idx].fuelEntries];
                          fuel[fIdx] = { ...fuel[fIdx], liters: cleanDecimalInput(v) };
                          next[idx] = { ...next[idx], fuelEntries: fuel };
                          setBuses(next);
                        }}
                      />
                      <TextInput
                        style={[styles.input, { flex: 1.5 }]}
                        placeholder="Cost"
                        keyboardType="numeric"
                        value={f.cost}
                        onChangeText={(v) => {
                          const next = [...buses];
                          const fuel = [...next[idx].fuelEntries];
                          fuel[fIdx] = { ...fuel[fIdx], cost: cleanDecimalInput(v) };
                          next[idx] = { ...next[idx], fuelEntries: fuel };
                          setBuses(next);
                        }}
                      />
                      <Pressable onPress={() => {
                        const next = [...buses];
                        const fuel = [...next[idx].fuelEntries];
                        fuel.splice(fIdx, 1);
                        next[idx] = { ...next[idx], fuelEntries: fuel };
                        setBuses(next);
                      }}>
                        <Trash2 size={20} color={Theme.colors.danger} />
                      </Pressable>
                    </View>
                  ))}
                  <Pressable
                    style={styles.addBtn}
                    onPress={() => {
                      const next = [...buses];
                      next[idx] = { ...next[idx], fuelEntries: [...(next[idx].fuelEntries ?? []), { place: '', liters: '', cost: '' }] };
                      setBuses(next);
                    }}
                  >
                    <Plus size={16} color={Theme.colors.primary} />
                    <Text style={styles.addBtnText}>{t('accounts.addFuel')}</Text>
                  </Pressable>

                  {/* Other Expenses */}
                  <SectionLabel title={t('accounts.otherExpenses')} style={{ marginTop: 16 }} />
                  {(b.otherExpenses ?? []).map((o, oIdx) => (
                    <View key={oIdx} style={styles.entryRow}>
                      <TextInput
                        style={[styles.input, { flex: 2 }]}
                        placeholder="Description"
                        value={o.description}
                        onChangeText={(v) => {
                          const next = [...buses];
                          const other = [...next[idx].otherExpenses];
                          other[oIdx] = { ...other[oIdx], description: v };
                          next[idx] = { ...next[idx], otherExpenses: other };
                          setBuses(next);
                        }}
                      />
                      <TextInput
                        style={[styles.input, { flex: 1.5 }]}
                        placeholder="Amt"
                        keyboardType="numeric"
                        value={o.amount}
                        onChangeText={(v) => {
                          const next = [...buses];
                          const other = [...next[idx].otherExpenses];
                          other[oIdx] = { ...other[oIdx], amount: cleanDecimalInput(v) };
                          next[idx] = { ...next[idx], otherExpenses: other };
                          setBuses(next);
                        }}
                      />
                      <Pressable onPress={() => {
                        const next = [...buses];
                        const other = [...next[idx].otherExpenses];
                        other.splice(oIdx, 1);
                        next[idx] = { ...next[idx], otherExpenses: other };
                        setBuses(next);
                      }}>
                        <Trash2 size={20} color={Theme.colors.danger} />
                      </Pressable>
                    </View>
                  ))}
                  <Pressable
                    style={styles.addBtn}
                    onPress={() => {
                      const next = [...buses];
                      next[idx] = { ...next[idx], otherExpenses: [...(next[idx].otherExpenses ?? []), { description: '', amount: '' }] };
                      setBuses(next);
                    }}
                  >
                    <Plus size={16} color={Theme.colors.primary} />
                    <Text style={styles.addBtnText}>{t('accounts.addOtherExpense')}</Text>
                  </Pressable>

                </View>
              )}
            </View>
          );
        })}

        <Pressable
          style={styles.secondaryBtn}
          onPress={() => {
            setBuses((prev) => [
              ...prev,
              createEmptyBus(null, `Bus ${prev.length + 1}`),
            ]);
          }}
        >
          <Plus size={18} color="#374151" />
          <Text style={styles.secondaryBtnText}>{t('action.addBus', 'Add Another Bus')}</Text>
        </Pressable>

        {/* Actions Footer */}
        <View style={styles.footerActions}>
          <Pressable style={styles.saveBtn} onPress={onSave} disabled={saving}>
            <Save size={20} color="white" />
            <Text style={styles.saveBtnText}>{saving ? t('common.saving') : t('accounts.save')}</Text>
          </Pressable>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable style={styles.actionIconBtn}>
              <Share2 size={20} color="#4F46E5" />
              <Text style={styles.actionIconText}>Share</Text>
            </Pressable>
            <Pressable style={styles.actionIconBtn} onPress={onExportPdf}>
              <FileText size={20} color="#4F46E5" />
              <Text style={styles.actionIconText}>PDF</Text>
            </Pressable>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

// Components
function SectionLabel({ title, style }: { title: string, style?: any }) {
  return <Text style={[styles.sectionLabel, style]}>{title}</Text>;
}

function LabeledInput({ label, value, onChangeText, keyboardType, style }: { label: string, value: string, onChangeText: (v: string) => void, keyboardType?: any, style?: any }) {
  return (
    <View style={[{ gap: 6 }, style]}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholder="0"
        placeholderTextColor="#9ca3af"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  small: { fontSize: 12, color: '#6b7280', marginTop: 8 },

  // Sticky Header
  summaryHeader: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: 11, color: '#6b7280', textTransform: 'uppercase', fontWeight: '600' },
  summaryValue: { fontSize: 16, fontWeight: '800', marginTop: 2 },

  scrollContent: { padding: 16, paddingBottom: 100 },

  // Bus Card
  busCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  busHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  busTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  busContent: { padding: 16, gap: 12 },

  // Inputs
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5 },
  inputLabel: { fontSize: 12, fontWeight: '500', color: '#6b7280' },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
    backgroundColor: 'white',
  },
  row: { flexDirection: 'row', gap: 12 },

  // Tables / Lists
  entryRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 8 },

  // Buttons
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 6 },
  addBtnText: { color: Theme.colors.primary, fontWeight: '600', fontSize: 13 },

  secondaryBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    borderStyle: 'dashed',
    marginBottom: 24,
  },
  secondaryBtnText: { color: '#374151', fontWeight: '600' },

  // Bottom Actions
  footerActions: {
    gap: 16,
  },
  saveBtn: {
    backgroundColor: Theme.colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    borderRadius: 12,
  },
  saveBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },

  actionIconBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  actionIconText: { fontWeight: '600', color: '#4F46E5' },

  // Badges
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  badgeSuccess: { backgroundColor: '#dcfce7' },
  badgeDanger: { backgroundColor: '#fee2e2' },
  badgeText: { fontSize: 11, fontWeight: '700' },
  textSuccess: { color: '#166534' },
  textDanger: { color: '#991b1b' },
  helperText: { fontSize: 11, color: '#6b7280', marginTop: -4 },
});
