import SwiftUI
#if canImport(UIKit)
import UIKit
#endif

public struct CalendarModalView: View {
    @Environment(MensaStore.self) private var store
    @Environment(\.dismiss) private var dismiss

    @State private var selectedDate: Date = Date()

    public init() {}

    private var isPad: Bool {
        UIDevice.current.userInterfaceIdiom == .pad
    }

    public var body: some View {
        let s = store.strings
        let selectedDateStr = DateUtils.toDateString(selectedDate)
        let columnWidth: CGFloat? = isPad ? 330 : nil

        NavigationStack {
            ScrollView {
                VStack(spacing: isPad ? Spacing.sm : Spacing.md) {
                    DatePicker(
                        s.pickerTitle,
                        selection: $selectedDate,
                        displayedComponents: [.date]
                    )
                    .datePickerStyle(.graphical)
                    .tint(ThemePalette.brand)
                    .padding(isPad ? Spacing.xs : Spacing.sm)
                    .frame(maxWidth: columnWidth ?? .infinity)
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
                        .controlSize(isPad ? .regular : .large)
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
                        .controlSize(isPad ? .regular : .large)

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
                            .controlSize(isPad ? .regular : .large)
                        }
                    }
                    .frame(maxWidth: columnWidth ?? .infinity)
                }
                .frame(maxWidth: .infinity)
                .padding(.horizontal, Spacing.lg)
                .padding(.top, isPad ? Spacing.xs : Spacing.sm)
                .padding(.bottom, isPad ? Spacing.md : Spacing.lg)
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
