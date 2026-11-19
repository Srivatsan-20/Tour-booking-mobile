import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import { Theme } from '../theme';
import { HeritageButton } from '../components/HeritageButton';
import { customerApi, CustomerBookingDto } from '../api/customer';
import {
    Calendar,
    ChevronRight,
    Bus,
    ArrowLeft,
    Clock,
    CheckCircle2,
    XCircle
} from 'lucide-react-native';

export const HistoryScreen = ({ navigation }: any) => {
    const [bookings, setBookings] = useState<CustomerBookingDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchBookings = async () => {
        try {
            const res = await customerApi.getMyBookings();
            setBookings(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchBookings();
    };

    const StatusBadge = ({ booking }: { booking: CustomerBookingDto }) => {
        if (booking.isCancelled) {
            return (
                <View style={[styles.badge, styles.cancelBadge]}>
                    <XCircle size={12} color={Theme.colors.error} />
                    <Text style={[styles.badgeText, { color: Theme.colors.error }]}>Cancelled</Text>
                </View>
            );
        }
        if (booking.isCompleted) {
            return (
                <View style={[styles.badge, styles.completeBadge]}>
                    <CheckCircle2 size={12} color={Theme.colors.success} />
                    <Text style={[styles.badgeText, { color: Theme.colors.success }]}>Completed</Text>
                </View>
            );
        }
        return (
            <View style={[styles.badge, styles.activeBadge]}>
                <Clock size={12} color={Theme.colors.gold} />
                <Text style={[styles.badgeText, { color: Theme.colors.gold }]}>Confirmed</Text>
            </View>
        );
    };

    const renderItem = ({ item }: { item: CustomerBookingDto }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('HistoryDetail', { id: item.id })}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.bookingId}>TRIP #{item.id.substring(0, 8).toUpperCase()}</Text>
                <StatusBadge booking={item} />
            </View>

            <View style={styles.cardBody}>
                <View style={styles.mainInfo}>
                    <View style={styles.iconContainer}>
                        <Bus color={Theme.colors.gold} size={20} />
                    </View>
                    <View>
                        <Text style={styles.busName}>{item.busName || item.busType}</Text>
                        <Text style={styles.places} numberOfLines={1}>{item.placesToCover}</Text>
                    </View>
                </View>

                <View style={styles.dateRow}>
                    <View style={styles.dateInfo}>
                        <Calendar size={14} color={Theme.colors.textMuted} />
                        <Text style={styles.dateText}>{item.fromDate}</Text>
                    </View>
                    <View style={styles.dot} />
                    <View style={styles.dateInfo}>
                        <Calendar size={14} color={Theme.colors.textMuted} />
                        <Text style={styles.dateText}>{item.toDate}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.cardFooter}>
                <View>
                    <Text style={styles.amountLabel}>Total Value</Text>
                    <Text style={styles.amountValue}>₹{item.totalAmount.toLocaleString()}</Text>
                </View>
                <ChevronRight size={20} color={Theme.colors.border} />
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => {
                        if (navigation.canGoBack()) {
                            navigation.goBack();
                        } else {
                            navigation.navigate('Search');
                        }
                    }}
                >
                    <ArrowLeft color={Theme.colors.gold} size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Trip History</Text>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={Theme.colors.gold} style={styles.loader} />
            ) : (
                <FlatList
                    data={bookings}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.colors.gold} />
                    }
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Bus size={48} color={Theme.colors.border} />
                            <Text style={styles.emptyText}>No bookings yet.</Text>
                            <HeritageButton
                                title="Book Now"
                                onPress={() => navigation.navigate('Search')}
                                style={{ marginTop: 24, width: 200 }}
                            />
                        </View>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: Theme.spacing.lg,
        paddingBottom: 20,
        backgroundColor: Theme.colors.background,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: Theme.colors.card,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontFamily: Theme.fonts.serif,
        fontSize: 20,
        color: '#FFF',
        marginLeft: 16,
    },
    list: {
        padding: Theme.spacing.lg,
        paddingBottom: 40,
    },
    loader: {
        marginTop: 40,
    },
    card: {
        backgroundColor: Theme.colors.card,
        borderRadius: Theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        marginBottom: 16,
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: 'rgba(255,255,255,0.02)',
    },
    bookingId: {
        fontFamily: Theme.fonts.sansBold,
        fontSize: 10,
        color: Theme.colors.textMuted,
        letterSpacing: 1,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 100,
    },
    activeBadge: { backgroundColor: 'rgba(197, 160, 89, 0.1)' },
    completeBadge: { backgroundColor: 'rgba(16, 185, 129, 0.1)' },
    cancelBadge: { backgroundColor: 'rgba(239, 68, 68, 0.1)' },
    badgeText: {
        fontFamily: Theme.fonts.sansBold,
        fontSize: 10,
        textTransform: 'uppercase',
    },
    cardBody: {
        padding: 20,
    },
    mainInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: Theme.colors.goldMuted,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    busName: {
        fontFamily: Theme.fonts.serif,
        fontSize: 16,
        color: '#FFF',
    },
    places: {
        fontFamily: Theme.fonts.sansRegular,
        fontSize: 12,
        color: Theme.colors.textMuted,
        marginTop: 2,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    dateInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    dateText: {
        fontFamily: Theme.fonts.sansMedium,
        fontSize: 12,
        color: Theme.colors.textMuted,
    },
    dot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: Theme.colors.border,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.05)',
    },
    amountLabel: {
        fontFamily: Theme.fonts.sansRegular,
        fontSize: 10,
        color: Theme.colors.textMuted,
        textTransform: 'uppercase',
    },
    amountValue: {
        fontFamily: Theme.fonts.serif,
        fontSize: 18,
        color: Theme.colors.gold,
        marginTop: 2,
    },
    empty: {
        alignItems: 'center',
        marginTop: 80,
    },
    emptyText: {
        fontFamily: Theme.fonts.sansRegular,
        color: Theme.colors.textMuted,
        marginTop: 16,
    }
});
