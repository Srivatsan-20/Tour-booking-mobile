import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '../components/ScreenContainer';
import { KeyboardAvoidingScrollView } from '../components/KeyboardAvoidingScrollView';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

export function ProfileScreen() {
    const { t } = useTranslation();
    const { user, updateProfile } = useAuth();
    const navigation = useNavigation();

    const [companyName, setCompanyName] = useState('');
    const [companyAddress, setCompanyAddress] = useState('');
    const [companyPhone, setCompanyPhone] = useState('');
    const [email, setEmail] = useState('');
    const [upiLink, setUpiLink] = useState('');
    const [driverCharges, setDriverCharges] = useState('');
    const [tollCharges, setTollCharges] = useState('');
    const [fastTagCharges, setFastTagCharges] = useState('');
    const [otherCharges, setOtherCharges] = useState('');
    const [adminPayLink, setAdminPayLink] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (user) {
            setCompanyName(user.companyName || '');
            setCompanyAddress(user.companyAddress || '');
            setCompanyPhone(user.companyPhone || '');
            setEmail(user.email || '');
            setUpiLink(user.upiLink || '');
            setDriverCharges(user.driverCharges?.toString() || '');
            setTollCharges(user.tollCharges?.toString() || '');
            setFastTagCharges(user.fastTagCharges?.toString() || '');
            setOtherCharges(user.otherCharges?.toString() || '');
            if (user.role === 'SuperAdmin') {
                setAdminPayLink(user.adminPayLink || '');
            }
        }
    }, [user]);

    const handleSubmit = async () => {
        if (!companyName || !companyAddress || !companyPhone) {
            Alert.alert(t('common.validationTitle'), 'Please fill in all company details');
            return;
        }

        try {
            setIsSubmitting(true);
            await updateProfile({
                companyName,
                companyAddress,
                companyPhone,
                email,
                upiLink,
                driverCharges: driverCharges ? parseFloat(driverCharges) : 0,
                tollCharges: tollCharges ? parseFloat(tollCharges) : 0,
                fastTagCharges: fastTagCharges ? parseFloat(fastTagCharges) : 0,
                otherCharges: otherCharges ? parseFloat(otherCharges) : 0,
                ...(user?.role === 'SuperAdmin' ? { adminPayLink } : {})
            });
            Alert.alert(t('common.successTitle'), 'Profile updated successfully', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (e: any) {
            console.error('Profile update error:', e);
            Alert.alert(t('common.errorTitle'), 'Failed to update profile');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ScreenContainer>
            <KeyboardAvoidingScrollView>
                <View style={styles.content}>
                    <Text style={styles.title}>Company Profile</Text>

                    <View style={styles.form}>
                        <View style={styles.field}>
                            <Text style={styles.label}>{t('auth.companyName', 'Company Name')}</Text>
                            <TextInput
                                style={styles.input}
                                value={companyName}
                                onChangeText={setCompanyName}
                                placeholder="e.g. Sri Sai Travels"
                            />
                        </View>

                        <View style={styles.field}>
                            <Text style={styles.label}>{t('auth.companyAddress', 'Company Address')}</Text>
                            <TextInput
                                style={styles.input}
                                value={companyAddress}
                                onChangeText={setCompanyAddress}
                                multiline
                                placeholder="Full address"
                            />
                        </View>

                        <View style={styles.field}>
                            <Text style={styles.label}>{t('auth.companyPhone', 'Company Phone/Cell')}</Text>
                            <TextInput
                                style={styles.input}
                                value={companyPhone}
                                onChangeText={setCompanyPhone}
                                keyboardType="phone-pad"
                                placeholder="e.g. 94438 49013"
                            />
                        </View>

                        <View style={styles.field}>
                            <Text style={styles.label}>{t('auth.email', 'Email (for PDF)')}</Text>
                            <TextInput
                                style={styles.input}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                placeholder="e.g. tours@example.com"
                            />
                        </View>

                        <View style={styles.field}>
                            <Text style={styles.label}>UPI ID (for Customer Payment)</Text>
                            <TextInput
                                style={styles.input}
                                value={upiLink}
                                onChangeText={setUpiLink}
                                autoCapitalize="none"
                                placeholder="e.g. yourname@upi"
                            />
                        </View>

                        <Text style={styles.sectionTitle}>Standard Operating Rates</Text>

                        <View style={styles.row}>
                            <View style={[styles.field, { flex: 1 }]}>
                                <Text style={styles.label}>Driver Charges</Text>
                                <TextInput
                                    style={styles.input}
                                    value={driverCharges}
                                    onChangeText={setDriverCharges}
                                    keyboardType="numeric"
                                    placeholder="500"
                                />
                            </View>
                            <View style={{ width: 16 }} />
                            <View style={[styles.field, { flex: 1 }]}>
                                <Text style={styles.label}>Toll Charges</Text>
                                <TextInput
                                    style={styles.input}
                                    value={tollCharges}
                                    onChangeText={setTollCharges}
                                    keyboardType="numeric"
                                    placeholder="0"
                                />
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.field, { flex: 1 }]}>
                                <Text style={styles.label}>FastTag Charges</Text>
                                <TextInput
                                    style={styles.input}
                                    value={fastTagCharges}
                                    onChangeText={setFastTagCharges}
                                    keyboardType="numeric"
                                    placeholder="0"
                                />
                            </View>
                            <View style={{ width: 16 }} />
                            <View style={[styles.field, { flex: 1 }]}>
                                <Text style={styles.label}>Other Charges</Text>
                                <TextInput
                                    style={styles.input}
                                    value={otherCharges}
                                    onChangeText={setOtherCharges}
                                    keyboardType="numeric"
                                    placeholder="0"
                                />
                            </View>
                        </View>

                        {user?.role === 'SuperAdmin' && (
                            <View style={styles.field}>
                                <Text style={styles.label}>Subscription Pay Link (SaaS Admin)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={adminPayLink}
                                    onChangeText={setAdminPayLink}
                                    placeholder="https://rzp.io/l/yourlink"
                                    autoCapitalize="none"
                                />
                                <Text style={styles.caption}>New partners will use this link to pay their subscription.</Text>
                            </View>
                        )}

                        <Pressable
                            style={[styles.primaryBtn, isSubmitting && { opacity: 0.7 }]}
                            onPress={handleSubmit}
                            disabled={isSubmitting}
                        >
                            <Text style={styles.primaryBtnText}>
                                {isSubmitting ? t('common.saving', 'Saving...') : t('common.save', 'Save Changes')}
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </KeyboardAvoidingScrollView>
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    content: {
        padding: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 24,
        color: '#1F2937',
        textAlign: 'center',
    },
    form: {
        gap: 16,
    },
    field: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#1F2937',
    },
    primaryBtn: {
        backgroundColor: '#4F46E5',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
    },
    primaryBtnText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    caption: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 4,
        fontStyle: 'italic',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginTop: 16,
        marginBottom: 8,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});
