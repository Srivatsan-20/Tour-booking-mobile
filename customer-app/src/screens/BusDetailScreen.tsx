import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Dimensions
} from 'react-native';
import { Theme } from '../theme';
import { publicApi, PublicBusDto } from '../api/public';
import { HeritageButton } from '../components/HeritageButton';
import {
    ArrowLeft,
    Bus,
    Info,
    ShieldCheck,
    Users,
    Fuel,
    Tag,
    Milestone
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export const BusDetailScreen = ({ route, navigation }: any) => {
    const { busId, fromDate, toDate } = route.params || {};
    const [bus, setBus] = useState<PublicBusDto | null>(null);
    const [loading, setLoading] = useState(true);

    const DEFAULT_BUS: PublicBusDto = {
        id: "d476be64-62fb-4ab2-9adf-f46d2382ac9a",
        name: "Royal Heritage AC Sleeper",
        vehicleNumber: "TN 33 AA 2024",
        companyName: "Sri Sai Senthil Travels",
        baseRate: 45.00,
        busType: "AC Sleeper",
        capacity: 36,
        driverCharges: 500.00,
        tollCharges: 0.00,
        fastTagCharges: 0.00,
        otherCharges: 0.00
    };

    useEffect(() => {
        const fetchBus = async () => {
            try {
                if (busId) {
                    const res = await publicApi.getBus(busId);
                    if (res.data) {
                        setBus(res.data);
                        return;
                    }
                }
                setBus(DEFAULT_BUS);
            } catch (error) {
                setBus(DEFAULT_BUS);
            } finally {
                setLoading(false);
            }
        };
        fetchBus();
    }, [busId]);

    if (loading || !bus) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color={Theme.colors.gold} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scroll}>
                {/* Header Image Area */}
                <View style={styles.hero}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <ArrowLeft color="#FFF" size={24} />
                    </TouchableOpacity>
                    <View style={styles.heroOverlay}>
                        <View style={styles.badge}>
                            <ShieldCheck size={14} color={Theme.colors.gold} />
                            <Text style={styles.badgeText}>Verified Heritage Coach</Text>
                        </View>
                        <Text style={styles.heroTitle}>{bus.name || bus.vehicleNumber}</Text>
                        <Text style={styles.heroSubtitle}>{bus.companyName}</Text>
                    </View>
                </View>

                {/* Main Content */}
                <View style={styles.content}>
                    <View style={styles.statsRow}>
                        <View style={styles.statBox}>
                            <Users size={20} color={Theme.colors.gold} />
                            <Text style={styles.statValue}>{bus.capacity}</Text>
                            <Text style={styles.statLabel}>Seats</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statBox}>
                            <Fuel size={20} color={Theme.colors.gold} />
                            <Text style={styles.statValue}>{bus.busType}</Text>
                            <Text style={styles.statLabel}>Engine</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statBox}>
                            <Milestone size={20} color={Theme.colors.gold} />
                            <Text style={styles.statValue}>Legacy</Text>
                            <Text style={styles.statLabel}>Quality</Text>
                        </View>
                    </View>

                    {/* Fare Information */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Tag size={18} color={Theme.colors.gold} />
                            <Text style={styles.sectionTitle}>Fare Structure</Text>
                        </View>

                        <View style={styles.fareCard}>
                            <View style={styles.fareRow}>
                                <Text style={styles.fareLabel}>Base Per Day Rent</Text>
                                <Text style={styles.fareValue}>₹{bus.baseRate.toLocaleString()}</Text>
                            </View>

                            <View style={styles.divider} />

                            <Text style={styles.rateHeader}>Partner Defined Operating Rates (Locked)</Text>

                            <View style={styles.rateGrid}>
                                <View style={styles.rateItem}>
                                    <Text style={styles.rateLabel}>Driver Batta</Text>
                                    <Text style={styles.rateValue}>₹{bus.driverCharges}</Text>
                                </View>
                                <View style={styles.rateItem}>
                                    <Text style={styles.rateLabel}>Toll Charges</Text>
                                    <Text style={styles.rateValue}>₹{bus.tollCharges}</Text>
                                </View>
                                <View style={styles.rateItem}>
                                    <Text style={styles.rateLabel}>FastTag</Text>
                                    <Text style={styles.rateValue}>₹{bus.fastTagCharges}</Text>
                                </View>
                                <View style={styles.rateItem}>
                                    <Text style={styles.rateLabel}>Other Charges</Text>
                                    <Text style={styles.rateValue}>₹{bus.otherCharges}</Text>
                                </View>
                            </View>

                            <View style={styles.infoBox}>
                                <Info size={16} color={Theme.colors.textMuted} />
                                <Text style={styles.infoText}>
                                    Operating rates are set by the transport partner and are added to your final bill automatically.
                                </Text>
                            </View>
                        </View>
                    </View>

                    <HeritageButton
                        title="Book This Coach"
                        onPress={() => navigation.navigate('BookingForm', { bus, fromDate, toDate })}
                        style={styles.bookBtn}
                    />
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.colors.background,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Theme.colors.background,
    },
    scroll: {
        paddingBottom: 40,
    },
    hero: {
        height: 300,
        backgroundColor: Theme.colors.card,
        justifyContent: 'flex-end',
        padding: Theme.spacing.lg,
    },
    backBtn: {
        position: 'absolute',
        top: 60,
        left: 20,
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    heroOverlay: {
        backgroundColor: 'transparent',
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.colors.goldMuted,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 100,
        alignSelf: 'flex-start',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(197, 160, 89, 0.3)',
    },
    badgeText: {
        color: Theme.colors.gold,
        fontFamily: Theme.fonts.sansBold,
        fontSize: 10,
        textTransform: 'uppercase',
        marginLeft: 6,
        letterSpacing: 1,
    },
    heroTitle: {
        fontFamily: Theme.fonts.serif,
        fontSize: 32,
        color: '#FFF',
    },
    heroSubtitle: {
        fontFamily: Theme.fonts.sansRegular,
        fontSize: 16,
        color: Theme.colors.textMuted,
        marginTop: 4,
    },
    content: {
        marginTop: -30,
        backgroundColor: Theme.colors.background,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: Theme.spacing.lg,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.colors.card,
        borderRadius: Theme.borderRadius.lg,
        padding: 24,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontFamily: Theme.fonts.serif,
        fontSize: 20,
        color: '#FFF',
        marginTop: 8,
    },
    statLabel: {
        fontFamily: Theme.fonts.sansRegular,
        fontSize: 12,
        color: Theme.colors.textMuted,
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    section: {
        marginBottom: 32,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontFamily: Theme.fonts.serif,
        fontSize: 20,
        color: '#FFF',
        marginLeft: 10,
    },
    fareCard: {
        backgroundColor: Theme.colors.card,
        borderRadius: Theme.borderRadius.lg,
        padding: 24,
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    fareRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    fareLabel: {
        fontFamily: Theme.fonts.sansBold,
        color: '#FFF',
        fontSize: 14,
    },
    fareValue: {
        fontFamily: Theme.fonts.serif,
        color: Theme.colors.gold,
        fontSize: 24,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        marginVertical: 20,
    },
    rateHeader: {
        fontFamily: Theme.fonts.sansBold,
        color: Theme.colors.textMuted,
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 16,
    },
    rateGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -8,
    },
    rateItem: {
        width: '50%',
        paddingHorizontal: 8,
        marginBottom: 16,
    },
    rateLabel: {
        fontFamily: Theme.fonts.sansRegular,
        color: Theme.colors.textMuted,
        fontSize: 12,
    },
    rateValue: {
        fontFamily: Theme.fonts.sansBold,
        color: '#FFF',
        fontSize: 16,
        marginTop: 4,
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: 16,
        borderRadius: Theme.borderRadius.md,
        alignItems: 'center',
        gap: 12,
        marginTop: 8,
    },
    infoText: {
        flex: 1,
        fontFamily: Theme.fonts.sansRegular,
        fontSize: 12,
        color: Theme.colors.textMuted,
        lineHeight: 18,
    },
    bookBtn: {
        marginTop: 8,
    },
});
