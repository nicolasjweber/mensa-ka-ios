import SwiftUI

public struct CalendarModalView: View {
    @Environment(MensaStore.self) private var store
    @Environment(\.dismiss) private var dismiss

    @State private var selectedDate: Date = Date()

    public init() {}

    public var body: some View {
        let s = store.strings
        let lang = store.effectiveLanguage
        let selectedDateStr = DateUtils.toDateString(selectedDate)

        NavigationStack {
            Form {
                Section {
                    DatePicker(
                        s.pickerTitle,
                        selection: $selectedDate,
                        displayedComponents: [.date]
                    )
                    .datePickerStyle(.graphical)
                    .tint(ThemePalette.brand)
                }

                Section {
                    LabeledContent(s.selectedDay) {
                        Text(DateUtils.formatDateHeader(selectedDateStr, language: lang))
                            .foregroundStyle(ThemePalette.text)
                            .fontWeight(.semibold)
                    }
                }

                Section {
                    Button {
                        withAnimation(.spring(duration: 0.35, bounce: 0.25)) {
                            store.setDate(selectedDateStr)
                        }
                        dismiss()
                    } label: {
                        Label(s.applyButton, systemImage: "checkmark.circle.fill")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.glassProminent)
                    .controlSize(.large)
                    .tint(ThemePalette.brand)
                    .listRowBackground(Color.clear)
                    .listRowInsets(EdgeInsets(top: 4, leading: 0, bottom: 4, trailing: 0))

                    Button {
                        withAnimation(.spring(duration: 0.35, bounce: 0.25)) {
                            store.shiftDate(5)
                        }
                        dismiss()
                    } label: {
                        Label(s.nextWeekButton, systemImage: "calendar.badge.plus")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.glass)
                    .controlSize(.large)
                    .listRowBackground(Color.clear)
                    .listRowInsets(EdgeInsets(top: 4, leading: 0, bottom: 4, trailing: 0))

                    if store.date != store.todayWeekday || selectedDateStr != store.todayWeekday {
                        Button {
                            withAnimation(.spring(duration: 0.35, bounce: 0.25)) {
                                store.goToToday()
                            }
                            dismiss()
                        } label: {
                            Label(s.todayButton, systemImage: "arrow.counterclockwise")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.glass)
                        .controlSize(.large)
                        .listRowBackground(Color.clear)
                        .listRowInsets(EdgeInsets(top: 4, leading: 0, bottom: 4, trailing: 0))
                    }
                }
            }
            .scrollEdgeEffectStyle(.soft, for: .all)
            .navigationTitle(s.calendarTitle)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button {
                        dismiss()
                    } label: {
                        Image(systemName: "xmark")
                    }
                    .accessibilityLabel(s.cancel)
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        withAnimation(.spring(duration: 0.35, bounce: 0.25)) {
                            store.setDate(selectedDateStr)
                        }
                        dismiss()
                    } label: {
                        Image(systemName: "checkmark")
                    }
                    .buttonStyle(.glassProminent)
                    .tint(ThemePalette.brand)
                    .accessibilityLabel(s.applyAccessibility)
                }
            }
        }
        .onAppear {
            selectedDate = DateUtils.parseDateInput(store.date)
        }
    }
}
