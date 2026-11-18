import Foundation

public struct Strings: Sendable {
    public let language: AppLanguage

    public static func forLanguage(_ language: AppLanguage) -> Strings {
        Strings(language: language)
    }

    public static func resolveEffectiveLanguage(_ pref: LanguagePreference) -> AppLanguage {
        switch pref {
        case .en: return .en
        case .de: return .de
        case .system:
            let preferred = Locale.preferredLanguages.first ?? Locale.current.identifier
            return preferred.lowercased().hasPrefix("de") ? .de : .en
        }
    }

    private var isDE: Bool { language == .de }

    // MARK: - Tabs
    public var tabMenu: String { isDE ? "Speiseplan" : "Menu" }
    public var tabFavorites: String { isDE ? "Favoriten" : "Favorites" }
    public var tabSettings: String { isDE ? "Einstellungen" : "Settings" }
    public var tabSearch: String { isDE ? "Suche" : "Search" }

    // MARK: - Common
    public var today: String { isDE ? "Heute" : "Today" }
    public var mealSingular: String { isDE ? "Gericht" : "meal" }
    public var mealPlural: String { isDE ? "Gerichte" : "meals" }
    public var loading: String { isDE ? "Lädt…" : "Loading…" }
    public var newBadge: String { isDE ? "Neu" : "New" }
    public var mealPhoto: String { isDE ? "Essensfoto" : "Meal photo" }

    // MARK: - WeekStrip
    public var previousWeekday: String { isDE ? "Vorheriger Wochentag" : "Previous weekday" }
    public var nextWeekday: String { isDE ? "Nächster Wochentag" : "Next weekday" }
    public var openCalendar: String { isDE ? "Datumsauswahl öffnen" : "Open date picker" }
    public var jumpToToday: String { isDE ? "Zu heute springen" : "Jump to today" }

    // MARK: - Filters
    public var filterVegan: String { "Vegan" }
    public var filterVegetarian: String { isDE ? "Vegetarisch" : "Vegetarian" }
    public var filterFavorites: String { isDE ? "Favoriten" : "Favorites" }
    public var filterPrefix: String { "Filter" }

    public func filterLabel(_ key: FilterKey) -> String {
        switch key {
        case .vegan: return filterVegan
        case .vegetarian: return filterVegetarian
        case .favoritesOnly: return filterFavorites
        }
    }

    // MARK: - Menu
    public var defaultMenuTitle: String { "Mensa KA" }
    public var selectCanteen: String { isDE ? "Mensa auswählen" : "Select canteen" }
    public var selectPriceTier: String { isDE ? "Preiskategorie auswählen" : "Select price category" }
    public func offlineCache(_ timestamp: String) -> String {
        isDE ? "Offline-Cache vom \(timestamp)." : "Offline cache from \(timestamp)."
    }
    public var menuLoadFailed: String {
        isDE ? "Speiseplan konnte nicht geladen werden." : "Failed to load meal data."
    }
    public var menuNoData: String {
        isDE ? "Keine Speiseplandaten verfügbar." : "No meal data available."
    }
    public var menuNoMatchingMeals: String {
        isDE ? "Keine Gerichte passen zu den aktiven Filtern." : "No meals match your current filters."
    }

    // MARK: - Favorites
    public var favoritesTitle: String { isDE ? "Favoriten" : "Favorites" }
    public func servedOn(_ dateText: String) -> String {
        isDE ? "Angeboten am \(dateText)" : "Served on \(dateText)"
    }
    public var savedOtherDays: String {
        isDE ? "Für andere Tage gespeichert" : "Saved for Other Days"
    }
    public func lastSeen(_ dateText: String) -> String {
        isDE ? "Zuletzt am \(dateText)" : "Last seen \(dateText)"
    }
    public var favoritesEmptyTitle: String {
        isDE ? "Noch keine Favoriten" : "No Favorites Yet"
    }
    public var favoritesEmptyBody: String {
        isDE
            ? "Tippe im Speiseplan auf das Herz-Symbol, um Gerichte hier zu speichern."
            : "Tap the heart icon on any dish in the Menu tab to save it here."
    }

    // MARK: - Search
    public var searchTitle: String { isDE ? "Suche" : "Search Meals" }
    public var searchPlaceholder: String {
        isDE ? "Gerichte oder Linien suchen" : "Search dishes or lines"
    }
    public func subtitleWithCanteen(_ canteenName: String, _ dateText: String) -> String {
        "\(canteenName) · \(dateText)"
    }
    public func subtitleFallback(_ dateText: String) -> String {
        isDE ? "Ergebnisse für \(dateText)" : "Showing results for \(dateText)"
    }
    public func searchNoMatches(_ query: String, canteenName: String?) -> String {
        if isDE {
            let suffix = canteenName.map { " in \($0)" } ?? ""
            return "Keine Gerichte für „\(query)“\(suffix)"
        }
        let suffix = canteenName.map { " in \($0)" } ?? ""
        return "No dishes matching \"\(query)\"\(suffix)"
    }
    public func searchNoMeals(canteenName: String?) -> String {
        if isDE {
            if let canteenName {
                return "Keine Gerichte für \(canteenName) geladen."
            }
            return "Keine Gerichte für dieses Datum geladen."
        }
        if let canteenName {
            return "No meals loaded for \(canteenName)."
        }
        return "No meals loaded for this date."
    }

    // MARK: - Calendar
    public var calendarTitle: String { isDE ? "Datum wählen" : "Select Date" }
    public var cancel: String { isDE ? "Abbrechen" : "Cancel" }
    public var applyAccessibility: String {
        isDE ? "Ausgewähltes Datum übernehmen" : "Apply selected date"
    }
    public var pickerTitle: String { isDE ? "Speiseplan-Datum" : "Meal Plan Date" }
    public var selectedDay: String { isDE ? "Gewählter Tag" : "Selected Day" }
    public var applyButton: String { isDE ? "Datum übernehmen" : "Apply Selected Date" }
    public var nextWeekButton: String { isDE ? "1 Woche vorspringen" : "Jump Ahead 1 Week" }
    public var todayButton: String { isDE ? "Zu heute springen" : "Jump to Today" }

    // MARK: - Meal Detail
    public var detailFallbackTitle: String { isDE ? "Gerichtdetails" : "Meal Details" }
    public var detailLoadFailed: String {
        isDE ? "Gerichtdetails konnten nicht geladen werden." : "Meal details could not be loaded."
    }
    public var detailLoading: String {
        isDE ? "Gerichtdetails werden geladen…" : "Loading meal details…"
    }
    public var pricesTitle: String { isDE ? "Preise" : "Prices" }
    public var nutritionTitle: String { isDE ? "Nährwerte" : "Nutrition Facts" }
    public var sidesTitle: String { isDE ? "Beilagen" : "Included / Available Sides" }
    public var allergensTitle: String {
        isDE ? "Allergene & Zusatzstoffe" : "Allergens & Additives"
    }
    public var environmentTitle: String { isDE ? "Umweltbilanz" : "Environmental Impact" }
    public var statisticsTitle: String { isDE ? "Statistiken" : "Meal Statistics" }

    public var nutritionEnergy: String { isDE ? "Energie" : "Energy" }
    public var nutritionProtein: String { isDE ? "Eiweiß" : "Protein" }
    public var nutritionCarbs: String { isDE ? "Kohlenhydrate" : "Carbohydrates" }
    public var nutritionSugar: String { isDE ? "Zucker" : "Sugar" }
    public var nutritionFat: String { isDE ? "Fett" : "Fat" }
    public var nutritionSaturatedFat: String { isDE ? "Gesättigte Fettsäuren" : "Saturated Fat" }
    public var nutritionSalt: String { isDE ? "Salz" : "Salt" }

    public var envCO2: String { isDE ? "CO₂-Emissionen" : "CO₂ Emissions" }
    public var envWater: String { isDE ? "Wasserverbrauch" : "Water Usage" }

    public var statsLastServed: String { isDE ? "Zuletzt angeboten" : "Last Served" }
    public var statsNextServed: String { isDE ? "Nächstes Angebot" : "Next Served" }
    public var statsTimesServed: String {
        isDE ? "Häufigkeit (letzte 3 Monate)" : "Times Served (Last 3 Months)"
    }
    public var statsFirstTime: String { isDE ? "Erstmals" : "First time" }
    public var statsNotScheduled: String { isDE ? "Nicht geplant" : "Not scheduled" }

    // MARK: - Settings
    public var settingsTitle: String { isDE ? "Einstellungen" : "Settings" }
    public var settingsSectionsTitle: String { isDE ? "Detailbereiche" : "Detail Sections" }
    public var sectionDefaults: String { isDE ? "Speiseplan-Standards" : "Meal Plan Defaults" }
    public var sectionDetailPage: String { isDE ? "Detailansicht" : "Meal Detail Page" }
    public var sectionAppearance: String { isDE ? "Darstellung" : "Appearance" }
    public var sectionDataCache: String { isDE ? "API & Cache" : "Data & Offline Cache" }
    public var sectionAbout: String { isDE ? "Über" : "About" }

    public var rowCanteen: String { isDE ? "Mensa" : "Canteen" }
    public var rowPriceTier: String { isDE ? "Preiskategorie" : "Price Tier" }
    public var rowSkipWeekends: String { isDE ? "Wochenenden überspringen" : "Skip Weekends" }
    public var rowSectionsOrder: String { isDE ? "Bereiche & Reihenfolge" : "Sections & Order" }
    public var rowTheme: String { isDE ? "Design" : "Theme" }
    public var rowLanguage: String { isDE ? "Sprache" : "Language" }
    public var rowEndpoint: String { isDE ? "API Endpoint" : "Endpoint" }
    public var rowResetEndpoint: String {
        isDE ? "Auf api.mensa-ka.de zurücksetzen" : "Reset to api.mensa-ka.de"
    }
    public var rowClearCache: String { isDE ? "Offline-Cache leeren" : "Clear Offline Cache" }
    public var rowClearingCache: String { isDE ? "Cache wird geleert…" : "Clearing Cache…" }
    public var rowVersion: String { "Version" }
    public var rowViewGithub: String { isDE ? "Auf GitHub ansehen" : "View on GitHub" }

    public var editEndpointTitle: String { isDE ? "API-Endpoint ändern" : "Custom API Endpoint" }
    public var editEndpointMessage: String {
        isDE ? "Gib eine benutzerdefinierte GraphQL-URL ein." : "Enter a custom GraphQL endpoint URL."
    }
    public var save: String { isDE ? "Speichern" : "Save" }

    public var cacheClearedTitle: String { isDE ? "Cache geleert" : "Cache Cleared" }
    public var cacheClearedBody: String {
        isDE
            ? "Offline-Speisepläne und zwischengespeicherte Fotos wurden aktualisiert."
            : "Offline menus and cached dish photos have been refreshed."
    }

    public func themeLabel(_ pref: ThemePreference) -> String {
        switch pref {
        case .system: return "System"
        case .light: return isDE ? "Hell" : "Light"
        case .dark: return isDE ? "Dunkel" : "Dark"
        }
    }

    public func languageLabel(_ pref: LanguagePreference) -> String {
        switch pref {
        case .system: return "System"
        case .de: return "Deutsch"
        case .en: return "English"
        }
    }

    public var detailEditorSectionTitle: String {
        isDE ? "Reihenfolge & Sichtbarkeit" : "Order & Visibility"
    }
    public var detailEditorFooter: String {
        isDE
            ? "Ziehe an den Griffen, um die Reihenfolge auf der Gerichtseite zu ändern, oder schalte Bereiche ein und aus."
            : "Drag the handles to change the order shown on meal detail pages, or toggle switches to hide sections."
    }
    public var detailEditorResetAccessibility: String {
        isDE
            ? "Standardreihenfolge und Sichtbarkeit wiederherstellen"
            : "Reset default order and visibility"
    }

    public func detailSectionLabel(_ key: MealDetailSectionKey) -> String {
        switch key {
        case .prices: return isDE ? "Preise" : "Prices"
        case .nutrition: return isDE ? "Nährwerte" : "Nutrition Facts"
        case .sides: return isDE ? "Beilagen" : "Included Sides"
        case .allergens: return isDE ? "Allergene & Zusatzstoffe" : "Allergens & Additives"
        case .environment: return isDE ? "Umweltbilanz" : "Environmental Impact"
        case .statistics: return isDE ? "Statistiken" : "Meal Statistics"
        }
    }

    public func priceTierLabel(_ tier: PriceTier) -> String {
        switch tier {
        case .student: return isDE ? "Studierende" : "Student"
        case .employee: return isDE ? "Mitarbeitende" : "Employee"
        case .pupil: return isDE ? "Schüler:innen" : "Pupil"
        case .guest: return isDE ? "Gäste" : "Guest"
        }
    }

    public func mealTypeLabel(_ foodType: FoodType) -> String {
        switch foodType {
        case .vegan: return "Vegan"
        case .vegetarian: return isDE ? "Vegetarisch" : "Vegetarian"
        case .beef, .beefAW: return isDE ? "Rind" : "Beef"
        case .pork, .porkAW: return isDE ? "Schwein" : "Pork"
        case .poultry: return isDE ? "Geflügel" : "Poultry"
        case .fish: return isDE ? "Fisch" : "Fish"
        case .unknown: return isDE ? "Unbekannt" : "Unknown"
        }
    }

    public var noRatings: String { isDE ? "Noch keine Bewertungen" : "No ratings yet" }

    // MARK: - Lightbox
    public var lightboxShare: String { isDE ? "Foto teilen" : "Share photo" }
    public var lightboxClose: String { isDE ? "Fotoansicht schließen" : "Close photo viewer" }

    // MARK: - Allergens & Additives
    private static let allergenEN: [String: String] = [
        "CA": "Cashews", "DI": "Spelt & gluten", "EI": "Eggs", "ER": "Peanuts",
        "FI": "Fish", "GE": "Barley & gluten", "HF": "Oat & gluten", "HA": "Hazelnuts",
        "KA": "Kamut & gluten", "KR": "Crustaceans", "LU": "Lupin", "MA": "Almonds",
        "ML": "Milk / lactose", "PA": "Brazil nuts", "PE": "Pecans", "PI": "Pistachios",
        "QU": "Macadamia nuts", "RO": "Rye & gluten", "SA": "Sesame", "SE": "Celery",
        "SF": "Sulphite", "SN": "Mustard", "SO": "Soya", "WA": "Walnuts",
        "WE": "Wheat & gluten", "WT": "Molluscs", "LA": "Animal rennet", "GL": "Gelatin",
    ]

    private static let allergenDE: [String: String] = [
        "CA": "Cashewnüsse", "DI": "Dinkel & Gluten", "EI": "Eier", "ER": "Erdnüsse",
        "FI": "Fisch", "GE": "Gerste & Gluten", "HF": "Hafer & Gluten", "HA": "Haselnüsse",
        "KA": "Kamut & Gluten", "KR": "Krebstiere", "LU": "Lupinen", "MA": "Mandeln",
        "ML": "Milch / Laktose", "PA": "Paranüsse", "PE": "Pekannüsse", "PI": "Pistazien",
        "QU": "Macadamianüsse", "RO": "Roggen & Gluten", "SA": "Sesam", "SE": "Sellerie",
        "SF": "Sulfite", "SN": "Senf", "SO": "Soja", "WA": "Walnüsse",
        "WE": "Weizen & Gluten", "WT": "Weichtiere", "LA": "Tierisches Lab", "GL": "Gelatine",
    ]

    private static let additiveEN: [String: String] = [
        "COLORANT": "Colorant", "PRESERVING_AGENTS": "Preserving agents",
        "ANTIOXIDANT_AGENTS": "Antioxidant agents", "FLAVOUR_ENHANCER": "Flavour enhancer",
        "PHOSPHATE": "Phosphate", "SURFACE_WAXED": "Surface waxed", "SULPHUR": "Sulphur",
        "ARTIFICIALLY_BLACKENED_OLIVES": "Blackened olives", "SWEETENER": "Sweetener",
        "LAXATIVE_IF_OVERUSED": "Laxative if overused", "PHENYLALANINE": "Phenylalanine",
        "ALCOHOL": "Alcohol", "PRESSED_MEAT": "Pressed meat",
        "GLAZING_WITH_CACAO": "Glazed with cacao", "PRESSED_FISH": "Pressed fish",
    ]

    private static let additiveDE: [String: String] = [
        "COLORANT": "Farbstoff", "PRESERVING_AGENTS": "Konservierungsstoff",
        "ANTIOXIDANT_AGENTS": "Antioxidationsmittel", "FLAVOUR_ENHANCER": "Geschmacksverstärker",
        "PHOSPHATE": "Phosphat", "SURFACE_WAXED": "Gewachst", "SULPHUR": "Geschwefelt",
        "ARTIFICIALLY_BLACKENED_OLIVES": "Geschwärzt", "SWEETENER": "Süßungsmittel",
        "LAXATIVE_IF_OVERUSED": "Kann abführend wirken", "PHENYLALANINE": "Phenylalaninquelle",
        "ALCOHOL": "Alkohol", "PRESSED_MEAT": "Formfleisch",
        "GLAZING_WITH_CACAO": "Kakaohaltige Fettglasur", "PRESSED_FISH": "Formfisch",
    ]

    public func allergenLabel(_ code: String) -> String {
        (isDE ? Self.allergenDE : Self.allergenEN)[code] ?? code
    }

    public func additiveLabel(_ code: String) -> String {
        (isDE ? Self.additiveDE : Self.additiveEN)[code] ?? code
    }
}
