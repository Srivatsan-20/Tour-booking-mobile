import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity
} from 'react-native';
import { Theme } from '../theme';
import { HeritageButton } from '../components/HeritageButton';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import {
    ArrowLeft,
    User,
    Navigation,
    Users,
    CreditCard,
    Info
} from 'lucide-react-native';

export const BookingFormScreen = ({ route, navigation }: any) => {
    const { bus } = route.params;
    const { customer } = useCustomerAuth();

    // Form State
    const [name, setName] = useState(customer?.name || '');
    const [phone, setPhone] = useState(customer?.phone || '');
    const [passengers, setPassengers] = useState('');
    const [places, setPlaces] = useState('');
    const [loading, setLoading] = useState(false);

    // Hardcoded dates for demo context (matching SearchScreen defaults)
    const fromDate = '2026-05-01';
    const toDate = '2026-05-03';

    // Calculate Pricing
    const calculation = useMemo(() => {
        const start = new Date(fromDate);
        const end = new Date(toDate);
        const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

        const baseTotal = days * bus.baseRate;
        const total = baseTotal; // Simplified for initial checkout, actual backends adds partner charges

        return { days, baseTotal, total };
    }, [bus, fromDate, toDate]);

    const handleProceed = () => {
        if (!name || !phone || !passengers || !places) {
            Alert.alert("Missing Information", "Please fill in all details to proceed.");
            return;
        }

        const bookingData = {
            customerName: name,
            phone,
            fromDate,
            toDate,
            busId: bus.id,
            passengers: parseInt(passengers),
            placesToCover: places,
            totalAmount: calculation.total,
            busName: bus.name || bus.vehicleNumber,
            upiLink: bus.upiLink
        };

        navigation.navigate('Payment', { bookingData });
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <ArrowLeft color={Theme.colors.gold} size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Reserve Coach</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scroll}>
                {/* Summary Card */}
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>{bus.name || bus.vehicleNumber}</Text>
                    <Text style={styles.summaryDate}>{fromDate} to {toDate} ({calculation.days} Days)</Text>

                    <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Estimated Total</Text>
                        <Text style={styles.priceValue}>₹{calculation.total.toLocaleString()}</Text>
                    </View>
                </View>

                {/* Form */}
                <View style={styles.formContainer}>
                    <View style={styles.inputSection}>
                        <Text style={styles.inputLabel}>Primary Traveler</Text>
                        <View style={styles.inputWrapper}>
                            <User size={18} color={Theme.colors.gold} />
                            <TextInput
                                style={styles.input}
                                placeholder="Full Name"
                                placeholderTextColor={Theme.colors.textMuted}
                                value={name}
                                onChangeText={setName}
                            />
                        </View>
                        <View style={styles.inputWrapper}>
                            <CreditCard size={18} color={Theme.colors.gold} />
                            <TextInput
                                style={styles.input}
                                placeholder="Phone Number"
                                placeholderTextColor={Theme.colors.textMuted}
                                keyboardType="phone-pad"
                                value={phone}
                                onChangeText={setPhone}
                            />
                        </View>
                    </View>

                    <View style={styles.inputSection}>
                        <Text style={styles.inputLabel}>Trip Details</Text>
                        <View style={styles.inputWrapper}>
                            <Users size={18} color={Theme.colors.gold} />
                            <TextInput
                                style={styles.input}
                                placeholder="Number of Passengers"
                                placeholderTextColor={Theme.colors.textMuted}
                                keyboardType="numeric"
                                value={passengers}
                                onChangeText={setPassengers}
                            />
                        </View>
                        <View style={[styles.inputWrapper, { alignItems: 'flex-start', paddingTop: 16, height: 120 }]}>
                            <Navigation size={18} color={Theme.colors.gold} style={{ marginTop: 2 }} />
                            <TextInput
                                style={[styles.input, { height: 80 }]}
                                placeholder="Places to Cover (e.g. Madurai, Rameshwaram, Kanyakumari)"
                                placeholderTextColor={Theme.colors.textMuted}
                                multiline
                                textAlignVertical="top"
                                value={places}
                                onChangeText={setPlaces}
                            />
                        </View>
                    </View>

                    <View style={styles.infoBox}>
                        <Info size={16} color={Theme.colors.textMuted} />
                        <Text style={styles.infoText}>
                            The total amount shown is the base rent. Actual operating charges (Tolls, Driver Batta) will be added at checkout.
                        </Text>
                    </View>

                    <HeritageButton
                        title="Proceed to Payment"
                        onPress={handleProceed}
                        style={styles.proceedBtn}
                    />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
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
    scroll: {
        padding: Theme.spacing.lg,
    },
    summaryCard: {
        backgroundColor: Theme.colors.goldMuted,
        borderRadius: Theme.borderRadius.lg,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(197, 160, 89, 0.2)',
        marginBottom: 32,
    },
    summaryTitle: {
        fontFamily: Theme.fonts.serif,
        fontSize: 18,
        color: '#FFF',
    },
    summaryDate: {
        fontFamily: Theme.fonts.sansRegular,
        fontSize: 12,
        color: Theme.colors.gold,
        marginTop: 4,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 20,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.05)',
    },
    priceLabel: {
        fontFamily: Theme.fonts.sansMedium,
        fontSize: 14,
        color: Theme.colors.textMuted,
    },
    priceValue: {
        fontFamily: Theme.fonts.serif,
        fontSize: 24,
        color: Theme.colors.gold,
    },
    formContainer: {
        gap: 24,
    },
    inputSection: {
        gap: 12,
    },
    inputLabel: {
        fontFamily: Theme.fonts.sansBold,
        fontSize: 12,
        color: Theme.colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.colors.card,
        borderRadius: Theme.borderRadius.md,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        paddingHorizontal: 16,
        height: 56,
    },
    input: {
        flex: 1,
        marginLeft: 12,
        color: '#FFF',
        fontFamily: Theme.fonts.sansMedium,
        fontSize: 15,
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
    proceedBtn: {
        marginTop: 16,
    }
});
