import SwiftUI

public struct WeekStripView: View {
    @Environment(MensaStore.self) private var store

    public init() {}

    public var body: some View {
        let s = store.strings
        let lang = store.effectiveLanguage
        let weekdays = DateUtils.getWeekdaysForDate(store.date, language: lang)
        let showTodayButton = store.date != store.todayWeekday

        VStack(spacing: Spacing.sm) {
            AdaptiveGlassContainer(spacing: 8) {
                HStack(spacing: Spacing.sm) {
                    Button {
                        store.shiftDate(-1)
                    } label: {
                        Image(systemName: "chevron.left")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(ThemePalette.text)
                            .frame(width: 38, height: 38)
                    }
                    .buttonStyle(.plain)
                    .mensaGlassPill(shape: .circle, tone: .neutral)
                    .accessibilityLabel(s.previousWeekday)

                    Spacer(minLength: 4)

                    Button {
                        store.isCalendarPresented = true
                    } label: {
                        HStack(spacing: 6) {
                            Image(systemName: "calendar")
                                .font(.system(size: 14, weight: .semibold))
                                .foregroundStyle(ThemePalette.brand)
                            Text(DateUtils.formatDateHeader(store.date, language: lang))
                                .font(.system(size: 14, weight: .bold))
                                .foregroundStyle(ThemePalette.text)
                                .lineLimit(1)
                            Image(systemName: "chevron.down")
                                .font(.system(size: 11, weight: .semibold))
                                .foregroundStyle(ThemePalette.muted)
                        }
                        .padding(.horizontal, 14)
                        .padding(.vertical, 9)
                    }
                    .buttonStyle(.plain)
                    .mensaGlassPill(shape: .capsule, tone: .neutral)
                    .accessibilityLabel(s.openCalendar)

                    if showTodayButton {
                        Button {
                            store.goToToday()
                        } label: {
                            HStack(spacing: 4) {
                                Image(systemName: "arrow.counterclockwise")
                                    .font(.system(size: 11, weight: .bold))
                                    .foregroundStyle(ThemePalette.brandDeep)
                                Text(s.today)
                                    .font(.system(size: 12, weight: .bold))
                                    .foregroundStyle(ThemePalette.brandDeep)
                                    .lineLimit(1)
                            }
                            .padding(.horizontal, 12)
                            .padding(.vertical, 7)
                        }
                        .buttonStyle(.plain)
                        .mensaGlassPill(shape: .capsule, tone: .accent)
                        .accessibilityLabel(s.jumpToToday)
                    }

                    Spacer(minLength: 4)

                    Button {
                        store.shiftDate(1)
                    } label: {
                        Image(systemName: "chevron.right")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(ThemePalette.text)
                            .frame(width: 38, height: 38)
                    }
                    .buttonStyle(.plain)
                    .mensaGlassPill(shape: .circle, tone: .neutral)
                    .accessibilityLabel(s.nextWeekday)
                }
            }

            AdaptiveGlassContainer(spacing: 8) {
                HStack(spacing: 6) {
                    ForEach(weekdays) { item in
                        let isSelected = item.dateStr == store.date
                        Button {
                            if !isSelected {
                                store.setDate(item.dateStr)
                            }
                        } label: {
                            VStack(spacing: 1) {
                                Text(item.dayShort)
                                    .font(.system(size: 11, weight: .bold))
                                    .textCase(.uppercase)
                                    .foregroundStyle(
                                        isSelected
                                            ? ThemePalette.brandInk
                                            : (item.isToday ? ThemePalette.brand : ThemePalette.muted)
                                    )
                                    .lineLimit(1)

                                Text("\(item.dayNum)")
                                    .font(.system(size: 17, weight: .heavy))
                                    .monospacedDigit()
                                    .foregroundStyle(
                                        isSelected
                                            ? ThemePalette.brandInk
                                            : (item.isToday ? ThemePalette.brand : ThemePalette.text)
                                    )
                                    .lineLimit(1)

                                Text(item.monthShort)
                                    .font(.system(size: 11, weight: .semibold))
                                    .foregroundStyle(isSelected ? ThemePalette.brandInk : ThemePalette.muted)
                                    .lineLimit(1)
                            }
                            .padding(.vertical, 9)
                            .padding(.horizontal, 4)
                            .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.plain)
                        .mensaGlassPill(
                            shape: .roundedRectangle(Radii.md),
                            tone: isSelected ? .active : .neutral
                        )
                        .accessibilityLabel(
                            "\(item.dayShort), \(item.dayNum) \(item.monthShort)\(item.isToday ? " (\(s.today))" : "")"
                        )
                    }
                }
            }
        }
        .frame(maxWidth: 720)
        .frame(maxWidth: .infinity)
    }
}
