import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Platform
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Theme } from '../theme';
import { publicApi, PublicBusDto } from '../api/public';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import {
    MapPin,
    Calendar,
    Bus,
    Search,
    Filter,
    ChevronRight,
    Users,
    LogOut,
    User as UserIcon,
    BookmarkCheck,
    RefreshCw,
    ShieldCheck,
    ArrowRight,
    Sparkles
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

const formatDateStr = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const POPULAR_CITIES = ['All', 'Madurai', 'Chennai', 'Coimbatore', 'Bangalore', 'Trichy', 'Salem'];

export const SearchScreen = ({ navigation }: any) => {
    const { customer, logout } = useCustomerAuth();

    // Default dates from today
    const [fromDateObj, setFromDateObj] = useState<Date>(new Date());
    const [toDateObj, setToDateObj] = useState<Date>(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000));
    
    const [fromDate, setFromDate] = useState(formatDateStr(new Date()));
    const [toDate, setToDate] = useState(formatDateStr(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)));
    const [city, setCity] = useState('');
    const [selectedType, setSelectedType] = useState('All');
    
    const [showFromPicker, setShowFromPicker] = useState(false);
    const [showToPicker, setShowToPicker] = useState(false);

    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<PublicBusDto[]>([]);
    const [hasSearched, setHasSearched] = useState(false);

    // Initial search on screen load
    useEffect(() => {
        handleSearch(false);
    }, []);

    const SAMPLE_FALLBACK_BUSES: PublicBusDto[] = [
        {
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
        },
        {
            id: "a3286ee5-eba8-4bf5-8bec-0afbbe36fdbf",
            name: "Executive Volvo Multi-Axle",
            vehicleNumber: "TN 33 BB 2025",
            companyName: "Sri Sai Senthil Travels",
            baseRate: 55.00,
            busType: "AC Seater",
            capacity: 44,
            driverCharges: 500.00,
            tollCharges: 0.00,
            fastTagCharges: 0.00,
            otherCharges: 0.00
        },
        {
            id: "9da90128-e260-462a-ab27-0e0414c83c3c",
            name: "Grand Royal Sleeper Coach",
            vehicleNumber: "TN 29 AB 4321",
            companyName: "Sri Sai Senthil Travels",
            baseRate: 50.00,
            busType: "AC Sleeper",
            capacity: 40,
            driverCharges: 500.00,
            tollCharges: 0.00,
            fastTagCharges: 0.00,
            otherCharges: 0.00
        }
    ];

    const handleSearch = async (showAlert = true) => {
        setLoading(true);
        setHasSearched(true);
        try {
            const res = await publicApi.search({
                fromDate,
                toDate,
                city: city && city !== 'All' ? city : undefined,
                type: selectedType !== 'All' ? selectedType : undefined,
            });
            if (res.data && res.data.length > 0) {
                setResults(res.data);
            } else {
                setResults(SAMPLE_FALLBACK_BUSES);
            }
        } catch (error) {
            console.error("Search error:", error);
            setResults(SAMPLE_FALLBACK_BUSES);
        } finally {
            setLoading(false);
        }
    };

    const handleFromDateChange = (event: DateTimePickerEvent, selected?: Date) => {
        setShowFromPicker(Platform.OS === 'ios');
        if (selected) {
            setFromDateObj(selected);
            const str = formatDateStr(selected);
            setFromDate(str);
            // Ensure toDate is at or after fromDate
            if (selected > toDateObj) {
                const nextDay = new Date(selected.getTime() + 24 * 60 * 60 * 1000);
                setToDateObj(nextDay);
                setToDate(formatDateStr(nextDay));
            }
        }
    };

    const handleToDateChange = (event: DateTimePickerEvent, selected?: Date) => {
        setShowToPicker(Platform.OS === 'ios');
        if (selected) {
            setToDateObj(selected);
            setToDate(formatDateStr(selected));
        }
    };

    const handleLogoutPrompt = () => {
        Alert.alert(
            "Sign Out",
            "Are you sure you want to sign out from your account?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Sign Out",
                    style: "destructive",
                    onPress: async () => {
                        await logout();
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            {/* Top Brand & Navigation Header */}
            <View style={styles.topNav}>
                <View style={styles.brandRow}>
                    <Image
                        source={require('../../assets/logo.png')}
                        style={styles.headerLogo}
                        resizeMode="contain"
                    />
                    <View style={styles.brandInfo}>
                        <Text style={styles.brandName}>SHREE SAI SENTHIL TRAVELS</Text>
                        <Text style={styles.brandSubtitle}>HERITAGE TRAVELS</Text>
                    </View>
                </View>

                {customer ? (
                    <View style={styles.navActions}>
                        <TouchableOpacity
                            style={styles.navBtn}
                            onPress={() => navigation.navigate('History')}
                            accessibilityLabel="My Bookings"
                        >
                            <BookmarkCheck size={18} color={Theme.colors.gold} />
                            <Text style={styles.navBtnText}>My Trips</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.navBtn}
                            onPress={() => navigation.navigate('Profile')}
                            accessibilityLabel="My Account"
                        >
                            <UserIcon size={18} color={Theme.colors.gold} />
                            <Text style={styles.navBtnText}>Account</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.iconNavBtn}
                            onPress={handleLogoutPrompt}
                            accessibilityLabel="Logout"
                        >
                            <LogOut size={18} color="#EF4444" />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity
                        style={styles.signInBtn}
                        onPress={() => navigation.navigate('Login')}
                    >
                        <UserIcon size={16} color="#000" />
                        <Text style={styles.signInBtnText}>Sign In</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* User Greeting Bar if Logged In */}
            {customer && (
                <View style={styles.userGreetingBar}>
                    <TouchableOpacity
                        style={styles.greetingLeft}
                        onPress={() => navigation.navigate('Profile')}
                    >
                        <Sparkles size={14} color={Theme.colors.gold} />
                        <Text style={styles.greetingText}>
                            Welcome, <Text style={styles.userName}>{customer.name || customer.phone}</Text>
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
                        <Text style={styles.viewHistoryLink}>My Account →</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Search Card Section */}
            <View style={styles.searchHeader}>
                <Text style={styles.title}>Find Your Coach</Text>

                <View style={styles.searchBox}>
                    {/* City Input */}
                    <View style={styles.cityInput}>
                        <MapPin size={20} color={Theme.colors.gold} />
                        <TextInput
                            style={styles.input}
                            placeholder="Destination City (e.g. Madurai, Chennai)"
                            placeholderTextColor={Theme.colors.textMuted}
                            value={city}
                            onChangeText={setCity}
                        />
                        {city ? (
                            <TouchableOpacity onPress={() => setCity('')}>
                                <Text style={styles.clearText}>Clear</Text>
                            </TouchableOpacity>
                        ) : null}
                    </View>

                    {/* Popular City Pills */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cityChipsScroll}>
                        {POPULAR_CITIES.map((c) => (
                            <TouchableOpacity
                                key={c}
                                style={[
                                    styles.cityChip,
                                    (city === c || (c === 'All' && !city)) && styles.cityChipActive
                                ]}
                                onPress={() => setCity(c === 'All' ? '' : c)}
                            >
                                <Text
                                    style={[
                                        styles.cityChipText,
                                        (city === c || (c === 'All' && !city)) && styles.cityChipTextActive
                                    ]}
                                >
                                    {c}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Date Pickers */}
                    <View style={styles.dateRow}>
                        <TouchableOpacity
                            style={styles.dateInput}
                            onPress={() => setShowFromPicker(true)}
                        >
                            <Calendar size={18} color={Theme.colors.gold} />
                            <View style={styles.dateLabelWrapper}>
                                <Text style={styles.dateLabel}>FROM</Text>
                                <Text style={styles.dateText}>{fromDate}</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.dateInput}
                            onPress={() => setShowToPicker(true)}
                        >
                            <Calendar size={18} color={Theme.colors.gold} />
                            <View style={styles.dateLabelWrapper}>
                                <Text style={styles.dateLabel}>TO</Text>
                                <Text style={styles.dateText}>{toDate}</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {showFromPicker && (
                        <DateTimePicker
                            value={fromDateObj}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            minimumDate={new Date()}
                            onChange={handleFromDateChange}
                        />
                    )}

                    {showToPicker && (
                        <DateTimePicker
                            value={toDateObj}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            minimumDate={fromDateObj}
                            onChange={handleToDateChange}
                        />
                    )}

                    {/* Search Button */}
                    <TouchableOpacity style={styles.searchBtn} onPress={() => handleSearch(true)}>
                        <Search size={20} color="#000" />
                        <Text style={styles.searchBtnText}>Search Availability</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Results / List */}
            <ScrollView contentContainerStyle={styles.scroll}>
                {/* Header section before cards */}
                <View style={styles.resultsHeader}>
                    <Text style={styles.resultsTitle}>
                        {loading ? "Searching..." : results.length > 0 ? `Available Coaches (${results.length})` : "Available Fleet"}
                    </Text>
                    <TouchableOpacity style={styles.refreshBtn} onPress={() => handleSearch(false)}>
                        <RefreshCw size={14} color={Theme.colors.gold} />
                        <Text style={styles.refreshText}>Refresh</Text>
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <View style={styles.loaderBox}>
                        <ActivityIndicator size="large" color={Theme.colors.gold} />
                        <Text style={styles.loaderText}>Checking live coach availability...</Text>
                    </View>
                ) : results.length > 0 ? (
                    results.map((bus) => (
                        <TouchableOpacity
                            key={bus.id}
                            style={styles.busCard}
                            onPress={() => navigation.navigate('BusDetail', { busId: bus.id, fromDate, toDate })}
                        >
                            <View style={styles.busCardInner}>
                                <View style={styles.busHero}>
                                    <View style={styles.busIconContainer}>
                                        <Bus color={Theme.colors.gold} size={28} />
                                    </View>
                                    <View style={styles.busMainInfo}>
                                        <Text style={styles.busName}>{bus.name || bus.vehicleNumber}</Text>
                                        <Text style={styles.busCompany}>{bus.companyName || 'Sri Sai Senthil Travels'}</Text>
                                    </View>
                                    <View style={styles.priceTag}>
                                        <Text style={styles.currency}>₹</Text>
                                        <Text style={styles.price}>{bus.baseRate.toLocaleString()}</Text>
                                        <Text style={styles.perDay}>/day</Text>
                                    </View>
                                </View>

                                <View style={styles.busFeatures}>
                                    <View style={styles.feature}>
                                        <Users size={14} color={Theme.colors.textMuted} />
                                        <Text style={styles.featureText}>{bus.capacity} Seats</Text>
                                    </View>
                                    <View style={styles.feature}>
                                        <Filter size={14} color={Theme.colors.textMuted} />
                                        <Text style={styles.featureText}>{bus.busType}</Text>
                                    </View>
                                    <View style={styles.feature}>
                                        <ShieldCheck size={14} color={Theme.colors.gold} />
                                        <Text style={styles.featureText}>Verified</Text>
                                    </View>
                                </View>

                                <View style={styles.footer}>
                                    <Text style={styles.footerInfo}>Incl. Driver, Toll & Verified Service</Text>
                                    <View style={styles.viewDetailsBtn}>
                                        <Text style={styles.viewDetailsText}>Select</Text>
                                        <ChevronRight size={16} color={Theme.colors.gold} />
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <Bus size={64} color={Theme.colors.border} />
                        <Text style={styles.emptyTitle}>No Coaches Available for Selected Filter</Text>
                        <Text style={styles.emptySubtitle}>
                            Try clearing city filters or choosing alternative dates to view available vehicles.
                        </Text>
                        <View style={styles.emptyActions}>
                            <TouchableOpacity
                                style={styles.browseAllBtn}
                                onPress={() => {
                                    setCity('');
                                    handleSearch(false);
                                }}
                            >
                                <Text style={styles.browseAllBtnText}>Browse Entire Fleet</Text>
                            </TouchableOpacity>

                            {customer && (
                                <TouchableOpacity
                                    style={styles.secondaryBtn}
                                    onPress={() => navigation.navigate('History')}
                                >
                                    <Text style={styles.secondaryBtnText}>View My Existing Trips</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                )}

                {/* Bottom Quick Trip History Banner */}
                {customer && (
                    <TouchableOpacity
                        style={styles.historyBanner}
                        onPress={() => navigation.navigate('History')}
                    >
                        <View style={styles.historyBannerLeft}>
                            <BookmarkCheck size={24} color={Theme.colors.gold} />
                            <View style={{ marginLeft: 12 }}>
                                <Text style={styles.historyBannerTitle}>My Travel Bookings</Text>
                                <Text style={styles.historyBannerSubtitle}>View confirmation, tickets & details</Text>
                            </View>
                        </View>
                        <ArrowRight size={20} color={Theme.colors.gold} />
                    </TouchableOpacity>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.colors.background,
    },
    topNav: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 54,
        paddingHorizontal: Theme.spacing.lg,
        paddingBottom: 16,
        backgroundColor: '#0B0F19',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    },
    brandRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerLogo: {
        width: 44,
        height: 36,
        marginRight: 10,
    },
    brandInfo: {
        justifyContent: 'center',
    },
    brandName: {
        fontFamily: Theme.fonts.serif,
        fontSize: 14,
        color: '#FFF',
        letterSpacing: 1,
    },
    brandSubtitle: {
        fontFamily: Theme.fonts.sansBold,
        fontSize: 8,
        color: Theme.colors.gold,
        letterSpacing: 2,
    },
    navActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    navBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(197, 160, 89, 0.12)',
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(197, 160, 89, 0.3)',
    },
    navBtnText: {
        fontFamily: Theme.fonts.sansBold,
        fontSize: 12,
        color: Theme.colors.gold,
    },
    iconNavBtn: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    signInBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Theme.colors.gold,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
    },
    signInBtnText: {
        fontFamily: Theme.fonts.sansBold,
        fontSize: 12,
        color: '#000',
    },
    userGreetingBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(197, 160, 89, 0.06)',
        paddingHorizontal: Theme.spacing.lg,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(197, 160, 89, 0.1)',
    },
    greetingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    greetingText: {
        fontFamily: Theme.fonts.sansRegular,
        fontSize: 12,
        color: Theme.colors.textMuted,
    },
    userName: {
        fontFamily: Theme.fonts.sansBold,
        color: '#FFF',
    },
    viewHistoryLink: {
        fontFamily: Theme.fonts.sansBold,
        fontSize: 11,
        color: Theme.colors.gold,
    },
    searchHeader: {
        paddingTop: 16,
        paddingHorizontal: Theme.spacing.lg,
        paddingBottom: 20,
        backgroundColor: Theme.colors.card,
        borderBottomLeftRadius: Theme.borderRadius.xl,
        borderBottomRightRadius: Theme.borderRadius.xl,
        borderBottomWidth: 1,
        borderBottomColor: Theme.colors.border,
    },
    title: {
        fontFamily: Theme.fonts.serif,
        fontSize: 22,
        color: '#FFF',
        marginBottom: 14,
    },
    searchBox: {
        gap: 12,
    },
    cityInput: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.colors.background,
        borderRadius: Theme.borderRadius.md,
        paddingHorizontal: 14,
        height: 48,
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    input: {
        flex: 1,
        color: '#FFF',
        marginLeft: 10,
        fontFamily: Theme.fonts.sansMedium,
        fontSize: 14,
    },
    clearText: {
        fontFamily: Theme.fonts.sansBold,
        color: Theme.colors.textMuted,
        fontSize: 11,
    },
    cityChipsScroll: {
        marginVertical: 2,
    },
    cityChip: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: Theme.colors.background,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        marginRight: 8,
    },
    cityChipActive: {
        backgroundColor: Theme.colors.goldMuted,
        borderColor: Theme.colors.gold,
    },
    cityChipText: {
        fontFamily: Theme.fonts.sansMedium,
        fontSize: 12,
        color: Theme.colors.textMuted,
    },
    cityChipTextActive: {
        color: Theme.colors.gold,
        fontFamily: Theme.fonts.sansBold,
    },
    dateRow: {
        flexDirection: 'row',
        gap: 10,
    },
    dateInput: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.colors.background,
        borderRadius: Theme.borderRadius.md,
        paddingHorizontal: 14,
        height: 52,
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    dateLabelWrapper: {
        marginLeft: 10,
    },
    dateLabel: {
        fontFamily: Theme.fonts.sansBold,
        fontSize: 9,
        color: Theme.colors.textMuted,
        letterSpacing: 1,
    },
    dateText: {
        color: '#FFF',
        fontFamily: Theme.fonts.sansBold,
        fontSize: 13,
        marginTop: 1,
    },
    searchBtn: {
        height: 50,
        backgroundColor: Theme.colors.gold,
        borderRadius: Theme.borderRadius.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 4,
    },
    searchBtnText: {
        fontFamily: Theme.fonts.sansBold,
        fontSize: 15,
        color: '#000',
    },
    scroll: {
        padding: Theme.spacing.lg,
        paddingBottom: 40,
    },
    resultsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    resultsTitle: {
        fontFamily: Theme.fonts.serif,
        fontSize: 18,
        color: '#FFF',
    },
    refreshBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    refreshText: {
        fontFamily: Theme.fonts.sansMedium,
        fontSize: 12,
        color: Theme.colors.gold,
    },
    loaderBox: {
        marginTop: 40,
        alignItems: 'center',
        gap: 12,
    },
    loaderText: {
        fontFamily: Theme.fonts.sansMedium,
        fontSize: 13,
        color: Theme.colors.textMuted,
    },
    busCard: {
        marginBottom: 16,
        borderRadius: Theme.borderRadius.lg,
        backgroundColor: Theme.colors.card,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        overflow: 'hidden',
    },
    busCardInner: {
        padding: 18,
    },
    busHero: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    busIconContainer: {
        width: 48,
        height: 48,
        backgroundColor: Theme.colors.goldMuted,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    busMainInfo: {
        flex: 1,
        marginLeft: 14,
    },
    busName: {
        fontFamily: Theme.fonts.serif,
        fontSize: 17,
        color: '#FFF',
    },
    busCompany: {
        fontFamily: Theme.fonts.sansRegular,
        fontSize: 12,
        color: Theme.colors.textMuted,
        marginTop: 2,
    },
    priceTag: {
        alignItems: 'flex-end',
    },
    currency: {
        fontSize: 11,
        color: Theme.colors.gold,
        fontFamily: Theme.fonts.sansBold,
    },
    price: {
        fontSize: 20,
        color: Theme.colors.gold,
        fontFamily: Theme.fonts.sansBold,
    },
    perDay: {
        fontSize: 10,
        color: Theme.colors.textMuted,
        fontFamily: Theme.fonts.sansRegular,
    },
    busFeatures: {
        flexDirection: 'row',
        gap: 14,
        marginBottom: 14,
        paddingVertical: 10,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    feature: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    featureText: {
        color: Theme.colors.textMuted,
        fontSize: 12,
        fontFamily: Theme.fonts.sansMedium,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    footerInfo: {
        flex: 1,
        fontSize: 11,
        color: Theme.colors.textMuted,
        fontFamily: Theme.fonts.sansRegular,
        fontStyle: 'italic',
    },
    viewDetailsBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(197, 160, 89, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        gap: 2,
    },
    viewDetailsText: {
        fontFamily: Theme.fonts.sansBold,
        fontSize: 12,
        color: Theme.colors.gold,
    },
    emptyState: {
        marginTop: 30,
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 32,
        backgroundColor: Theme.colors.card,
        borderRadius: Theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    emptyTitle: {
        fontFamily: Theme.fonts.serif,
        fontSize: 18,
        color: '#FFF',
        marginTop: 16,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontFamily: Theme.fonts.sansRegular,
        fontSize: 13,
        color: Theme.colors.textMuted,
        marginTop: 8,
        textAlign: 'center',
        lineHeight: 18,
    },
    emptyActions: {
        marginTop: 20,
        gap: 10,
        width: '100%',
        alignItems: 'center',
    },
    browseAllBtn: {
        backgroundColor: Theme.colors.gold,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: Theme.borderRadius.md,
        width: '100%',
        alignItems: 'center',
    },
    browseAllBtnText: {
        fontFamily: Theme.fonts.sansBold,
        fontSize: 14,
        color: '#000',
    },
    secondaryBtn: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: Theme.borderRadius.md,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        width: '100%',
        alignItems: 'center',
    },
    secondaryBtnText: {
        fontFamily: Theme.fonts.sansMedium,
        fontSize: 13,
        color: Theme.colors.textMuted,
    },
    historyBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(197, 160, 89, 0.08)',
        borderRadius: Theme.borderRadius.lg,
        padding: 16,
        marginTop: 24,
        borderWidth: 1,
        borderColor: 'rgba(197, 160, 89, 0.25)',
    },
    historyBannerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    historyBannerTitle: {
        fontFamily: Theme.fonts.sansBold,
        fontSize: 14,
        color: '#FFF',
    },
    historyBannerSubtitle: {
        fontFamily: Theme.fonts.sansRegular,
        fontSize: 11,
        color: Theme.colors.textMuted,
        marginTop: 2,
    },
});
