import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions
} from 'react-native';
import { Theme } from '../theme';
import { HeritageButton } from '../components/HeritageButton';
import { CheckCircle2, ChevronRight, Download } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export const PaymentStatusScreen = ({ route, navigation }: any) => {
    const { status, agreementId, bookingData } = route.params;

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <View style={styles.successIcon}>
                    <CheckCircle2 size={80} color={Theme.colors.success} strokeWidth={1.5} />
                </View>

                <Text style={styles.title}>Booking Confirmed</Text>
                <Text style={styles.msg}>
                    Your heritage journey with Sri Sai Senthil Travels has been successfully reserved.
                </Text>

                <View style={styles.summaryCard}>
                    <View style={styles.summaryRow}>
                        <Text style={styles.label}>Reservation ID</Text>
                        <Text style={styles.value}>#{agreementId.substring(0, 8).toUpperCase()}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.label}>Vehicle</Text>
                        <Text style={styles.value}>{bookingData.busName}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.label}>Dates</Text>
                        <Text style={styles.value}>{bookingData.fromDate} to {bookingData.toDate}</Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.actionCard}
                    onPress={() => navigation.navigate('HistoryDetail', { id: agreementId })}
                >
                    <View style={styles.actionIcon}>
                        <Download size={20} color={Theme.colors.gold} />
                    </View>
                    <Text style={styles.actionText}>Download Booking Agreement</Text>
                    <ChevronRight size={20} color={Theme.colors.gold} />
                </TouchableOpacity>
            </View>

            <View style={styles.footer}>
                <HeritageButton
                    title="Go to My Bookings"
                    onPress={() => navigation.navigate('History')}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.colors.background,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: Theme.spacing.lg,
    },
    successIcon: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
    },
    title: {
        fontFamily: Theme.fonts.serif,
        fontSize: 32,
        color: '#FFF',
        textAlign: 'center',
    },
    msg: {
        fontFamily: Theme.fonts.sansRegular,
        fontSize: 14,
        color: Theme.colors.textMuted,
        textAlign: 'center',
        marginTop: 12,
        lineHeight: 22,
        paddingHorizontal: 20,
    },
    summaryCard: {
        width: '100%',
        backgroundColor: Theme.colors.card,
        borderRadius: Theme.borderRadius.lg,
        padding: 24,
        marginTop: 40,
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    label: {
        fontFamily: Theme.fonts.sansRegular,
        color: Theme.colors.textMuted,
        fontSize: 12,
    },
    value: {
        fontFamily: Theme.fonts.sansBold,
        color: '#FFF',
        fontSize: 14,
    },
    actionCard: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.colors.goldMuted,
        padding: 20,
        borderRadius: Theme.borderRadius.lg,
        marginTop: 20,
        borderWidth: 1,
        borderColor: 'rgba(197, 160, 89, 0.2)',
    },
    actionIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: 'rgba(197, 160, 89, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    actionText: {
        flex: 1,
        fontFamily: Theme.fonts.sansBold,
        color: Theme.colors.gold,
        fontSize: 14,
    },
    footer: {
        padding: Theme.spacing.lg,
        paddingBottom: 40,
    }
});
