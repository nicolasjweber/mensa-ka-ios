import SwiftUI

public struct CalendarModalView: View {
    @Environment(MensaStore.self) private var store
    @Environment(\.dismiss) private var dismiss

    @State private var selectedDate: Date = Date()

    public init() {}

    public var body: some View {
        let s = store.strings
        let selectedDateStr = DateUtils.toDateString(selectedDate)

        NavigationStack {
            ScrollView {
                VStack(spacing: Spacing.md) {
                    DatePicker(
                        s.pickerTitle,
                        selection: $selectedDate,
                        displayedComponents: [.date]
                    )
                    .datePickerStyle(.graphical)
                    .tint(ThemePalette.brand)
                    .padding(Spacing.sm)
                    .background(
                        RoundedRectangle(cornerRadius: Radii.lg, style: .continuous)
                            .fill(ThemePalette.surface)
                    )
                    .overlay(
                        RoundedRectangle(cornerRadius: Radii.lg, style: .continuous)
                            .stroke(ThemePalette.border, lineWidth: 1)
                    )

                    VStack(spacing: Spacing.sm) {
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
                        }
                    }
                }
                .padding(.horizontal, Spacing.lg)
                .padding(.top, Spacing.sm)
                .padding(.bottom, Spacing.lg)
            }
            .background(ThemePalette.canvas.ignoresSafeArea())
            .scrollEdgeEffectStyle(.soft, for: .all)
            .navigationTitle(s.calendarTitle)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button(role: .close) {
                        dismiss()
                    }
                    .accessibilityLabel(s.cancel)
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button(role: .confirm) {
                        withAnimation(.spring(duration: 0.35, bounce: 0.25)) {
                            store.setDate(selectedDateStr)
                        }
                        dismiss()
                    }
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
