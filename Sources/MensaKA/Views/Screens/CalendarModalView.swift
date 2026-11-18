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
                    }

                    Button {
                        store.setDate(selectedDateStr)
                        dismiss()
                    } label: {
                        Label(s.applyButton, systemImage: "checkmark.circle.fill")
                    }

                    Button {
                        store.shiftDate(5)
                        dismiss()
                    } label: {
                        Label(s.nextWeekButton, systemImage: "calendar.badge.plus")
                    }

                    if store.date != store.todayWeekday || selectedDateStr != store.todayWeekday {
                        Button {
                            store.goToToday()
                            dismiss()
                        } label: {
                            Label(s.todayButton, systemImage: "arrow.counterclockwise")
                        }
                    }
                }
            }
            .scrollContentBackground(.hidden)
            .background(ThemePalette.canvas)
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
                        store.setDate(selectedDateStr)
                        dismiss()
                    } label: {
                        Image(systemName: "checkmark")
                    }
                    .accessibilityLabel(s.applyAccessibility)
                }
            }
        }
        .onAppear {
            selectedDate = DateUtils.parseDateInput(store.date)
        }
    }
}
