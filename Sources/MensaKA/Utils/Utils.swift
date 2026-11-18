import Foundation
#if canImport(UIKit)
import UIKit
#endif

public enum FormatUtils {
    public static func formatEuroPrice(_ cents: Int?, language: AppLanguage) -> String {
        guard let cents else { return "-" }
        let euros = Double(cents) / 100.0
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "EUR"
        formatter.locale = Locale(identifier: language == .de ? "de_DE" : "en_GB")
        if let formatted = formatter.string(from: NSNumber(value: euros)) {
            return formatted
        }
        let num = String(format: "%.2f", euros)
        return language == .de ? "\(num.replacingOccurrences(of: ".", with: ",")) €" : "€\(num)"
    }

    public static func formatRatingLabel(
        _ ratings: Ratings?,
        language: AppLanguage
    ) -> (hasRatings: Bool, label: String, clampedAverage: Double) {
        let s = Strings.forLanguage(language)
        guard let ratings, ratings.ratingsCount > 0 else {
            return (false, s.noRatings, 0)
        }
        let clamped = min(5.0, max(0.0, ratings.averageRating))
        var avgText = String(format: "%.1f", clamped)
        if language == .de {
            avgText = avgText.replacingOccurrences(of: ".", with: ",")
        }
        return (true, "\(avgText)/5 (\(ratings.ratingsCount))", clamped)
    }

    public static func formatDecimal(_ value: Double, fractionDigits: Int = 1, language: AppLanguage) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        formatter.minimumFractionDigits = fractionDigits
        formatter.maximumFractionDigits = fractionDigits
        formatter.locale = Locale(identifier: language == .de ? "de_DE" : "en_US")
        return formatter.string(from: NSNumber(value: value)) ?? String(format: "%.\(fractionDigits)f", value)
    }

    public static func formatNutritionAmount(_ value: Double, unit: String, language: AppLanguage) -> String {
        if abs(value.rounded() - value) < 0.001 {
            return "\(Int(value.rounded())) \(unit)"
        }
        return "\(formatDecimal(value, fractionDigits: 1, language: language)) \(unit)"
    }
}

public enum MealUtils {
    public static func mealTypeSymbol(_ foodType: FoodType) -> String {
        switch foodType {
        case .vegan: return "leaf.fill"
        case .vegetarian: return "carrot.fill"
        case .fish: return "fish.fill"
        default: return "fork.knife"
        }
    }

    public static func sortedImageURLs(for meal: Meal) -> [String] {
        guard !meal.images.isEmpty else { return [] }
        let visible = meal.images.filter { $0.downvotes <= $0.upvotes }
        let sorted = visible.sorted { $0.rank > $1.rank }
        var seen = Set<String>()
        var result: [String] = []
        for entry in sorted where !entry.url.isEmpty {
            if seen.insert(entry.url).inserted {
                result.append(entry.url)
            }
        }
        return result
    }

    public static func filterMeals(
        _ meals: [Meal],
        filters: ActiveFilters,
        favoriteIds: Set<String>
    ) -> [Meal] {
        meals.filter { meal in
            if filters.favoritesOnly && !favoriteIds.contains(meal.id) {
                return false
            }
            if filters.vegan && meal.mealType != .vegan {
                return false
            }
            if filters.vegetarian && meal.mealType != .vegan && meal.mealType != .vegetarian {
                return false
            }
            return true
        }
    }

    public static func filterLineMeals(
        _ line: Line,
        filters: ActiveFilters,
        favoriteIds: Set<String>,
        query: String = ""
    ) -> [Meal] {
        let base = filterMeals(line.meals ?? [], filters: filters, favoriteIds: favoriteIds)
        let normalized = query.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        guard !normalized.isEmpty else { return base }
        if line.name.lowercased().contains(normalized) {
            return base
        }
        return base.filter { $0.name.lowercased().contains(normalized) }
    }

    private static let lineHoursRegex: NSRegularExpression? = try? NSRegularExpression(
        pattern: #"\s*(?:[,·]\s*)?(?:\(\s*11(?:[:.]00)?\s*[-–—]\s*14(?:[:.]00)?\s*Uhr\s*\)|\b11(?:[:.]00)?\s*[-–—]\s*14(?:[:.]00)?\s*Uhr\b)"#,
        options: [.caseInsensitive]
    )

    public static func cleanLineName(_ name: String) -> String {
        guard let regex = lineHoursRegex else { return name }
        let range = NSRange(name.startIndex..., in: name)
        let stripped = regex.stringByReplacingMatches(in: name, range: range, withTemplate: " ")
        if stripped == name {
            return name
        }
        let collapsed = stripped.replacingOccurrences(of: #"\s{2,}"#, with: " ", options: .regularExpression)
        let trimChars = CharacterSet.whitespacesAndNewlines.union(CharacterSet(charactersIn: ",·-–—"))
        let normalized = collapsed.trimmingCharacters(in: trimChars)
        return normalized.isEmpty ? name.trimmingCharacters(in: .whitespacesAndNewlines) : normalized
    }
}

@MainActor
public enum Haptics {
    public static func selection() {
        #if canImport(UIKit)
        UISelectionFeedbackGenerator().selectionChanged()
        #endif
    }

    public static func lightImpact() {
        #if canImport(UIKit)
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
        #endif
    }

    public static func notifySuccess() {
        #if canImport(UIKit)
        UINotificationFeedbackGenerator().notificationOccurred(.success)
        #endif
    }

    public static func notifyError() {
        #if canImport(UIKit)
        UINotificationFeedbackGenerator().notificationOccurred(.error)
        #endif
    }
}
