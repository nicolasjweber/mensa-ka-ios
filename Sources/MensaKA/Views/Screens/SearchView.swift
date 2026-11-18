import SwiftUI
#if canImport(UIKit)
import UIKit
#endif

public struct SearchView: View {
    @Environment(MensaStore.self) private var store
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass

    @Binding public var query: String

    public init(query: Binding<String>) {
        self._query = query
    }

    private var isPad: Bool {
        UIDevice.current.userInterfaceIdiom == .pad
    }

    private var isWide: Bool {
        horizontalSizeClass == .regular
    }

    public var body: some View {
        let s = store.strings
        let lang = store.effectiveLanguage
        let selectedCanteen = store.selectedCanteen
        let trimmed = query.trimmingCharacters(in: .whitespacesAndNewlines)
        let columns = isWide
            ? [GridItem(.flexible(), spacing: Spacing.md), GridItem(.flexible(), spacing: Spacing.md)]
            : [GridItem(.flexible())]

        let sections: [(line: Line, meals: [Meal])] = (selectedCanteen?.lines ?? []).compactMap { line in
            let matches = MealUtils.filterLineMeals(
                line,
                filters: store.activeFilters,
                favoriteIds: store.favoriteIds,
                query: trimmed
            )
            return matches.isEmpty ? nil : (line, matches)
        }

        ScrollView {
            VStack(alignment: .leading, spacing: Spacing.md) {
                Text(
                    selectedCanteen.map {
                        s.subtitleWithCanteen($0.name, DateUtils.formatDateHeader(store.date, language: lang))
                    } ?? s.subtitleFallback(DateUtils.formatDateHeader(store.date, language: lang))
                )
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(ThemePalette.muted)

                if sections.isEmpty {
                    VStack(spacing: Spacing.sm) {
                        Image(systemName: "magnifyingglass")
                            .font(.system(size: 30))
                            .foregroundStyle(ThemePalette.muted)
                        Text(
                            trimmed.isEmpty
                                ? s.searchNoMeals(canteenName: selectedCanteen?.name)
                                : s.searchNoMatches(trimmed, canteenName: selectedCanteen?.name)
                        )
                        .font(.system(size: 15, weight: .bold))
                        .foregroundStyle(ThemePalette.text)
                        .multilineTextAlignment(.center)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(Spacing.xl)
                    .background(RoundedRectangle(cornerRadius: Radii.lg).fill(ThemePalette.surface))
                    .overlay(
                        RoundedRectangle(cornerRadius: Radii.lg)
                            .stroke(ThemePalette.border, lineWidth: 1)
                    )
                    .padding(.top, Spacing.md)
                } else {
                    LazyVStack(alignment: .leading, spacing: Spacing.lg) {
                        ForEach(sections, id: \.line.id) { section in
                            VStack(alignment: .leading, spacing: Spacing.xs) {
                                Text(section.line.name)
                                    .font(.system(size: 13, weight: .heavy))
                                    .foregroundStyle(ThemePalette.brandDeep)
                                    .padding(.top, Spacing.xs)

                                LazyVGrid(columns: columns, spacing: Spacing.sm) {
                                    ForEach(section.meals) { meal in
                                        MealCardView(
                                            meal: meal,
                                            lineId: section.line.id,
                                            lineName: section.line.name,
                                            canteenName: selectedCanteen?.name
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
            .frame(maxWidth: 1040)
            .padding(.horizontal, Spacing.lg)
            .padding(.top, Spacing.xs)
            .padding(.bottom, Spacing.xl * 2)
            .frame(maxWidth: .infinity)
        }
        .scrollDismissesKeyboard(.interactively)
        .background(ThemePalette.canvas.ignoresSafeArea())
        .navigationTitle(s.searchTitle)
        .navigationBarTitleDisplayMode(isPad ? .inline : .large)
        .searchable(
            text: $query,
            placement: .navigationBarDrawer(displayMode: .always),
            prompt: s.searchPlaceholder
        )
    }
}
