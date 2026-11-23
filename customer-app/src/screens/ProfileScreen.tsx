import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Theme } from '../theme';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import {
    User,
    Phone,
    Mail,
    ArrowLeft,
    BookmarkCheck,
    LogOut,
    Trash2,
    ShieldCheck,
    ChevronRight,
} from 'lucide-react-native';

export const ProfileScreen = ({ navigation }: any) => {
    const { customer, logout, deleteAccount } = useCustomerAuth();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleLogoutPrompt = () => {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out from your account?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Sign Out',
                    style: 'destructive',
                    onPress: async () => {
                        await logout();
                        navigation.navigate('Search');
                    },
                },
            ]
        );
    };

    const handleDeleteAccountPrompt = () => {
        Alert.alert(
            'Delete Account',
            'Are you sure you want to permanently delete your account? All your personal details and booking history will be permanently deleted from our servers. This action is immediate and cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete Account',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setIsDeleting(true);
                            await deleteAccount();
                            Alert.alert(
                                'Account Deleted',
                                'Your account and personal data have been permanently removed.',
                                [
                                    {
                                        text: 'OK',
                                        onPress: () => navigation.navigate('Search'),
                                    },
                                ]
                            );
                        } catch (err: any) {
                            Alert.alert('Error', 'Unable to complete deletion request. Please try again.');
                        } finally {
                            setIsDeleting(false);
                        }
                    },
                },
            ]
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => navigation.goBack()}
                    accessibilityLabel="Go back"
                >
                    <ArrowLeft color={Theme.colors.gold} size={22} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Account</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* User Info Card */}
                <View style={styles.userCard}>
                    <View style={styles.avatarCircle}>
                        <User color={Theme.colors.gold} size={32} />
                    </View>
                    <Text style={styles.userName}>{customer?.name || 'Guest User'}</Text>
                    <Text style={styles.userRole}>S3T Connect Member</Text>

                    <View style={styles.divider} />

                    <View style={styles.infoRow}>
                        <Phone size={16} color={Theme.colors.gold} />
                        <Text style={styles.infoText}>{customer?.phone || 'Not available'}</Text>
                    </View>

                    {customer?.email ? (
                        <View style={styles.infoRow}>
                            <Mail size={16} color={Theme.colors.gold} />
                            <Text style={styles.infoText}>{customer.email}</Text>
                        </View>
                    ) : null}
                </View>

                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Account Options</Text>

                    <TouchableOpacity
                        style={styles.actionRow}
                        onPress={() => navigation.navigate('History')}
                    >
                        <View style={styles.actionLeft}>
                            <BookmarkCheck size={20} color={Theme.colors.gold} />
                            <Text style={styles.actionText}>My Trips & Bookings</Text>
                        </View>
                        <ChevronRight size={18} color={Theme.colors.textMuted} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionRow}
                        onPress={handleLogoutPrompt}
                    >
                        <View style={styles.actionLeft}>
                            <LogOut size={20} color="#F59E0B" />
                            <Text style={[styles.actionText, { color: '#F59E0B' }]}>Sign Out</Text>
                        </View>
                        <ChevronRight size={18} color={Theme.colors.textMuted} />
                    </TouchableOpacity>
                </View>

                {/* Account Deletion (Apple Guideline 5.1.1(v)) */}
                <View style={styles.dangerSection}>
                    <View style={styles.dangerHeader}>
                        <ShieldCheck size={18} color={Theme.colors.error} />
                        <Text style={styles.dangerTitle}>Privacy & Account Management</Text>
                    </View>
                    <Text style={styles.dangerDescription}>
                        In compliance with data privacy regulations, you have full control over your personal data. Deleting your account will permanently remove your login credentials, booking records, and profile details from our system.
                    </Text>

                    <TouchableOpacity
                        style={[styles.deleteBtn, isDeleting && { opacity: 0.6 }]}
                        onPress={handleDeleteAccountPrompt}
                        disabled={isDeleting}
                        accessibilityLabel="Delete Account"
                    >
                        {isDeleting ? (
                            <ActivityIndicator size="small" color={Theme.colors.error} />
                        ) : (
                            <>
                                <Trash2 size={18} color={Theme.colors.error} />
                                <Text style={styles.deleteBtnText}>Delete Account</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={styles.footerNote}>
                    <Text style={styles.footerNoteText}>
                        Shree Sai Senthil Travels • Preserving Legacy Since 1963
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
        justifyContent: 'space-between',
        paddingHorizontal: Theme.spacing.md,
        paddingTop: 54,
        paddingBottom: Theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Theme.colors.border,
        backgroundColor: '#0D0D0D',
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        color: Theme.colors.text,
        fontSize: 18,
        fontFamily: Theme.fonts.sansBold,
    },
    scrollContent: {
        padding: Theme.spacing.md,
        paddingBottom: 40,
    },
    userCard: {
        backgroundColor: Theme.colors.card,
        borderRadius: Theme.borderRadius.lg,
        padding: Theme.spacing.lg,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Theme.colors.border,
        marginBottom: Theme.spacing.lg,
    },
    avatarCircle: {
        width: 68,
        height: 68,
        borderRadius: 34,
        backgroundColor: Theme.colors.goldMuted,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: Theme.colors.gold,
        marginBottom: Theme.spacing.sm,
    },
    userName: {
        color: Theme.colors.text,
        fontSize: 20,
        fontFamily: Theme.fonts.serif,
        marginBottom: 2,
    },
    userRole: {
        color: Theme.colors.gold,
        fontSize: 12,
        fontFamily: Theme.fonts.sansMedium,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    divider: {
        width: '100%',
        height: 1,
        backgroundColor: Theme.colors.border,
        marginVertical: Theme.spacing.md,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginVertical: 4,
        alignSelf: 'flex-start',
        paddingHorizontal: Theme.spacing.sm,
    },
    infoText: {
        color: Theme.colors.textMuted,
        fontSize: 14,
        fontFamily: Theme.fonts.sansRegular,
    },
    section: {
        backgroundColor: Theme.colors.card,
        borderRadius: Theme.borderRadius.lg,
        padding: Theme.spacing.md,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        marginBottom: Theme.spacing.lg,
    },
    sectionTitle: {
        color: Theme.colors.textMuted,
        fontSize: 12,
        fontFamily: Theme.fonts.sansBold,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: Theme.spacing.sm,
        paddingHorizontal: Theme.spacing.xs,
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: Theme.spacing.xs,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.03)',
    },
    actionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    actionText: {
        color: Theme.colors.text,
        fontSize: 15,
        fontFamily: Theme.fonts.sansMedium,
    },
    dangerSection: {
        backgroundColor: 'rgba(239, 68, 68, 0.04)',
        borderRadius: Theme.borderRadius.lg,
        padding: Theme.spacing.lg,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.25)',
        marginBottom: Theme.spacing.lg,
    },
    dangerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: Theme.spacing.xs,
    },
    dangerTitle: {
        color: Theme.colors.error,
        fontSize: 14,
        fontFamily: Theme.fonts.sansBold,
    },
    dangerDescription: {
        color: Theme.colors.textMuted,
        fontSize: 12,
        fontFamily: Theme.fonts.sansRegular,
        lineHeight: 18,
        marginBottom: Theme.spacing.md,
    },
    deleteBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 1,
        borderColor: Theme.colors.error,
        borderRadius: Theme.borderRadius.md,
        paddingVertical: 12,
        paddingHorizontal: Theme.spacing.md,
    },
    deleteBtnText: {
        color: Theme.colors.error,
        fontSize: 14,
        fontFamily: Theme.fonts.sansBold,
    },
    footerNote: {
        alignItems: 'center',
        marginTop: Theme.spacing.sm,
    },
    footerNoteText: {
        color: Theme.colors.textMuted,
        fontSize: 11,
        fontFamily: Theme.fonts.sansRegular,
        opacity: 0.6,
    },
});
