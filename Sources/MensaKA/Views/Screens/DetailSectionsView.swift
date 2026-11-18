import SwiftUI

public struct DetailSectionsView: View {
    @Environment(MensaStore.self) private var store

    public init() {}

    public var body: some View {
        let s = store.strings

        List {
            Section {
                ForEach(store.preferences.detailSectionOrder) { key in
                    Toggle(isOn: Binding(
                        get: { store.preferences.isSectionVisible(key) },
                        set: { store.setDetailSectionVisible(key, visible: $0) }
                    )) {
                        Label(s.detailSectionLabel(key), systemImage: key.systemImage)
                    }
                    .tint(ThemePalette.brand)
                }
                .onMove { source, destination in
                    store.moveDetailSections(from: source, to: destination)
                }
            } header: {
                Text(s.detailEditorSectionTitle)
            } footer: {
                Text(s.detailEditorFooter)
            }
        }
        .scrollEdgeEffectStyle(.soft, for: .all)
        .environment(\.editMode, .constant(.active))
        .navigationTitle(s.settingsSectionsTitle)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    store.resetDetailLayout()
                } label: {
                    Image(systemName: "arrow.counterclockwise")
                }
                .accessibilityLabel(s.detailEditorResetAccessibility)
            }
        }
    }
}
