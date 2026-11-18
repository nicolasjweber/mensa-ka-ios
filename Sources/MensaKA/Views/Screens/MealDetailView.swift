import SwiftUI

public struct MealDetailView: View {
    @Environment(MensaStore.self) private var store
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass

    public let route: MealDetailRoute

    @State private var fetchedMeal: Meal?
    @State private var isLoadingDetail: Bool = false

    public init(route: MealDetailRoute) {
        self.route = route
    }

    private var isWide: Bool {
        horizontalSizeClass == .regular
    }

    public var body: some View {
        let s = store.strings
        let lang = store.effectiveLanguage
        let cachedMatch = store.cachedMeal(id: route.mealId, lineId: route.lineId)
        let preloaded = store.cachedOrLoadedDetail(mealId: route.mealId, lineId: route.lineId, date: route.date)
        let meal: Meal? = fetchedMeal ?? preloaded ?? route.initialMeal ?? cachedMatch?.meal

        Group {
            if let meal {
                let isFavorite = store.favoriteIds.contains(meal.id)
                let imageURLs = MealUtils.sortedImageURLs(for: meal)
                let rating = FormatUtils.formatRatingLabel(meal.ratings, language: lang)
                let lineName = route.lineName ?? cachedMatch?.lineName
                let canteenName = route.canteenName ?? cachedMatch?.canteenName
                let wantsEnrichment =
                    store.preferences.isSectionVisible(.statistics) ||
                    store.preferences.isSectionVisible(.environment) ||
                    store.preferences.isSectionVisible(.nutrition) ||
                    store.preferences.isSectionVisible(.allergens)

                ScrollView {
                    VStack(alignment: .leading, spacing: Spacing.md) {
                        if !imageURLs.isEmpty {
                            gallerySection(imageURLs: imageURLs, mealName: meal.name, lineName: lineName, s: s)
                        }

                        summaryCard(
                            meal: meal,
                            canteenName: canteenName,
                            lineName: lineName,
                            rating: rating,
                            lang: lang
                        )

                        if wantsEnrichment && isLoadingDetail &&
                            meal.nutritionData == nil && meal.environmentInfo == nil && meal.statistics == nil {
                            HStack(spacing: Spacing.sm) {
                                ProgressView()
                                    .tint(ThemePalette.brand)
                                Text(s.detailLoading)
                                    .font(.system(size: 13, weight: .semibold))
                                    .foregroundStyle(ThemePalette.muted)
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, Spacing.sm)
                        }

                        ForEach(store.preferences.detailSectionOrder) { sectionKey in
                            if store.preferences.isSectionVisible(sectionKey) {
                                detailSectionView(sectionKey, meal: meal, s: s, lang: lang)
                            }
                        }
                    }
                    .frame(maxWidth: 820)
                    .padding(.horizontal, Spacing.lg)
                    .padding(.top, Spacing.md)
                    .padding(.bottom, Spacing.xl * 2)
                    .frame(maxWidth: .infinity)
                }
                .background(ThemePalette.canvas.ignoresSafeArea())
                .navigationTitle(meal.name)
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .topBarTrailing) {
                        Button {
                            store.toggleFavorite(meal: meal)
                        } label: {
                            Image(systemName: isFavorite ? "heart.fill" : "heart")
                                .foregroundStyle(isFavorite ? ThemePalette.favorite : ThemePalette.text)
                        }
                        .accessibilityLabel(s.tabFavorites)
                    }
                }
            } else {
                VStack {
                    if isLoadingDetail {
                        ProgressView()
                            .tint(ThemePalette.brand)
                            .controlSize(.large)
                    } else {
                        Text(s.detailLoadFailed)
                            .font(.system(size: 15, weight: .semibold))
                            .foregroundStyle(ThemePalette.muted)
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .padding(Spacing.xl)
                .background(ThemePalette.canvas.ignoresSafeArea())
                .navigationTitle(s.detailFallbackTitle)
                .navigationBarTitleDisplayMode(.inline)
            }
        }
        .task(id: "\(route.mealId)|\(route.lineId)|\(route.date)") {
            guard !route.mealId.isEmpty, !route.lineId.isEmpty else { return }
            isLoadingDetail = true
            defer { isLoadingDetail = false }
            if let loaded = try? await store.loadMealDetail(
                mealId: route.mealId,
                lineId: route.lineId,
                date: route.date
            ) {
                fetchedMeal = loaded
            }
        }
    }

    @ViewBuilder
    private func gallerySection(
        imageURLs: [String],
        mealName: String,
        lineName: String?,
        s: Strings
    ) -> some View {
        if isWide && imageURLs.count == 1, let firstURL = imageURLs.first {
            galleryTile(url: firstURL, idx: 0, allURLs: imageURLs, mealName: mealName, lineName: lineName, s: s)
                .aspectRatio(3 / 2, contentMode: .fit)
                .frame(maxWidth: 540)
                .frame(maxWidth: .infinity)
        } else if isWide && imageURLs.count == 2 {
            HStack(spacing: Spacing.sm) {
                ForEach(Array(imageURLs.enumerated()), id: \.offset) { idx, url in
                    galleryTile(url: url, idx: idx, allURLs: imageURLs, mealName: mealName, lineName: lineName, s: s)
                        .aspectRatio(3 / 2, contentMode: .fit)
                        .frame(maxWidth: .infinity)
                }
            }
        } else {
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: Spacing.sm) {
                    ForEach(Array(imageURLs.enumerated()), id: \.offset) { idx, url in
                        galleryTile(url: url, idx: idx, allURLs: imageURLs, mealName: mealName, lineName: lineName, s: s)
                            .frame(width: isWide ? 356 : 300, height: isWide ? 238 : 210)
                    }
                }
            }
            .clipShape(RoundedRectangle(cornerRadius: Radii.lg))
        }
    }

    private func galleryTile(
        url: String,
        idx: Int,
        allURLs: [String],
        mealName: String,
        lineName: String?,
        s: Strings
    ) -> some View {
        Button {
            store.lightboxPayload = LightboxPayload(
                urls: allURLs,
                initialIndex: idx,
                title: mealName,
                lineName: lineName ?? ""
            )
        } label: {
            CachedMealImage(urlString: url, contentMode: .fill)
                .background(ThemePalette.surfaceSoft)
                .clipShape(RoundedRectangle(cornerRadius: Radii.lg))
        }
        .buttonStyle(.plain)
        .accessibilityLabel("\(s.mealPhoto) \(idx + 1) / \(allURLs.count)")
    }

    private func summaryCard(
        meal: Meal,
        canteenName: String?,
        lineName: String?,
        rating: (hasRatings: Bool, label: String, clampedAverage: Double),
        lang: AppLanguage
    ) -> some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            if let canteenName, let lineName {
                Text("\(canteenName) · \(lineName)")
                    .font(.system(size: 12, weight: .bold))
                    .textCase(.uppercase)
                    .tracking(0.4)
                    .foregroundStyle(ThemePalette.brandDeep)
            }

            Text(meal.name)
                .font(.system(size: 20, weight: .heavy))
                .foregroundStyle(ThemePalette.text)
                .lineSpacing(3)

            HStack(spacing: Spacing.md) {
                MealTypeBadge(mealType: meal.mealType, language: lang)

                HStack(spacing: 5) {
                    if rating.hasRatings {
                        Image(systemName: "star.fill")
                            .font(.system(size: 13))
                            .foregroundStyle(ThemePalette.starColor)
                    }
                    Text(rating.label)
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(ThemePalette.muted)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(Spacing.lg)
        .background(RoundedRectangle(cornerRadius: Radii.md).fill(ThemePalette.surface))
        .overlay(
            RoundedRectangle(cornerRadius: Radii.md)
                .stroke(ThemePalette.border, lineWidth: 1)
        )
    }

    @ViewBuilder
    private func detailSectionView(
        _ key: MealDetailSectionKey,
        meal: Meal,
        s: Strings,
        lang: AppLanguage
    ) -> some View {
        switch key {
        case .prices:
            let columns = [GridItem(.flexible(), spacing: Spacing.sm), GridItem(.flexible(), spacing: Spacing.sm)]
            detailCard(title: s.pricesTitle) {
                LazyVGrid(columns: columns, spacing: Spacing.sm) {
                    ForEach(PriceTier.allCases) { tier in
                        let active = tier == store.preferences.priceMode
                        VStack(alignment: .leading, spacing: 2) {
                            Text(s.priceTierLabel(tier))
                                .font(.system(size: 12, weight: .bold))
                                .foregroundStyle(active ? ThemePalette.brandDeep : ThemePalette.muted)
                            Text(FormatUtils.formatEuroPrice(meal.price.value(for: tier), language: lang))
                                .font(.system(size: 17, weight: .heavy))
                                .monospacedDigit()
                                .foregroundStyle(ThemePalette.text)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(Spacing.md)
                        .background(
                            RoundedRectangle(cornerRadius: Radii.sm)
                                .fill(active ? ThemePalette.brandSoft : ThemePalette.surfaceSoft)
                        )
                        .overlay(
                            RoundedRectangle(cornerRadius: Radii.sm)
                                .stroke(active ? ThemePalette.brand : Color.clear, lineWidth: 1.5)
                        )
                    }
                }
            }

        case .nutrition:
            if let n = meal.nutritionData {
                let rows: [(String, String)] = [
                    (s.nutritionEnergy, FormatUtils.formatNutritionAmount(n.energy, unit: "kcal", language: lang)),
                    (s.nutritionProtein, FormatUtils.formatNutritionAmount(n.protein, unit: "g", language: lang)),
                    (s.nutritionCarbs, FormatUtils.formatNutritionAmount(n.carbohydrates, unit: "g", language: lang)),
                    (s.nutritionSugar, FormatUtils.formatNutritionAmount(n.sugar, unit: "g", language: lang)),
                    (s.nutritionFat, FormatUtils.formatNutritionAmount(n.fat, unit: "g", language: lang)),
                    (s.nutritionSaturatedFat, FormatUtils.formatNutritionAmount(n.saturatedFat, unit: "g", language: lang)),
                    (s.nutritionSalt, FormatUtils.formatNutritionAmount(n.salt, unit: "g", language: lang)),
                ]
                detailCard(title: s.nutritionTitle) {
                    keyValueRows(rows)
                }
            }

        case .sides:
            if let sides = meal.sides, !sides.isEmpty {
                detailCard(title: s.sidesTitle) {
                    VStack(spacing: Spacing.xs) {
                        ForEach(sides) { side in
                            HStack(spacing: Spacing.sm) {
                                Text(side.name)
                                    .font(.system(size: 14, weight: .semibold))
                                    .foregroundStyle(ThemePalette.text)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                Text(
                                    FormatUtils.formatEuroPrice(
                                        side.price.value(for: store.preferences.priceMode),
                                        language: lang
                                    )
                                )
                                .font(.system(size: 14, weight: .bold))
                                .monospacedDigit()
                                .foregroundStyle(ThemePalette.brandDeep)
                            }
                            .padding(.vertical, 4)
                        }
                    }
                }
            }

        case .allergens:
            let allergens = meal.allergens ?? []
            let additives = meal.additives ?? []
            if !allergens.isEmpty || !additives.isEmpty {
                detailCard(title: s.allergensTitle) {
                    TagFlowLayout(spacing: 6) {
                        ForEach(allergens, id: \.self) { code in
                            Text(s.allergenLabel(code))
                                .font(.system(size: 12, weight: .semibold))
                                .foregroundStyle(ThemePalette.text)
                                .padding(.horizontal, 10)
                                .padding(.vertical, 5)
                                .background(Capsule().fill(ThemePalette.surfaceSoft))
                        }
                        ForEach(additives, id: \.self) { code in
                            Text(s.additiveLabel(code))
                                .font(.system(size: 12, weight: .semibold))
                                .foregroundStyle(ThemePalette.muted)
                                .padding(.horizontal, 10)
                                .padding(.vertical, 5)
                                .background(Capsule().fill(ThemePalette.surfaceSoft))
                        }
                    }
                }
            }

        case .environment:
            if let env = meal.environmentInfo {
                detailCard(title: s.environmentTitle) {
                    HStack(spacing: Spacing.sm) {
                        statTile(
                            symbol: "leaf.fill",
                            label: s.envCO2,
                            value: "\(FormatUtils.formatNutritionAmount(env.co2Value, unit: "g", language: lang)) (\(env.co2Rating)/\(env.maxRating))"
                        )
                        statTile(
                            symbol: "drop.fill",
                            label: s.envWater,
                            value: "\(FormatUtils.formatDecimal(env.waterValue / 1000.0, fractionDigits: 1, language: lang)) L (\(env.waterRating)/\(env.maxRating))"
                        )
                    }
                }
            }

        case .statistics:
            if let stats = meal.statistics {
                let lastText = stats.lastServed.map {
                    DateUtils.formatDateHeader(String($0.prefix(10)), language: lang)
                } ?? s.statsFirstTime
                let nextText = stats.nextServed.map {
                    DateUtils.formatDateHeader(String($0.prefix(10)), language: lang)
                } ?? s.statsNotScheduled
                let rows: [(String, String)] = [
                    (s.statsLastServed, lastText),
                    (s.statsNextServed, nextText),
                    (s.statsTimesServed, "\(stats.frequency)×"),
                ]

                VStack(alignment: .leading, spacing: Spacing.sm) {
                    HStack {
                        Text(s.statisticsTitle)
                            .font(.system(size: 16, weight: .heavy))
                            .foregroundStyle(ThemePalette.text)
                        Spacer()
                        if stats.isNew {
                            HStack(spacing: 4) {
                                Image(systemName: "sparkles")
                                    .font(.system(size: 11, weight: .bold))
                                Text(s.newBadge)
                                    .font(.system(size: 12, weight: .bold))
                            }
                            .foregroundStyle(ThemePalette.brandDeep)
                            .padding(.horizontal, 9)
                            .padding(.vertical, 4)
                            .background(Capsule().fill(ThemePalette.brandSoft))
                        }
                    }
                    keyValueRows(rows)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(Spacing.lg)
                .background(RoundedRectangle(cornerRadius: Radii.md).fill(ThemePalette.surface))
                .overlay(
                    RoundedRectangle(cornerRadius: Radii.md)
                        .stroke(ThemePalette.border, lineWidth: 1)
                )
            }
        }
    }

    private func detailCard<Content: View>(title: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            Text(title)
                .font(.system(size: 16, weight: .heavy))
                .foregroundStyle(ThemePalette.text)
            content()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(Spacing.lg)
        .background(RoundedRectangle(cornerRadius: Radii.md).fill(ThemePalette.surface))
        .overlay(
            RoundedRectangle(cornerRadius: Radii.md)
                .stroke(ThemePalette.border, lineWidth: 1)
        )
    }

    private func keyValueRows(_ rows: [(String, String)]) -> some View {
        VStack(spacing: 4) {
            ForEach(Array(rows.enumerated()), id: \.offset) { idx, row in
                HStack {
                    Text(row.0)
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(ThemePalette.muted)
                    Spacer()
                    Text(row.1)
                        .font(.system(size: 14, weight: .bold))
                        .monospacedDigit()
                        .foregroundStyle(ThemePalette.text)
                }
                .padding(.vertical, 6)

                if idx < rows.count - 1 {
                    Divider()
                        .overlay(ThemePalette.border)
                }
            }
        }
    }

    private func statTile(symbol: String, label: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Image(systemName: symbol)
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(ThemePalette.brand)
            Text(label)
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(ThemePalette.muted)
            Text(value)
                .font(.system(size: 14, weight: .heavy))
                .foregroundStyle(ThemePalette.text)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(Spacing.md)
        .background(RoundedRectangle(cornerRadius: Radii.sm).fill(ThemePalette.surfaceSoft))
    }
}

struct TagFlowLayout: Layout {
    var spacing: CGFloat = 6

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let maxWidth = proposal.width ?? .infinity
        var rowWidth: CGFloat = 0
        var rowHeight: CGFloat = 0
        var totalHeight: CGFloat = 0
        var widest: CGFloat = 0

        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if rowWidth > 0 && rowWidth + spacing + size.width > maxWidth {
                totalHeight += rowHeight + spacing
                widest = max(widest, rowWidth)
                rowWidth = size.width
                rowHeight = size.height
            } else {
                rowWidth = rowWidth == 0 ? size.width : rowWidth + spacing + size.width
                rowHeight = max(rowHeight, size.height)
            }
        }
        widest = max(widest, rowWidth)
        totalHeight += rowHeight
        return CGSize(width: proposal.width ?? widest, height: totalHeight)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        var x = bounds.minX
        var y = bounds.minY
        var rowHeight: CGFloat = 0

        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if x > bounds.minX && x + size.width > bounds.maxX {
                x = bounds.minX
                y += rowHeight + spacing
                rowHeight = 0
            }
            subview.place(at: CGPoint(x: x, y: y), proposal: ProposedViewSize(size))
            x += size.width + spacing
            rowHeight = max(rowHeight, size.height)
        }
    }
}
