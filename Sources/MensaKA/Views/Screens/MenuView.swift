import SwiftUI
#if canImport(UIKit)
import UIKit
#endif

public struct MenuView: View {
    @Environment(MensaStore.self) private var store
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass

    @State private var searchQuery: String = ""

    public init() {}

    private var isPad: Bool {
        UIDevice.current.userInterfaceIdiom == .pad
    }

    private var isWide: Bool {
        horizontalSizeClass == .regular
    }

    public var body: some View {
        let s = store.strings
        let selectedCanteen = store.selectedCanteen
        let screenTitle = selectedCanteen?.name ?? s.defaultMenuTitle
        let activeSearch = isPad ? searchQuery.trimmingCharacters(in: .whitespacesAndNewlines) : ""

        let lineSections: [(line: Line, meals: [Meal])] = (selectedCanteen?.lines ?? []).compactMap { line in
            let filtered = MealUtils.filterLineMeals(
                line,
                filters: store.activeFilters,
                favoriteIds: store.favoriteIds,
                query: activeSearch
            )
            return filtered.isEmpty ? nil : (line, filtered)
        }

        let columns = isWide
            ? [GridItem(.flexible(), spacing: Spacing.md), GridItem(.flexible(), spacing: Spacing.md)]
            : [GridItem(.flexible())]

        ScrollView {
            VStack(alignment: .leading, spacing: Spacing.md) {
                if isPad {
                    canteenTitleMenu(screenTitle: screenTitle, s: s)
                }

                WeekStripView()
                FilterBarView()

                if let errorText = store.errorMessage {
                    statusBannerView(errorText: errorText, s: s)
                }

                if lineSections.isEmpty {
                    if store.isLoading {
                        MealSkeletonView()
                    } else {
                        emptyStateView(
                            symbol: activeSearch.isEmpty ? "fork.knife.circle" : "magnifyingglass",
                            message: store.canteens.isEmpty
                                ? s.menuNoData
                                : (!activeSearch.isEmpty
                                    ? s.searchNoMatches(activeSearch, canteenName: selectedCanteen?.name)
                                    : s.menuNoMatchingMeals)
                        )
                    }
                } else {
                    LazyVStack(alignment: .leading, spacing: Spacing.lg) {
                        ForEach(lineSections, id: \.line.id) { section in
                            VStack(alignment: .leading, spacing: Spacing.sm) {
                                HStack(spacing: Spacing.sm) {
                                    RoundedRectangle(cornerRadius: 2)
                                        .fill(ThemePalette.brand)
                                        .frame(width: 4, height: 18)

                                    Text(section.line.name)
                                        .font(.system(size: 17, weight: .heavy))
                                        .foregroundStyle(ThemePalette.text)
                                        .frame(maxWidth: .infinity, alignment: .leading)

                                    Text("\(section.meals.count) \(section.meals.count == 1 ? s.mealSingular : s.mealPlural)")
                                        .font(.system(size: 12, weight: .bold))
                                        .foregroundStyle(ThemePalette.muted)
                                        .padding(.horizontal, 9)
                                        .padding(.vertical, 3)
                                        .background(Capsule().fill(ThemePalette.surfaceSoft))
                                }
                                .padding(.top, Spacing.xs)

                                LazyVGrid(columns: columns, spacing: Spacing.sm) {
                                    ForEach(section.meals) { meal in
                                        MealCardView(
                                            meal: meal,
                                            lineId: section.line.id,
                                            lineName: section.line.name,
                                            canteenName: selectedCanteen?.name,
                                            sourcePrefix: "menu"
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
            .padding(.top, isPad ? Spacing.xs : Spacing.sm)
            .padding(.bottom, Spacing.xl * 2)
            .frame(maxWidth: .infinity)
        }
        .background(ThemePalette.canvas.ignoresSafeArea())
        .scrollEdgeEffectStyle(.soft, for: .all)
        .refreshable {
            await store.refreshPlan()
        }
        .simultaneousGesture(
            DragGesture(minimumDistance: 36, coordinateSpace: .local)
                .onEnded { value in
                    let dx = value.translation.width
                    let dy = value.translation.height
                    guard abs(dx) > 60 && abs(dx) > abs(dy) * 1.6 else { return }
                    store.shiftDate(dx < 0 ? 1 : -1)
                }
        )
        .navigationTitle(isPad ? "" : screenTitle)
        .navigationBarTitleDisplayMode(isPad ? .inline : .large)
        .toolbar {
            if !isPad {
                ToolbarItem(placement: .largeTitle) {
                    Menu {
                        canteenPickerButtons()
                    } label: {
                        HStack(alignment: .firstTextBaseline, spacing: 6) {
                            Text(screenTitle)
                                .font(.largeTitle.bold())
                                .foregroundStyle(ThemePalette.text)
                                .lineLimit(1)
                                .minimumScaleFactor(0.75)

                            if store.canteens.count > 1 {
                                Image(systemName: "chevron.down")
                                    .font(.system(size: 14, weight: .bold))
                                    .foregroundStyle(ThemePalette.muted)
                            }
                        }
                    }
                    .buttonStyle(.plain)
                    .disabled(store.canteens.isEmpty)
                    .accessibilityLabel("\(s.selectCanteen): \(screenTitle)")
                }

                ToolbarTitleMenu {
                    canteenPickerButtons()
                }
            }
        }
        .applyIf(isPad) { view in
            view.searchable(
                text: $searchQuery,
                placement: .navigationBarDrawer(displayMode: .always),
                prompt: s.searchPlaceholder
            )
        }
    }

    @ViewBuilder
    private func canteenPickerButtons() -> some View {
        ForEach(store.canteens) { canteen in
            Button {
                store.setSelectedCanteenId(canteen.id)
            } label: {
                if canteen.id == store.resolvedCanteenId {
                    Label(canteen.name, systemImage: "checkmark")
                } else {
                    Text(canteen.name)
                }
            }
        }
    }

    @ViewBuilder
    private func canteenTitleMenu(screenTitle: String, s: Strings) -> some View {
        Menu {
            canteenPickerButtons()
        } label: {
            HStack(alignment: .center, spacing: 6) {
                Text(screenTitle)
                    .font(.system(size: 32, weight: .bold))
                    .tracking(-0.5)
                    .foregroundStyle(ThemePalette.text)
                    .lineLimit(2)
                    .multilineTextAlignment(.center)

                if store.canteens.count > 1 {
                    Image(systemName: "chevron.down")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(ThemePalette.muted)
                        .padding(.top, 2)
                }
            }
            .frame(maxWidth: .infinity, alignment: .center)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .disabled(store.canteens.isEmpty)
        .accessibilityLabel("\(s.selectCanteen): \(screenTitle)")
    }

    @ViewBuilder
    private func statusBannerView(errorText: String, s: Strings) -> some View {
        let hasCache = !store.canteens.isEmpty && store.dataUpdatedAt != nil
        let color = hasCache ? ThemePalette.warning : ThemePalette.danger
        let message: String = {
            if hasCache, let updatedAt = store.dataUpdatedAt {
                let fmt = DateFormatter()
                fmt.locale = store.appLocale
                fmt.dateStyle = .short
                fmt.timeStyle = .short
                return s.offlineCache(fmt.string(from: updatedAt))
            }
            return errorText.isEmpty ? s.menuLoadFailed : errorText
        }()

        HStack(spacing: Spacing.sm) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 14))
                .foregroundStyle(color)
            Text(message)
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(color)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(.horizontal, Spacing.md)
        .padding(.vertical, Spacing.sm)
        .background(RoundedRectangle(cornerRadius: Radii.md).fill(ThemePalette.surface))
        .overlay(
            RoundedRectangle(cornerRadius: Radii.md)
                .stroke(color, lineWidth: 1)
        )
    }

    private func emptyStateView(symbol: String, message: String) -> some View {
        VStack(spacing: Spacing.sm) {
            Image(systemName: symbol)
                .font(.system(size: 32))
                .foregroundStyle(ThemePalette.muted)
            Text(message)
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
    }
}

extension View {
    @ViewBuilder
    func applyIf<Content: View>(_ condition: Bool, transform: (Self) -> Content) -> some View {
        if condition {
            transform(self)
        } else {
            self
        }
    }
}
