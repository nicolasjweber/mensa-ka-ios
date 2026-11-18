import SwiftUI
#if canImport(UIKit)
import UIKit
#endif

public enum AppTab: Hashable, Sendable {
    case menu
    case favorites
    case settings
    case search
}

@main
public struct MensaKAApp: App {
    @State private var store = MensaStore()

    public init() {}

    public var body: some Scene {
        WindowGroup {
            RootContentView()
                .environment(store)
                .preferredColorScheme(store.preferredColorScheme)
                .tint(ThemePalette.brand)
                .environment(\.locale, store.appLocale)
                .task {
                    await store.startInitialLoadIfNeeded()
                }
        }
    }
}

private struct RootContentView: View {
    @Environment(MensaStore.self) private var store

    @State private var selectedTab: AppTab = .menu
    @State private var searchQuery: String = ""

    @Namespace private var lightboxNamespace
    @Namespace private var menuZoomNamespace
    @Namespace private var favZoomNamespace
    @Namespace private var searchZoomNamespace

    private var isPad: Bool {
        UIDevice.current.userInterfaceIdiom == .pad
    }

    var body: some View {
        @Bindable var bindableStore = store
        let s = store.strings

        TabView(selection: $selectedTab) {
            Tab(s.tabMenu, systemImage: "fork.knife", value: AppTab.menu) {
                NavigationStack {
                    MenuView()
                        .navigationDestination(for: MealDetailRoute.self) { route in
                            MealDetailView(route: route)
                                .optionalZoomTransition(sourceID: route.transitionID, in: menuZoomNamespace)
                        }
                }
                .environment(\.navZoomNamespace, menuZoomNamespace)
            }

            Tab(s.tabFavorites, systemImage: selectedTab == .favorites ? "heart.fill" : "heart", value: AppTab.favorites) {
                NavigationStack {
                    FavoritesView()
                        .navigationDestination(for: MealDetailRoute.self) { route in
                            MealDetailView(route: route)
                                .optionalZoomTransition(sourceID: route.transitionID, in: favZoomNamespace)
                        }
                }
                .environment(\.navZoomNamespace, favZoomNamespace)
            }

            Tab(s.tabSettings, systemImage: selectedTab == .settings ? "gearshape.fill" : "gearshape", value: AppTab.settings) {
                NavigationStack {
                    SettingsView()
                }
            }

            if !isPad {
                Tab(value: AppTab.search, role: .search) {
                    NavigationStack {
                        SearchView(query: $searchQuery)
                            .navigationDestination(for: MealDetailRoute.self) { route in
                                MealDetailView(route: route)
                                    .optionalZoomTransition(sourceID: route.transitionID, in: searchZoomNamespace)
                            }
                    }
                    .environment(\.navZoomNamespace, searchZoomNamespace)
                }
            }
        }
        .tabViewStyle(.sidebarAdaptable)
        .tabBarMinimizeBehavior(.onScrollDown)
        .environment(\.lightboxNamespace, lightboxNamespace)
        .onChange(of: selectedTab) { _, _ in
            Haptics.selection()
        }
        .sheet(isPresented: $bindableStore.isCalendarPresented) {
            CalendarModalView()
                .environment(store)
                .preferredColorScheme(store.preferredColorScheme)
                .tint(ThemePalette.brand)
                .environment(\.locale, store.appLocale)
                .applyIf(isPad) { view in
                    view
                        .presentationSizing(.fitted)
                        .frame(
                            minWidth: 360, idealWidth: 400, maxWidth: 440,
                            minHeight: 560, idealHeight: 630, maxHeight: 700
                        )
                }
                .applyIf(!isPad) { view in
                    view
                        .presentationDetents([.fraction(0.75), .fraction(0.92)])
                        .presentationDragIndicator(.visible)
                }
        }
        .fullScreenCover(item: $bindableStore.lightboxPayload) { payload in
            LightboxView(payload: payload)
                .environment(store)
                .environment(\.locale, store.appLocale)
                .environment(\.lightboxNamespace, lightboxNamespace)
        }
    }
}
