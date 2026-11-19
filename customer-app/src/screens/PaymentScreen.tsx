import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Linking,
    ActivityIndicator
} from 'react-native';
import { Theme } from '../theme';
import { HeritageButton } from '../components/HeritageButton';
import { publicApi } from '../api/public';
import {
    ArrowLeft,
    ShieldCheck,
    CreditCard,
    Smartphone,
    CheckCircle2,
    Loader2
} from 'lucide-react-native';

export const PaymentScreen = ({ route, navigation }: any) => {
    const { bookingData } = route.params;
    const [selectedMethod, setSelectedMethod] = useState<'online' | 'upi'>('online');
    const [loading, setLoading] = useState(false);

    const handlePayment = async () => {
        setLoading(true);
        try {
            if (selectedMethod === 'online') {
                // Demo Mode: Simulate Razorpay Redirection & Success
                console.log("Simulating Razorpay Payment...");
                setTimeout(async () => {
                    const paymentId = 'pay_DEMO_' + Math.random().toString(36).substr(2, 9);
                    await finalizeBooking(paymentId);
                }, 2000);
            } else {
                // UPI Flow
                if (bookingData.upiLink) {
                    const upiUrl = `upi://pay?pa=${bookingData.upiLink}&pn=Sri%20Sai%20Senthil&am=${bookingData.totalAmount}&cu=INR`;
                    const supported = await Linking.canOpenURL(upiUrl);
                    if (supported) {
                        await Linking.openURL(upiUrl);
                        // In real app, we'd wait for user to return. Here we proceed to confirmation.
                        Alert.alert("UPI Payment", "Please complete payment in your UPI app and click OK.", [
                            { text: "OK", onPress: () => finalizeBooking() }
                        ]);
                    } else {
                        Alert.alert("Error", "No UPI app found on this device. Please use Online Payment.");
                    }
                } else {
                    // Manual UPI confirmation simulation
                    finalizeBooking();
                }
            }
        } catch (error) {
            Alert.alert("Booking Failed", "Something went wrong. Please try again.");
            setLoading(false);
        }
    };

    const finalizeBooking = async (paymentId?: string) => {
        try {
            const res = await publicApi.book({
                ...bookingData,
                paymentId: paymentId || 'UPI_MANUAL'
            });

            navigation.replace('PaymentStatus', {
                status: 'success',
                agreementId: res.data.agreementId,
                bookingData
            });
        } catch (error) {
            Alert.alert("Error", "Payment succeeded but booking failed to register. Please contact support.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <ArrowLeft color={Theme.colors.gold} size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>SECURE PAYMENT</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.amountCard}>
                    <Text style={styles.amountLabel}>Total Payable Amount</Text>
                    <Text style={styles.amountValue}>₹{bookingData.totalAmount.toLocaleString()}</Text>
                    <View style={styles.secureBadge}>
                        <ShieldCheck size={14} color={Theme.colors.success} />
                        <Text style={styles.secureText}>256-BIT SSL SECURED</Text>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Select Payment Method</Text>

                <TouchableOpacity
                    style={[styles.methodCard, selectedMethod === 'online' && styles.selectedCard]}
                    onPress={() => setSelectedMethod('online')}
                >
                    <View style={styles.methodIcon}>
                        <CreditCard size={24} color={selectedMethod === 'online' ? Theme.colors.gold : Theme.colors.textMuted} />
                    </View>
                    <View style={styles.methodInfo}>
                        <Text style={styles.methodTitle}>Online Payment</Text>
                        <Text style={styles.methodDesc}>Razorpay / Credit / Debit / NetBanking</Text>
                    </View>
                    <View style={[styles.radio, selectedMethod === 'online' && styles.radioActive]}>
                        {selectedMethod === 'online' && <View style={styles.radioInner} />}
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.methodCard, selectedMethod === 'upi' && styles.selectedCard]}
                    onPress={() => setSelectedMethod('upi')}
                >
                    <View style={styles.methodIcon}>
                        <Smartphone size={24} color={selectedMethod === 'upi' ? Theme.colors.gold : Theme.colors.textMuted} />
                    </View>
                    <View style={styles.methodInfo}>
                        <Text style={styles.methodTitle}>UPI Transfer</Text>
                        <Text style={styles.methodDesc}>GPay, PhonePe, Paytm, or Any UPI App</Text>
                    </View>
                    <View style={[styles.radio, selectedMethod === 'upi' && styles.radioActive]}>
                        {selectedMethod === 'upi' && <View style={styles.radioInner} />}
                    </View>
                </TouchableOpacity>

                <View style={styles.footerSpacing} />
            </ScrollView>

            <View style={styles.footer}>
                <HeritageButton
                    title={loading ? "Processing..." : `Pay ₹${bookingData.totalAmount.toLocaleString()}`}
                    onPress={handlePayment}
                    loading={loading}
                />
                <Text style={styles.disclaimer}>
                    By paying, you agree to our Terms & Conditions and Booking Agreement.
                </Text>
            </View>
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
        fontFamily: Theme.fonts.sansBold,
        fontSize: 14,
        color: '#FFF',
        marginLeft: 20,
        letterSpacing: 2,
    },
    scroll: {
        padding: Theme.spacing.lg,
    },
    amountCard: {
        backgroundColor: Theme.colors.card,
        borderRadius: Theme.borderRadius.xl,
        padding: 32,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Theme.colors.border,
        marginBottom: 40,
    },
    amountLabel: {
        fontFamily: Theme.fonts.sansMedium,
        fontSize: 12,
        color: Theme.colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
    },
    amountValue: {
        fontFamily: Theme.fonts.serif,
        fontSize: 40,
        color: Theme.colors.gold,
        marginBottom: 16,
    },
    secureBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    secureText: {
        fontFamily: Theme.fonts.sansBold,
        fontSize: 10,
        color: Theme.colors.success,
        letterSpacing: 1,
    },
    sectionTitle: {
        fontFamily: Theme.fonts.serif,
        fontSize: 20,
        color: '#FFF',
        marginBottom: 20,
    },
    methodCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.colors.card,
        padding: 20,
        borderRadius: Theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        marginBottom: 16,
    },
    selectedCard: {
        borderColor: Theme.colors.gold,
        backgroundColor: 'rgba(197, 160, 89, 0.05)',
    },
    methodIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.03)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    methodInfo: {
        flex: 1,
        marginLeft: 16,
    },
    methodTitle: {
        fontFamily: Theme.fonts.sansBold,
        fontSize: 16,
        color: '#FFF',
    },
    methodDesc: {
        fontFamily: Theme.fonts.sansRegular,
        fontSize: 12,
        color: Theme.colors.textMuted,
        marginTop: 2,
    },
    radio: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: Theme.colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioActive: {
        borderColor: Theme.colors.gold,
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: Theme.colors.gold,
    },
    footerSpacing: {
        height: 40,
    },
    footer: {
        padding: Theme.spacing.lg,
        paddingBottom: 40,
        backgroundColor: Theme.colors.background,
        borderTopWidth: 1,
        borderTopColor: Theme.colors.border,
    },
    disclaimer: {
        textAlign: 'center',
        fontFamily: Theme.fonts.sansRegular,
        fontSize: 10,
        color: Theme.colors.textMuted,
        marginTop: 16,
        lineHeight: 16,
    }
});
