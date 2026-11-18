import SwiftUI
#if canImport(UIKit)
import UIKit
#endif

public struct FavoritesView: View {
    @Environment(MensaStore.self) private var store
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass

    public init() {}

    private var isPad: Bool {
        UIDevice.current.userInterfaceIdiom == .pad
    }

    private var isWide: Bool {
        horizontalSizeClass == .regular
    }

    private struct LiveFavorite: Identifiable {
        let id: String
        let meal: Meal
        let lineId: String
        let lineName: String
        let canteenName: String
        let subtitle: String
    }

    public var body: some View {
        let s = store.strings
        let lang = store.effectiveLanguage
        let columns = isWide
            ? [GridItem(.flexible(), spacing: Spacing.md), GridItem(.flexible(), spacing: Spacing.md)]
            : [GridItem(.flexible())]

        let orderedCanteens: [Canteen] = {
            if let selected = store.selectedCanteen {
                return [selected] + store.canteens.filter { $0.id != selected.id }
            }
            return store.canteens
        }()

        var liveItems: [LiveFavorite] = []
        var matchedIds = Set<String>()
        for canteen in orderedCanteens {
            for line in canteen.lines {
                for meal in line.meals ?? [] where store.favoriteIds.contains(meal.id) {
                    if matchedIds.insert(meal.id).inserted {
                        liveItems.append(
                            LiveFavorite(
                                id: meal.id,
                                meal: meal,
                                lineId: line.id,
                                lineName: line.name,
                                canteenName: canteen.name,
                                subtitle: "\(canteen.name) · \(line.name)"
                            )
                        )
                    }
                }
            }
        }

        let snapshots = store.favorites.values
            .filter { !matchedIds.contains($0.id) }
            .sorted { $0.name.localizedCaseInsensitiveCompare($1.name) == .orderedAscending }

        ScrollView {
            VStack(alignment: .leading, spacing: Spacing.lg) {
                if liveItems.isEmpty && snapshots.isEmpty {
                    VStack(spacing: Spacing.sm) {
                        Image(systemName: "heart.slash")
                            .font(.system(size: 34))
                            .foregroundStyle(ThemePalette.muted)
                        Text(s.favoritesEmptyTitle)
                            .font(.system(size: 17, weight: .heavy))
                            .foregroundStyle(ThemePalette.text)
                        Text(s.favoritesEmptyBody)
                            .font(.system(size: 14))
                            .foregroundStyle(ThemePalette.muted)
                            .multilineTextAlignment(.center)
                            .lineSpacing(3)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(Spacing.xl)
                    .background(RoundedRectangle(cornerRadius: Radii.lg).fill(ThemePalette.surface))
                    .overlay(
                        RoundedRectangle(cornerRadius: Radii.lg)
                            .stroke(ThemePalette.border, lineWidth: 1)
                    )
                    .padding(.top, Spacing.xl)
                } else {
                    if !liveItems.isEmpty {
                        VStack(alignment: .leading, spacing: Spacing.sm) {
                            sectionTitle(s.servedOn(DateUtils.formatDateHeader(store.date, language: lang)))
                            LazyVGrid(columns: columns, spacing: Spacing.sm) {
                                ForEach(liveItems) { item in
                                    MealCardView(
                                        meal: item.meal,
                                        lineId: item.lineId,
                                        lineName: item.lineName,
                                        canteenName: item.canteenName,
                                        subtitle: item.subtitle
                                    )
                                }
                            }
                        }
                    }

                    if !snapshots.isEmpty {
                        VStack(alignment: .leading, spacing: Spacing.sm) {
                            sectionTitle(s.savedOtherDays)
                            LazyVGrid(columns: columns, spacing: Spacing.sm) {
                                ForEach(snapshots) { snap in
                                    snapshotCard(snap, s: s, lang: lang)
                                }
                            }
                        }
                    }
                }
            }
            .frame(maxWidth: 1040)
            .padding(.horizontal, Spacing.lg)
            .padding(.top, Spacing.md)
            .padding(.bottom, Spacing.xl * 2)
            .frame(maxWidth: .infinity)
        }
        .background(ThemePalette.canvas.ignoresSafeArea())
        .navigationTitle(s.favoritesTitle)
        .navigationBarTitleDisplayMode(isPad ? .inline : .large)
    }

    private func sectionTitle(_ title: String) -> some View {
        Text(title)
            .font(.system(size: 13, weight: .bold))
            .textCase(.uppercase)
            .tracking(0.4)
            .foregroundStyle(ThemePalette.muted)
            .padding(.top, Spacing.xs)
    }

    private func snapshotCard(_ snapshot: FavoriteSnapshot, s: Strings, lang: AppLanguage) -> some View {
        HStack(spacing: Spacing.md) {
            if let url = snapshot.imageUrl, !url.isEmpty {
                CachedMealImage(urlString: url, contentMode: .fill)
                    .frame(width: 64, height: 64)
                    .background(ThemePalette.surfaceSoft)
                    .clipShape(RoundedRectangle(cornerRadius: Radii.sm))
            }

            VStack(alignment: .leading, spacing: Spacing.xs) {
                Text(snapshot.name)
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(ThemePalette.text)
                    .lineLimit(2)

                HStack(spacing: Spacing.sm) {
                    MealTypeBadge(mealType: snapshot.mealType, language: lang)
                    Text(s.lastSeen(DateUtils.formatDateHeader(snapshot.lastSeenDate, language: lang)))
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(ThemePalette.muted)
                        .lineLimit(1)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            Button {
                store.removeFavorite(id: snapshot.id)
            } label: {
                Image(systemName: "heart.fill")
                    .font(.system(size: 19))
                    .foregroundStyle(ThemePalette.favorite)
                    .padding(4)
            }
            .buttonStyle(.plain)
            .accessibilityLabel("\(s.tabFavorites): \(snapshot.name)")
        }
        .padding(Spacing.md)
        .background(RoundedRectangle(cornerRadius: Radii.md).fill(ThemePalette.surface))
        .overlay(
            RoundedRectangle(cornerRadius: Radii.md)
                .stroke(ThemePalette.border, lineWidth: 1)
        )
    }
}
