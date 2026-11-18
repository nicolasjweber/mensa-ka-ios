import SwiftUI

public struct MealTypeBadge: View {
    public let mealType: FoodType
    public let language: AppLanguage
    public var compact: Bool = false

    public init(mealType: FoodType, language: AppLanguage, compact: Bool = false) {
        self.mealType = mealType
        self.language = language
        self.compact = compact
    }

    public var body: some View {
        if mealType != .unknown, let colors = ThemePalette.mealTypeColors(mealType) {
            let label = Strings.forLanguage(language).mealTypeLabel(mealType, compact: compact)
            HStack(spacing: 5) {
                Image(systemName: MealUtils.mealTypeSymbol(mealType))
                    .font(.system(size: 11, weight: .semibold))
                Text(label)
                    .font(.system(size: 12, weight: .bold))
                    .lineLimit(1)
            }
            .foregroundStyle(colors.fg)
            .padding(.horizontal, Spacing.sm)
            .padding(.vertical, 4)
            .background(Capsule().fill(colors.bg))
            .fixedSize(horizontal: true, vertical: false)
        }
    }
}
