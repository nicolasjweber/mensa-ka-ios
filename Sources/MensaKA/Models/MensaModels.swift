import Foundation

public enum FoodType: String, Codable, Hashable, Sendable, CaseIterable {
    case vegan = "VEGAN"
    case vegetarian = "VEGETARIAN"
    case beef = "BEEF"
    case beefAW = "BEEF_AW"
    case pork = "PORK"
    case porkAW = "PORK_AW"
    case poultry = "POULTRY"
    case fish = "FISH"
    case unknown = "UNKNOWN"

    public init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        let raw = (try? container.decode(String.self)) ?? ""
        self = FoodType(rawValue: raw) ?? .unknown
    }
}

public enum PriceTier: String, Codable, Hashable, Sendable, CaseIterable, Identifiable {
    case student
    case employee
    case pupil
    case guest

    public var id: String { rawValue }
}

public struct Price: Codable, Hashable, Sendable {
    public let student: Int
    public let employee: Int
    public let pupil: Int
    public let guest: Int

    public init(student: Int = 0, employee: Int = 0, pupil: Int = 0, guest: Int = 0) {
        self.student = student
        self.employee = employee
        self.pupil = pupil
        self.guest = guest
    }

    public func value(for tier: PriceTier) -> Int {
        switch tier {
        case .student: return student
        case .employee: return employee
        case .pupil: return pupil
        case .guest: return guest
        }
    }
}

public struct MealImage: Codable, Hashable, Sendable {
    public let id: String?
    public let url: String
    public let rank: Double

    public init(id: String? = nil, url: String, rank: Double) {
        self.id = id
        self.url = url
        self.rank = rank
    }
}

public struct Ratings: Codable, Hashable, Sendable {
    public let averageRating: Double
    public let ratingsCount: Int
    public let personalRating: Double?

    public init(averageRating: Double = 0, ratingsCount: Int = 0, personalRating: Double? = nil) {
        self.averageRating = averageRating
        self.ratingsCount = ratingsCount
        self.personalRating = personalRating
    }
}

public struct MealStatistics: Codable, Hashable, Sendable {
    public let lastServed: String?
    public let nextServed: String?
    public let frequency: Int
    public let isNew: Bool

    enum CodingKeys: String, CodingKey {
        case lastServed
        case nextServed
        case frequency
        case isNew = "new"
    }
}

public struct EnvironmentInfo: Codable, Hashable, Sendable {
    public let averageRating: Double
    public let co2Rating: Int
    public let co2Value: Double
    public let waterRating: Int
    public let waterValue: Double
    public let animalWelfareRating: Int
    public let rainforestRating: Int
    public let maxRating: Int
}

public struct NutritionData: Codable, Hashable, Sendable {
    public let energy: Double
    public let protein: Double
    public let carbohydrates: Double
    public let sugar: Double
    public let fat: Double
    public let saturatedFat: Double
    public let salt: Double
}

public struct Side: Identifiable, Codable, Hashable, Sendable {
    public let id: String
    public let name: String
    public let mealType: FoodType
    public let price: Price
    public let allergens: [String]
    public let additives: [String]
}

public struct Meal: Identifiable, Codable, Hashable, Sendable {
    public let id: String
    public let name: String
    public let mealType: FoodType
    public let images: [MealImage]
    public let ratings: Ratings
    public let price: Price
    public let allergens: [String]?
    public let additives: [String]?
    public let statistics: MealStatistics?
    public let environmentInfo: EnvironmentInfo?
    public let nutritionData: NutritionData?
    public let sides: [Side]?
}

public struct Line: Identifiable, Codable, Hashable, Sendable {
    public let id: String
    public let name: String
    public let meals: [Meal]?
}

public struct Canteen: Identifiable, Codable, Hashable, Sendable {
    public let id: String
    public let name: String
    public let lines: [Line]
}

public struct ActiveFilters: Equatable, Sendable {
    public var vegan: Bool = false
    public var vegetarian: Bool = false
    public var favoritesOnly: Bool = false

    public mutating func toggle(_ key: FilterKey) {
        switch key {
        case .vegan: vegan.toggle()
        case .vegetarian: vegetarian.toggle()
        case .favoritesOnly: favoritesOnly.toggle()
        }
    }

    public func isActive(_ key: FilterKey) -> Bool {
        switch key {
        case .vegan: return vegan
        case .vegetarian: return vegetarian
        case .favoritesOnly: return favoritesOnly
        }
    }
}

public enum FilterKey: String, CaseIterable, Identifiable, Sendable {
    case vegan
    case vegetarian
    case favoritesOnly

    public var id: String { rawValue }
}

public enum ThemePreference: String, Codable, CaseIterable, Identifiable, Sendable {
    case system
    case light
    case dark

    public var id: String { rawValue }
}

public enum AppLanguage: String, Codable, Sendable {
    case en
    case de
}

public enum LanguagePreference: String, Codable, CaseIterable, Identifiable, Sendable {
    case system
    case de
    case en

    public var id: String { rawValue }
}

public struct FavoriteSnapshot: Identifiable, Codable, Hashable, Sendable {
    public let id: String
    public let name: String
    public let mealType: FoodType
    public let lastSeenDate: String
    public let imageUrl: String?
}

public enum MealDetailSectionKey: String, Codable, Hashable, CaseIterable, Identifiable, Sendable {
    case prices
    case nutrition
    case sides
    case allergens
    case environment
    case statistics

    public var id: String { rawValue }

    public static let defaultOrder: [MealDetailSectionKey] = [
        .prices, .nutrition, .sides, .allergens, .environment, .statistics,
    ]

    public var systemImage: String {
        switch self {
        case .prices: return "eurosign.circle"
        case .nutrition: return "chart.bar"
        case .sides: return "fork.knife"
        case .allergens: return "exclamationmark.triangle"
        case .environment: return "leaf"
        case .statistics: return "clock.arrow.circlepath"
        }
    }
}

public struct UserPreferences: Codable, Equatable, Sendable {
    public var selectedCanteenId: String
    public var priceMode: PriceTier
    public var themeMode: ThemePreference
    public var languagePreference: LanguagePreference
    public var skipWeekends: Bool
    public var customApiUrl: String?
    public var detailSections: [MealDetailSectionKey: Bool]
    public var detailSectionOrder: [MealDetailSectionKey]

    public static let defaultSections: [MealDetailSectionKey: Bool] = Dictionary(
        uniqueKeysWithValues: MealDetailSectionKey.defaultOrder.map { ($0, true) }
    )

    public static let defaults = UserPreferences(
        selectedCanteenId: "",
        priceMode: .student,
        themeMode: .system,
        languagePreference: .system,
        skipWeekends: true,
        customApiUrl: nil,
        detailSections: defaultSections,
        detailSectionOrder: MealDetailSectionKey.defaultOrder
    )

    public init(
        selectedCanteenId: String = "",
        priceMode: PriceTier = .student,
        themeMode: ThemePreference = .system,
        languagePreference: LanguagePreference = .system,
        skipWeekends: Bool = true,
        customApiUrl: String? = nil,
        detailSections: [MealDetailSectionKey: Bool] = defaultSections,
        detailSectionOrder: [MealDetailSectionKey] = MealDetailSectionKey.defaultOrder
    ) {
        self.selectedCanteenId = selectedCanteenId
        self.priceMode = priceMode
        self.themeMode = themeMode
        self.languagePreference = languagePreference
        self.skipWeekends = skipWeekends
        self.customApiUrl = customApiUrl
        self.detailSections = detailSections
        self.detailSectionOrder = detailSectionOrder
    }

    public func isSectionVisible(_ key: MealDetailSectionKey) -> Bool {
        detailSections[key] ?? true
    }

    public mutating func normalizeDetailSections() {
        for key in MealDetailSectionKey.defaultOrder where detailSections[key] == nil {
            detailSections[key] = true
        }
        var seen = Set<MealDetailSectionKey>()
        var normalized: [MealDetailSectionKey] = []
        for key in detailSectionOrder where seen.insert(key).inserted {
            normalized.append(key)
        }
        for key in MealDetailSectionKey.defaultOrder where seen.insert(key).inserted {
            normalized.append(key)
        }
        detailSectionOrder = normalized
    }
}

public struct MealDetailRoute: Hashable, Sendable {
    public let mealId: String
    public let lineId: String
    public let date: String
    public let initialMeal: Meal?
    public let canteenName: String?
    public let lineName: String?
    public let transitionID: String

    public init(
        mealId: String,
        lineId: String,
        date: String,
        initialMeal: Meal? = nil,
        canteenName: String? = nil,
        lineName: String? = nil,
        transitionID: String = ""
    ) {
        self.mealId = mealId
        self.lineId = lineId
        self.date = date
        self.initialMeal = initialMeal
        self.canteenName = canteenName
        self.lineName = lineName
        self.transitionID = transitionID.isEmpty ? "\(mealId)-\(lineId)" : transitionID
    }
}

public struct LightboxPayload: Identifiable, Hashable, Sendable {
    public let id = UUID()
    public let urls: [String]
    public let initialIndex: Int
    public let title: String
    public let lineName: String
    public let transitionID: String?

    public init(
        urls: [String],
        initialIndex: Int,
        title: String,
        lineName: String,
        transitionID: String? = nil
    ) {
        self.urls = urls
        self.initialIndex = initialIndex
        self.title = title
        self.lineName = lineName
        self.transitionID = transitionID
    }
}
