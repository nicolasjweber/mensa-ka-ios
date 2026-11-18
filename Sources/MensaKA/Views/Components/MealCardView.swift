import SwiftUI

public struct MealCardView: View {
    @Environment(MensaStore.self) private var store
    @Environment(\.lightboxNamespace) private var lightboxNamespace
    @Environment(\.navZoomNamespace) private var navZoomNamespace

    public let meal: Meal
    public let lineId: String
    public var lineName: String?
    public var canteenName: String?
    public var subtitle: String?
    public var sourcePrefix: String = "menu"

    public init(
        meal: Meal,
        lineId: String,
        lineName: String? = nil,
        canteenName: String? = nil,
        subtitle: String? = nil,
        sourcePrefix: String = "menu"
    ) {
        self.meal = meal
        self.lineId = lineId
        self.lineName = lineName
        self.canteenName = canteenName
        self.subtitle = subtitle
        self.sourcePrefix = sourcePrefix
    }

    public var body: some View {
        let s = store.strings
        let lang = store.effectiveLanguage
        let isFavorite = store.favoriteIds.contains(meal.id)
        let selectedPrice = meal.price.value(for: store.preferences.priceMode)
        let imageURLs = MealUtils.sortedImageURLs(for: meal)
        let showImage = !imageURLs.isEmpty && selectedPrice != 0
        let rating = FormatUtils.formatRatingLabel(meal.ratings, language: lang)

        let cardSourceID = "\(sourcePrefix)-card-\(meal.id)-\(lineId)"
        let photoSourceID = "\(sourcePrefix)-photo-\(meal.id)-\(lineId)"

        let route = MealDetailRoute(
            mealId: meal.id,
            lineId: lineId,
            date: store.date,
            initialMeal: meal,
            canteenName: canteenName,
            lineName: lineName,
            transitionID: cardSourceID
        )

        HStack(alignment: .top, spacing: Spacing.md) {
            if showImage, let primaryURL = imageURLs.first {
                Button {
                    store.lightboxPayload = LightboxPayload(
                        urls: imageURLs,
                        initialIndex: 0,
                        title: meal.name,
                        lineName: lineName ?? "",
                        transitionID: photoSourceID
                    )
                } label: {
                    CachedMealImage(urlString: primaryURL, contentMode: .fill)
                        .frame(width: 92, height: 92)
                        .clipped()
                        .background(ThemePalette.surfaceSoft)
                        .clipShape(ConcentricRectangle(corners: .concentric(minimum: 10)))
                }
                .buttonStyle(.plain)
                .optionalMatchedTransitionSource(id: photoSourceID, in: lightboxNamespace)
                .accessibilityLabel("\(s.mealPhoto): \(meal.name)")
            }

            VStack(alignment: .leading, spacing: Spacing.sm) {
                HStack(alignment: .top, spacing: Spacing.sm) {
                    NavigationLink(value: route) {
                        VStack(alignment: .leading, spacing: 2) {
                            if let subtitle, !subtitle.isEmpty {
                                Text(subtitle)
                                    .font(.system(size: 11, weight: .semibold))
                                    .foregroundStyle(ThemePalette.muted)
                                    .lineLimit(1)
                            }
                            Text(meal.name)
                                .font(.system(size: 15, weight: .bold))
                                .foregroundStyle(ThemePalette.text)
                                .lineSpacing(2)
                                .lineLimit(3)
                                .multilineTextAlignment(.leading)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    .buttonStyle(.plain)

                    Button {
                        store.toggleFavorite(meal: meal)
                    } label: {
                        Image(systemName: isFavorite ? "heart.fill" : "heart")
                            .font(.system(size: 18, weight: .semibold))
                            .foregroundStyle(isFavorite ? ThemePalette.favorite : ThemePalette.muted)
                            .padding(2)
                            .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("\(s.tabFavorites): \(meal.name)")
                }

                Spacer(minLength: 0)

                NavigationLink(value: route) {
                    HStack(alignment: .center, spacing: Spacing.sm) {
                        MealTypeBadge(mealType: meal.mealType, language: lang)

                        HStack(spacing: 4) {
                            if rating.hasRatings {
                                Image(systemName: "star.fill")
                                    .font(.system(size: 12))
                                    .foregroundStyle(ThemePalette.starColor)
                            }
                            Text(rating.label)
                                .font(.system(size: 12, weight: .semibold))
                                .foregroundStyle(ThemePalette.muted)
                                .lineLimit(1)
                        }

                        Spacer(minLength: 4)

                        Text(FormatUtils.formatEuroPrice(selectedPrice, language: lang))
                            .font(.system(size: 13, weight: .heavy))
                            .monospacedDigit()
                            .foregroundStyle(ThemePalette.brandDeep)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 4)
                            .background(RoundedRectangle(cornerRadius: Radii.sm, style: .continuous).fill(ThemePalette.brandSoft))
                    }
                }
                .buttonStyle(.plain)
            }
            .frame(maxWidth: .infinity, minHeight: showImage ? 92 : nil, alignment: .topLeading)
        }
        .padding(Spacing.md)
        .frame(maxHeight: .infinity, alignment: .top)
        .containerShape(RoundedRectangle(cornerRadius: Radii.lg, style: .continuous))
        .background(RoundedRectangle(cornerRadius: Radii.lg, style: .continuous).fill(ThemePalette.surface))
        .overlay(
            RoundedRectangle(cornerRadius: Radii.lg, style: .continuous)
                .stroke(ThemePalette.border, lineWidth: 1)
        )
        .shadow(color: .black.opacity(0.04), radius: 8, y: 2)
        .optionalMatchedTransitionSource(id: cardSourceID, in: navZoomNamespace)
    }
}
