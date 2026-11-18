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

    private var isPad: Bool {
        UIDevice.current.userInterfaceIdiom == .pad
    }

    var body: some View {
        @Bindable var bindableStore = store

        Group {
            if #available(iOS 18.0, *) {
                modernTabView
            } else {
                legacyTabView
            }
        }
        .sheet(isPresented: $bindableStore.isCalendarPresented) {
            CalendarModalView()
                .environment(store)
                .preferredColorScheme(store.preferredColorScheme)
                .tint(ThemePalette.brand)
                .environment(\.locale, store.appLocale)
                .presentationDetents([.fraction(0.75), .fraction(0.92)])
                .presentationDragIndicator(.visible)
        }
        .fullScreenCover(item: $bindableStore.lightboxPayload) { payload in
            LightboxView(payload: payload)
                .environment(store)
                .environment(\.locale, store.appLocale)
        }
    }

    @available(iOS 18.0, *)
    @ViewBuilder
    private var modernTabView: some View {
        let s = store.strings
        let base = TabView(selection: $selectedTab) {
            Tab(s.tabMenu, systemImage: "fork.knife", value: AppTab.menu) {
                NavigationStack {
                    MenuView()
                        .navigationDestination(for: MealDetailRoute.self) { route in
                            MealDetailView(route: route)
                        }
                }
            }

            Tab(s.tabFavorites, systemImage: selectedTab == .favorites ? "heart.fill" : "heart", value: AppTab.favorites) {
                NavigationStack {
                    FavoritesView()
                        .navigationDestination(for: MealDetailRoute.self) { route in
                            MealDetailView(route: route)
                        }
                }
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
                            }
                    }
                }
            }
        }
        .tabViewStyle(.sidebarAdaptable)
        .onChange(of: selectedTab) { _, _ in
            Haptics.selection()
        }

        if #available(iOS 26.0, *) {
            base.tabBarMinimizeBehavior(.onScrollDown)
        } else {
            base
        }
    }

    @ViewBuilder
    private var legacyTabView: some View {
        let s = store.strings
        TabView(selection: $selectedTab) {
            NavigationStack {
                MenuView()
                    .navigationDestination(for: MealDetailRoute.self) { route in
                        MealDetailView(route: route)
                    }
            }
            .tabItem {
                Label(s.tabMenu, systemImage: "fork.knife")
            }
            .tag(AppTab.menu)

            NavigationStack {
                FavoritesView()
                    .navigationDestination(for: MealDetailRoute.self) { route in
                        MealDetailView(route: route)
                    }
            }
            .tabItem {
                Label(s.tabFavorites, systemImage: selectedTab == .favorites ? "heart.fill" : "heart")
            }
            .tag(AppTab.favorites)

            NavigationStack {
                SettingsView()
            }
            .tabItem {
                Label(s.tabSettings, systemImage: selectedTab == .settings ? "gearshape.fill" : "gearshape")
            }
            .tag(AppTab.settings)

            if !isPad {
                NavigationStack {
                    SearchView(query: $searchQuery)
                        .navigationDestination(for: MealDetailRoute.self) { route in
                            MealDetailView(route: route)
                        }
                }
                .tabItem {
                    Label(s.tabSearch, systemImage: "magnifyingglass")
                }
                .tag(AppTab.search)
            }
        }
    }
}
