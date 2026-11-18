import SwiftUI
#if canImport(UIKit)
import UIKit
#endif

public struct SettingsView: View {
    @Environment(MensaStore.self) private var store

    @State private var isClearingCache = false
    @State private var showCacheClearedAlert = false
    @State private var isEditingEndpoint = false
    @State private var endpointDraft = ""

    public init() {}

    private var isPad: Bool {
        UIDevice.current.userInterfaceIdiom == .pad
    }

    private var appVersion: String {
        Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0.0"
    }

    private let githubURL = URL(string: "https://github.com/nicolasjweber/mensa-ka-ios")!

    public var body: some View {
        let s = store.strings
        let enabledCount = store.preferences.detailSectionOrder.filter {
            store.preferences.isSectionVisible($0)
        }.count
        let resolvedEndpoint = GraphQLClient.resolveAPIURL(store.preferences.customApiUrl)

        Form {
            Section(s.sectionDefaults) {
                if store.canteens.isEmpty {
                    LabeledContent {
                        Text(s.loading)
                            .foregroundStyle(.secondary)
                    } label: {
                        Label(s.rowCanteen, systemImage: "building.2")
                    }
                } else {
                    Picker(selection: Binding(
                        get: { store.resolvedCanteenId },
                        set: { newId in
                            if !newId.isEmpty {
                                store.setSelectedCanteenId(newId)
                            }
                        }
                    )) {
                        ForEach(store.canteens) { canteen in
                            Text(canteen.name)
                                .lineLimit(1)
                                .tag(canteen.id)
                        }
                    } label: {
                        Label(s.rowCanteen, systemImage: "building.2")
                    }
                    .pickerStyle(.menu)
                }

                Picker(selection: Binding(
                    get: { store.preferences.priceMode },
                    set: { store.setPriceMode($0) }
                )) {
                    ForEach(PriceTier.allCases) { tier in
                        Text(s.priceTierLabel(tier)).tag(tier)
                    }
                } label: {
                    Label(s.rowPriceTier, systemImage: "eurosign.circle")
                }
                .pickerStyle(.menu)

                Toggle(isOn: Binding(
                    get: { store.preferences.skipWeekends },
                    set: { store.setSkipWeekends($0) }
                )) {
                    Label(s.rowSkipWeekends, systemImage: "calendar.badge.clock")
                }
                .tint(ThemePalette.brand)
            }
            .listRowBackground(ThemePalette.surface)

            Section(s.sectionDetailPage) {
                NavigationLink {
                    DetailSectionsView()
                } label: {
                    LabeledContent {
                        Text("\(enabledCount)/\(store.preferences.detailSectionOrder.count)")
                            .foregroundStyle(.secondary)
                    } label: {
                        Label(s.rowSectionsOrder, systemImage: "list.bullet.indent")
                    }
                }
            }
            .listRowBackground(ThemePalette.surface)

            Section(s.sectionAppearance) {
                Picker(selection: Binding(
                    get: { store.preferences.themeMode },
                    set: { store.setThemeMode($0) }
                )) {
                    ForEach(ThemePreference.allCases) { option in
                        Text(s.themeLabel(option)).tag(option)
                    }
                } label: {
                    Label(s.rowTheme, systemImage: "circle.lefthalf.filled")
                }
                .pickerStyle(.menu)

                Picker(selection: Binding(
                    get: { store.preferences.languagePreference },
                    set: { store.setLanguagePreference($0) }
                )) {
                    ForEach(LanguagePreference.allCases) { option in
                        Text(s.languageLabel(option)).tag(option)
                    }
                } label: {
                    Label(s.rowLanguage, systemImage: "globe")
                }
                .pickerStyle(.menu)
            }
            .listRowBackground(ThemePalette.surface)

            Section(s.sectionDataCache) {
                Button {
                    endpointDraft = resolvedEndpoint
                    isEditingEndpoint = true
                } label: {
                    LabeledContent {
                        Text(resolvedEndpoint)
                            .lineLimit(1)
                            .truncationMode(.middle)
                            .foregroundStyle(.secondary)
                    } label: {
                        Label(s.rowEndpoint, systemImage: "network")
                            .foregroundStyle(ThemePalette.text)
                    }
                }

                if let custom = store.preferences.customApiUrl, custom != GraphQLClient.defaultAPIURL {
                    Button {
                        store.setCustomAPIURL(nil)
                    } label: {
                        Label(s.rowResetEndpoint, systemImage: "arrow.uturn.backward")
                    }
                }

                Button(role: .destructive) {
                    Task {
                        isClearingCache = true
                        await store.clearOfflineCache()
                        isClearingCache = false
                        showCacheClearedAlert = true
                    }
                } label: {
                    Label(
                        isClearingCache ? s.rowClearingCache : s.rowClearCache,
                        systemImage: "trash"
                    )
                    .foregroundStyle(ThemePalette.danger)
                }
                .disabled(isClearingCache)
            }
            .listRowBackground(ThemePalette.surface)

            Section(s.sectionAbout) {
                LabeledContent {
                    Text(appVersion)
                        .foregroundStyle(.secondary)
                } label: {
                    Label(s.rowVersion, systemImage: "info.circle")
                }

                Link(destination: githubURL) {
                    Label(s.rowViewGithub, systemImage: "safari")
                }
            }
            .listRowBackground(ThemePalette.surface)
        }
        .scrollContentBackground(.hidden)
        .background(ThemePalette.canvas.ignoresSafeArea())
        .scrollEdgeEffectStyle(.soft, for: .all)
        .navigationTitle(s.settingsTitle)
        .navigationBarTitleDisplayMode(isPad ? .inline : .large)
        .alert(s.cacheClearedTitle, isPresented: $showCacheClearedAlert) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(s.cacheClearedBody)
        }
        .alert(s.editEndpointTitle, isPresented: $isEditingEndpoint) {
            TextField(GraphQLClient.defaultAPIURL, text: $endpointDraft)
                .keyboardType(.URL)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
            Button(s.cancel, role: .cancel) {}
            Button(s.save) {
                store.setCustomAPIURL(endpointDraft)
            }
        } message: {
            Text(s.editEndpointMessage)
        }
    }
}
