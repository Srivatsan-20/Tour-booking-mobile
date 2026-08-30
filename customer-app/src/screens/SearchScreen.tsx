import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Dimensions
} from 'react-native';
import { Theme } from '../theme';
import { publicApi, PublicBusDto } from '../api/public';
import { MapPin, Calendar, Bus, Search, Filter, ChevronRight, Users } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export const SearchScreen = ({ navigation }: any) => {
    const [city, setCity] = useState('');
    const [fromDate, setFromDate] = useState('2026-05-01'); // Mock defaults for demo
    const [toDate, setToDate] = useState('2026-05-03');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<PublicBusDto[]>([]);

    const handleSearch = async () => {
        setLoading(true);
        try {
            const res = await publicApi.search({
                fromDate,
                toDate,
                city: city || undefined
            });
            setResults(res.data);
            if (res.data.length === 0) {
                Alert.alert("No Results", "No vehicles found for these dates. Try different dates or cities.");
            }
        } catch (error) {
            Alert.alert("Search Error", "Could not fetch availability. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Search Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Find Your Coach</Text>

                <View style={styles.searchBox}>
                    <View style={styles.cityInput}>
                        <MapPin size={20} color={Theme.colors.gold} />
                        <TextInput
                            style={styles.input}
                            placeholder="Destination City"
                            placeholderTextColor={Theme.colors.textMuted}
                            value={city}
                            onChangeText={setCity}
                        />
                    </View>

                    <View style={styles.dateRow}>
                        <View style={styles.dateInput}>
                            <Calendar size={18} color={Theme.colors.gold} />
                            <Text style={styles.dateText}>{fromDate}</Text>
                        </View>
                        <View style={styles.dateInput}>
                            <Calendar size={18} color={Theme.colors.gold} />
                            <Text style={styles.dateText}>{toDate}</Text>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
                        <Search size={20} color="#000" />
                        <Text style={styles.searchBtnText}>Search Availability</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Results */}
            <ScrollView contentContainerStyle={styles.scroll}>
                {loading ? (
                    <ActivityIndicator size="large" color={Theme.colors.gold} style={styles.loader} />
                ) : results.length > 0 ? (
                    results.map((bus) => (
                        <TouchableOpacity
                            key={bus.id}
                            style={styles.busCard}
                            onPress={() => navigation.navigate('BusDetail', { busId: bus.id })}
                        >
                            <View style={styles.busCardInner}>
                                <View style={styles.busHero}>
                                    <View style={styles.busIconContainer}>
                                        <Bus color={Theme.colors.gold} size={32} />
                                    </View>
                                    <View style={styles.busMainInfo}>
                                        <Text style={styles.busName}>{bus.name || bus.vehicleNumber}</Text>
                                        <Text style={styles.busCompany}>{bus.companyName}</Text>
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
                                </View>

                                <View style={styles.footer}>
                                    <Text style={styles.footerInfo}>Incl. Driver, Toll & Other charges from partner</Text>
                                    <ChevronRight size={20} color={Theme.colors.gold} />
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <Bus size={64} color={Theme.colors.border} />
                        <Text style={styles.emptyTitle}>Your Journey Starts Here</Text>
                        <Text style={styles.emptySubtitle}>Enter your travel details to find available heritage coaches.</Text>
                    </View>
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
    header: {
        paddingTop: 60,
        paddingHorizontal: Theme.spacing.lg,
        paddingBottom: 24,
        backgroundColor: Theme.colors.card,
        borderBottomLeftRadius: Theme.borderRadius.xl,
        borderBottomRightRadius: Theme.borderRadius.xl,
    },
    title: {
        fontFamily: Theme.fonts.serif,
        fontSize: 28,
        color: '#FFF',
        marginBottom: 24,
    },
    searchBox: {
        gap: 16,
    },
    cityInput: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.colors.background,
        borderRadius: Theme.borderRadius.md,
        paddingHorizontal: 16,
        height: 50,
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    input: {
        flex: 1,
        color: '#FFF',
        marginLeft: 12,
        fontFamily: Theme.fonts.sansMedium,
    },
    dateRow: {
        flexDirection: 'row',
        gap: 12,
    },
    dateInput: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.colors.background,
        borderRadius: Theme.borderRadius.md,
        paddingHorizontal: 16,
        height: 50,
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    dateText: {
        color: '#FFF',
        marginLeft: 12,
        fontFamily: Theme.fonts.sansMedium,
        fontSize: 13,
    },
    searchBtn: {
        height: 56,
        backgroundColor: Theme.colors.gold,
        borderRadius: Theme.borderRadius.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginTop: 8,
    },
    searchBtnText: {
        fontFamily: Theme.fonts.sansBold,
        fontSize: 16,
        color: '#000',
    },
    scroll: {
        padding: Theme.spacing.lg,
        paddingBottom: 40,
    },
    loader: {
        marginTop: 40,
    },
    busCard: {
        marginBottom: 20,
        borderRadius: Theme.borderRadius.lg,
        backgroundColor: Theme.colors.card,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        overflow: 'hidden',
    },
    busCardInner: {
        padding: 20,
    },
    busHero: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    busIconContainer: {
        width: 56,
        height: 56,
        backgroundColor: Theme.colors.goldMuted,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    busMainInfo: {
        flex: 1,
        marginLeft: 16,
    },
    busName: {
        fontFamily: Theme.fonts.serif,
        fontSize: 18,
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
        fontSize: 12,
        color: Theme.colors.gold,
        fontFamily: Theme.fonts.sansBold,
    },
    price: {
        fontSize: 22,
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
        gap: 16,
        marginBottom: 20,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    feature: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
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
        fontSize: 10,
        color: Theme.colors.textMuted,
        fontFamily: Theme.fonts.sansRegular,
        fontStyle: 'italic',
    },
    emptyState: {
        marginTop: 60,
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontFamily: Theme.fonts.serif,
        fontSize: 20,
        color: '#FFF',
        marginTop: 20,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontFamily: Theme.fonts.sansRegular,
        fontSize: 14,
        color: Theme.colors.textMuted,
        marginTop: 8,
        textAlign: 'center',
        lineHeight: 20,
    }
});
