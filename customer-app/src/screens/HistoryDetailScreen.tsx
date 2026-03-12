import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Share
} from 'react-native';
import { Theme } from '../theme';
import { customerApi, CustomerBookingDto } from '../api/customer';
import { generateAndSharePdf, createAgreementHtml } from '../utils/pdfGenerator';
import { HeritageButton } from '../components/HeritageButton';
import {
    ArrowLeft,
    Download,
    Calendar,
    MapPin,
    Bus,
    CreditCard,
    Info,
    CheckCircle2,
    XCircle,
    Copy
} from 'lucide-react-native';

export const HistoryDetailScreen = ({ route, navigation }: any) => {
    const { id } = route.params;
    const [booking, setBooking] = useState<CustomerBookingDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const res = await customerApi.getBookingDetail(id);
                setBooking(res.data);
            } catch (error) {
                Alert.alert("Error", "Could not load booking details.");
                navigation.goBack();
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [id]);

    const handleDownload = async (type: 'agreement' | 'receipt') => {
        if (!booking) return;
        setGenerating(true);
        try {
            // Get full data for PDF
            const dataRes = await customerApi.getAgreementData(id);
            const html = createAgreementHtml(dataRes.data, type);
            const filename = type === 'agreement' ? `Agreement_${id.substring(0, 8)}.pdf` : `Receipt_${id.substring(0, 8)}.pdf`;
            await generateAndSharePdf(html, filename);
        } catch (error) {
            Alert.alert("PDF Error", "Could not generate document. Please try again.");
        } finally {
            setGenerating(false);
        }
    };

    if (loading || !booking) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color={Theme.colors.gold} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <ArrowLeft color={Theme.colors.gold} size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Booking Detail</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scroll}>
                {/* Status Hero */}
                <View style={styles.hero}>
                    <View style={[styles.statusBig, booking.isCancelled ? styles.statusCancel : styles.statusActive]}>
                        {booking.isCancelled ? (
                            <XCircle size={32} color={Theme.colors.error} />
                        ) : (
                            <CheckCircle2 size={32} color={Theme.colors.success} />
                        )}
                        <Text style={[styles.statusText, { color: booking.isCancelled ? Theme.colors.error : Theme.colors.success }]}>
                            {booking.isCancelled ? 'Booking Cancelled' : 'Confirmed Reservation'}
                        </Text>
                    </View>
                    <Text style={styles.tripId}>#{booking.id.toUpperCase()}</Text>
                </View>

                {/* Journey Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Journey Summary</Text>
                    <View style={styles.card}>
                        <View style={styles.infoRow}>
                            <Bus size={18} color={Theme.colors.gold} />
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Vehicle Assigned</Text>
                                <Text style={styles.infoValue}>{booking.busName || booking.busType}</Text>
                                <Text style={styles.infoSub}>{booking.companyName}</Text>
                            </View>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.infoRow}>
                            <Calendar size={18} color={Theme.colors.gold} />
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Travel Interval</Text>
                                <Text style={styles.infoValue}>{booking.fromDate} — {booking.toDate}</Text>
                            </View>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.infoRow}>
                            <MapPin size={18} color={Theme.colors.gold} />
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Destinations</Text>
                                <Text style={styles.infoValue}>{booking.placesToCover}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Payments Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Financial Statement</Text>
                    <View style={styles.card}>
                        <View style={styles.paymentRow}>
                            <Text style={styles.payLabel}>Total Agreement Value</Text>
                            <Text style={styles.payValue}>₹{booking.totalAmount.toLocaleString()}</Text>
                        </View>
                        <View style={styles.paymentRow}>
                            <Text style={styles.payLabel}>Advance Payment Received</Text>
                            <Text style={[styles.payValue, { color: Theme.colors.success }]}>- ₹{booking.advancePaid.toLocaleString()}</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.paymentRow}>
                            <Text style={styles.totalLabel}>Balance Outstanding</Text>
                            <Text style={styles.totalValue}>₹{booking.balance.toLocaleString()}</Text>
                        </View>
                    </View>
                </View>

                {/* Actions */}
                <View style={styles.actionSection}>
                    <Text style={styles.sectionTitle}>Documents</Text>

                    <TouchableOpacity
                        style={styles.docBtn}
                        onPress={() => handleDownload('agreement')}
                        disabled={generating}
                    >
                        <Download size={20} color={Theme.colors.gold} />
                        <View style={styles.docInfo}>
                            <Text style={styles.docTitle}>Booking Agreement</Text>
                            <Text style={styles.docSub}>Official contract with terms & conditions</Text>
                        </View>
                        {generating && <ActivityIndicator size="small" color={Theme.colors.gold} />}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.docBtn, { marginTop: 12 }]}
                        onPress={() => handleDownload('receipt')}
                        disabled={generating}
                    >
                        <Download size={20} color={Theme.colors.success} />
                        <View style={styles.docInfo}>
                            <Text style={[styles.docTitle, { color: Theme.colors.success }]}>Payment Receipt</Text>
                            <Text style={styles.docSub}>Proof of advance payment transaction</Text>
                        </View>
                        {generating && <ActivityIndicator size="small" color={Theme.colors.gold} />}
                    </TouchableOpacity>
                </View>

                <View style={styles.infoBox}>
                    <Info size={16} color={Theme.colors.textMuted} />
                    <Text style={styles.infoText}>
                        Please present the digital agreement to the driver upon vehicle arrival.
                    </Text>
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
        marginLeft: 20,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Theme.colors.background,
    },
    scroll: {
        padding: Theme.spacing.lg,
        paddingBottom: 40,
    },
    hero: {
        alignItems: 'center',
        marginBottom: 32,
    },
    statusBig: {
        width: '100%',
        padding: 24,
        borderRadius: Theme.borderRadius.lg,
        alignItems: 'center',
        gap: 12,
        borderWidth: 1,
    },
    statusActive: {
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
        borderColor: 'rgba(16, 185, 129, 0.2)',
    },
    statusCancel: {
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    statusText: {
        fontFamily: Theme.fonts.serif,
        fontSize: 22,
    },
    tripId: {
        fontFamily: Theme.fonts.sansBold,
        fontSize: 10,
        color: Theme.colors.textMuted,
        letterSpacing: 2,
        marginTop: 12,
        textTransform: 'uppercase',
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontFamily: Theme.fonts.sansBold,
        fontSize: 12,
        color: Theme.colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: 16,
    },
    card: {
        backgroundColor: Theme.colors.card,
        borderRadius: Theme.borderRadius.lg,
        padding: 24,
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 16,
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontFamily: Theme.fonts.sansRegular,
        fontSize: 10,
        color: Theme.colors.textMuted,
        textTransform: 'uppercase',
    },
    infoValue: {
        fontFamily: Theme.fonts.sansBold,
        fontSize: 15,
        color: '#FFF',
        marginTop: 4,
    },
    infoSub: {
        fontFamily: Theme.fonts.sansRegular,
        fontSize: 12,
        color: Theme.colors.gold,
        marginTop: 2,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        marginVertical: 16,
    },
    paymentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    payLabel: {
        fontFamily: Theme.fonts.sansRegular,
        fontSize: 13,
        color: Theme.colors.textMuted,
    },
    payValue: {
        fontFamily: Theme.fonts.sansBold,
        fontSize: 14,
        color: '#FFF',
    },
    totalLabel: {
        fontFamily: Theme.fonts.sansBold,
        fontSize: 14,
        color: '#FFF',
    },
    totalValue: {
        fontFamily: Theme.fonts.serif,
        fontSize: 22,
        color: Theme.colors.gold,
    },
    actionSection: {
        marginBottom: 32,
    },
    docBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        backgroundColor: Theme.colors.card,
        borderRadius: Theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    docInfo: {
        flex: 1,
        marginLeft: 16,
    },
    docTitle: {
        fontFamily: Theme.fonts.sansBold,
        fontSize: 15,
        color: Theme.colors.gold,
    },
    docSub: {
        fontFamily: Theme.fonts.sansRegular,
        fontSize: 11,
        color: Theme.colors.textMuted,
        marginTop: 2,
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: 16,
        borderRadius: Theme.borderRadius.md,
        alignItems: 'center',
        gap: 12,
    },
    infoText: {
        flex: 1,
        fontFamily: Theme.fonts.sansRegular,
        fontSize: 11,
        color: Theme.colors.textMuted,
        lineHeight: 16,
    },
});
