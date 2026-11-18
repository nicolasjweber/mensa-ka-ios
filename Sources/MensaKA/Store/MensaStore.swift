import Foundation
import Observation
import SwiftUI

@Observable
@MainActor
public final class MensaStore {
    public var date: String
    public var preferences: UserPreferences
    public var favorites: [String: FavoriteSnapshot]
    public var activeFilters: ActiveFilters = ActiveFilters()

    public var canteens: [Canteen] = []
    public var isLoading: Bool = true
    public var isRefreshing: Bool = false
    public var errorMessage: String?
    public var dataUpdatedAt: Date?

    public var isCalendarPresented: Bool = false
    public var lightboxPayload: LightboxPayload?

    private var mealPlanCache: [String: CachedMealPlanEntry]
    private var mealDetailsCache: [String: Meal] = [:]
    private let authHeader: String?
    private var activePlanTask: Task<Void, Never>?

    public init() {
        let loadedPrefs = PersistenceService.loadPreferences()
        let loadedFavs = PersistenceService.loadFavorites()
        let loadedCache = PersistenceService.loadMealPlanCache()
        _ = PersistenceService.getOrCreateClientID()

        self.preferences = loadedPrefs
        self.favorites = loadedFavs
        self.mealPlanCache = loadedCache
        self.authHeader = PersistenceService.getCustomAuthHeader()
        self.date = DateUtils.getInitialWeekdayString(skipWeekends: loadedPrefs.skipWeekends)

        if let cached = mealPlanCache[cacheKey(for: date)] {
            self.canteens = Self.cleanCanteens(cached.canteens)
            self.dataUpdatedAt = cached.updatedAt
            self.isLoading = false
        }
    }

    // MARK: - Derived State

    public var effectiveLanguage: AppLanguage {
        Strings.resolveEffectiveLanguage(preferences.languagePreference)
    }

    public var strings: Strings {
        Strings.forLanguage(effectiveLanguage)
    }

    public var appLocale: Locale {
        switch preferences.languagePreference {
        case .system: return .autoupdatingCurrent
        case .de: return Locale(identifier: "de_DE")
        case .en: return Locale(identifier: "en_GB")
        }
    }

    public var preferredColorScheme: ColorScheme? {
        switch preferences.themeMode {
        case .system: return nil
        case .light: return .light
        case .dark: return .dark
        }
    }

    public var todayWeekday: String {
        DateUtils.getInitialWeekdayString(skipWeekends: preferences.skipWeekends)
    }

    public var resolvedCanteenId: String {
        guard !canteens.isEmpty else { return preferences.selectedCanteenId }
        if canteens.contains(where: { $0.id == preferences.selectedCanteenId }) {
            return preferences.selectedCanteenId
        }
        return canteens[0].id
    }

    public var selectedCanteen: Canteen? {
        canteens.first(where: { $0.id == resolvedCanteenId })
    }

    public var favoriteIds: Set<String> {
        Set(favorites.keys)
    }

    // MARK: - Actions

    public func startInitialLoadIfNeeded() async {
        await loadMealPlan(forceRefresh: false)
    }

    public func setDate(_ nextDate: String) {
        Haptics.selection()
        date = nextDate
        activePlanTask?.cancel()
        activePlanTask = Task {
            await loadMealPlan(forceRefresh: false)
        }
    }

    public func shiftDate(_ weekdayDelta: Int) {
        let next = DateUtils.shiftWeekdayDate(date, dayDelta: weekdayDelta, skipWeekends: preferences.skipWeekends)
        setDate(next)
    }

    public func goToToday() {
        setDate(todayWeekday)
    }

    public func setSelectedCanteenId(_ id: String) {
        Haptics.selection()
        updatePreferences { $0.selectedCanteenId = id }
    }

    public func setPriceMode(_ tier: PriceTier) {
        Haptics.selection()
        updatePreferences { $0.priceMode = tier }
    }

    public func setThemeMode(_ mode: ThemePreference) {
        Haptics.selection()
        updatePreferences { $0.themeMode = mode }
    }

    public func setLanguagePreference(_ lang: LanguagePreference) {
        Haptics.selection()
        updatePreferences { $0.languagePreference = lang }
    }

    public func setSkipWeekends(_ skip: Bool) {
        Haptics.selection()
        updatePreferences { $0.skipWeekends = skip }
    }

    public func setCustomAPIURL(_ url: String?) {
        let trimmed = url?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        updatePreferences { $0.customApiUrl = trimmed.isEmpty ? nil : trimmed }
        activePlanTask?.cancel()
        activePlanTask = Task {
            await loadMealPlan(forceRefresh: true)
        }
    }

    public func setDetailSectionVisible(_ section: MealDetailSectionKey, visible: Bool) {
        Haptics.selection()
        updatePreferences { $0.detailSections[section] = visible }
    }

    public func moveDetailSections(from source: IndexSet, to destination: Int) {
        Haptics.selection()
        updatePreferences { prefs in
            var order = prefs.detailSectionOrder
            let moving = source.sorted().compactMap { $0 < order.count ? order[$0] : nil }
            for idx in source.sorted(by: >) where idx < order.count {
                order.remove(at: idx)
            }
            let removedBeforeDest = source.filter { $0 < destination }.count
            let insertAt = max(0, min(order.count, destination - removedBeforeDest))
            order.insert(contentsOf: moving, at: insertAt)
            prefs.detailSectionOrder = order
        }
    }

    public func resetDetailLayout() {
        Haptics.selection()
        updatePreferences { prefs in
            prefs.detailSections = UserPreferences.defaultSections
            prefs.detailSectionOrder = MealDetailSectionKey.defaultOrder
        }
    }

    public func toggleFilter(_ key: FilterKey) {
        Haptics.selection()
        activeFilters.toggle(key)
    }

    public func toggleFavorite(meal: Meal) {
        Haptics.lightImpact()
        if favorites[meal.id] != nil {
            favorites.removeValue(forKey: meal.id)
        } else {
            let urls = MealUtils.sortedImageURLs(for: meal)
            favorites[meal.id] = FavoriteSnapshot(
                id: meal.id,
                name: meal.name,
                mealType: meal.mealType,
                lastSeenDate: date,
                imageUrl: urls.first
            )
        }
        PersistenceService.saveFavorites(favorites)
    }

    public func removeFavorite(id: String) {
        Haptics.lightImpact()
        guard favorites.removeValue(forKey: id) != nil else { return }
        PersistenceService.saveFavorites(favorites)
    }

    public func refreshPlan() async {
        isRefreshing = true
        defer { isRefreshing = false }
        await loadMealPlan(forceRefresh: true)
        if errorMessage == nil {
            Haptics.notifySuccess()
        } else {
            Haptics.notifyError()
        }
    }

    public func clearOfflineCache() async {
        mealPlanCache.removeAll()
        mealDetailsCache.removeAll()
        PersistenceService.clearMealPlanCache()
        await ImageDiskCache.shared.clearAll()
        Haptics.notifySuccess()
        await loadMealPlan(forceRefresh: true)
    }

    public func cachedMeal(id: String, lineId: String) -> (meal: Meal, lineName: String, canteenName: String)? {
        for canteen in canteens {
            for line in canteen.lines {
                if !lineId.isEmpty && line.id != lineId {
                    continue
                }
                if let match = line.meals?.first(where: { $0.id == id }) {
                    return (match, line.name, canteen.name)
                }
            }
        }
        return nil
    }

    public func cachedOrLoadedDetail(mealId: String, lineId: String, date: String) -> Meal? {
        mealDetailsCache["\(mealId)|\(lineId)|\(date)"]
    }

    public func loadMealDetail(mealId: String, lineId: String, date: String) async throws -> Meal? {
        let key = "\(mealId)|\(lineId)|\(date)"
        if let existing = mealDetailsCache[key] {
            return existing
        }
        let fetched = try await GraphQLClient.fetchMealDetail(
            date: date,
            mealId: mealId,
            lineId: lineId,
            customAPIURL: preferences.customApiUrl,
            authHeader: authHeader
        )
        if let fetched {
            mealDetailsCache[key] = fetched
        }
        return fetched
    }

    // MARK: - Private Helpers

    private func loadMealPlan(forceRefresh: Bool) async {
        let targetDate = date
        let key = cacheKey(for: targetDate)

        if let cached = mealPlanCache[key] {
            canteens = Self.cleanCanteens(cached.canteens)
            dataUpdatedAt = cached.updatedAt
            isLoading = false
            if !forceRefresh, Date().timeIntervalSince(cached.updatedAt) < 5 * 60 {
                errorMessage = nil
                return
            }
        } else {
            isLoading = canteens.isEmpty
        }

        errorMessage = nil

        do {
            let fetched = try await GraphQLClient.fetchMealPlan(
                date: targetDate,
                forceRefresh: forceRefresh,
                customAPIURL: preferences.customApiUrl,
                authHeader: authHeader
            )
            guard !Task.isCancelled, targetDate == date else { return }

            let cleaned = Self.cleanCanteens(fetched)
            let now = Date()
            canteens = cleaned
            dataUpdatedAt = now
            errorMessage = nil
            isLoading = false

            mealPlanCache[key] = CachedMealPlanEntry(canteens: cleaned, updatedAt: now)
            PersistenceService.saveMealPlanCache(mealPlanCache)
        } catch {
            guard !Task.isCancelled, targetDate == date else { return }
            isLoading = false
            errorMessage = error.localizedDescription
        }
    }

    private func updatePreferences(_ mutate: (inout UserPreferences) -> Void) {
        mutate(&preferences)
        PersistenceService.savePreferences(preferences)
    }

    private func cacheKey(for dateStr: String) -> String {
        "\(dateStr)|\(preferences.customApiUrl ?? "default")"
    }

    private static func cleanCanteens(_ raw: [Canteen]) -> [Canteen] {
        raw.map { canteen in
            Canteen(
                id: canteen.id,
                name: canteen.name,
                lines: canteen.lines.map { line in
                    Line(
                        id: line.id,
                        name: MealUtils.cleanLineName(line.name),
                        meals: line.meals
                    )
                }
            )
        }
    }
}
