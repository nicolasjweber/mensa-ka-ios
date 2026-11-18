import SwiftUI

public struct FilterBarView: View {
    @Environment(MensaStore.self) private var store
    @Namespace private var filterNamespace

    public init() {}

    private func symbol(for key: FilterKey) -> String {
        switch key {
        case .vegan: return "leaf.fill"
        case .vegetarian: return "carrot.fill"
        case .favoritesOnly: return "heart.fill"
        }
    }

    public var body: some View {
        ViewThatFits(in: .horizontal) {
            chipsRow
                .frame(maxWidth: .infinity, alignment: .center)

            ScrollView(.horizontal, showsIndicators: false) {
                chipsRow
            }
        }
        .frame(maxWidth: 720)
        .frame(maxWidth: .infinity)
    }

    private var chipsRow: some View {
        let s = store.strings
        return AdaptiveGlassContainer(spacing: 8) {
            HStack(spacing: 8) {
                ForEach(FilterKey.allCases) { key in
                    let active = store.activeFilters.isActive(key)
                    let label = s.filterLabel(key)

                    Button {
                        withAnimation(.spring(duration: 0.3, bounce: 0.25)) {
                            store.toggleFilter(key)
                        }
                    } label: {
                        HStack(spacing: 6) {
                            Image(systemName: symbol(for: key))
                                .font(.system(size: 13, weight: .semibold))
                                .foregroundStyle(active ? ThemePalette.brandInk : ThemePalette.brand)
                            Text(label)
                                .font(.system(size: 13, weight: .bold))
                                .foregroundStyle(active ? ThemePalette.brandInk : ThemePalette.text)
                                .lineLimit(1)
                        }
                        .padding(.horizontal, 14)
                        .padding(.vertical, 8)
                    }
                    .buttonStyle(.plain)
                    .mensaGlassPill(shape: .capsule, tone: active ? .active : .neutral)
                    .glassEffectID(key.rawValue, in: filterNamespace)
                    .accessibilityLabel("\(s.filterPrefix): \(label)")
                }
            }
            .padding(.vertical, 4)
            .padding(.horizontal, 2)
        }
    }
}
