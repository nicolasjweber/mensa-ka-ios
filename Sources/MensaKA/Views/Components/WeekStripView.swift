import SwiftUI

public struct WeekStripView: View {
    @Environment(MensaStore.self) private var store
    @Namespace private var glassNamespace

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
                        withAnimation(.spring(duration: 0.35, bounce: 0.25)) {
                            store.shiftDate(-1)
                        }
                    } label: {
                        Image(systemName: "chevron.left")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(ThemePalette.text)
                            .frame(width: 40, height: 40)
                    }
                    .buttonStyle(.plain)
                    .mensaGlassPill(shape: .circle, tone: .neutral)
                    .glassEffectID("prev", in: glassNamespace)
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
                        .padding(.vertical, 10)
                    }
                    .buttonStyle(.plain)
                    .mensaGlassPill(shape: .capsule, tone: .neutral)
                    .glassEffectID("calendar", in: glassNamespace)
                    .accessibilityLabel(s.openCalendar)

                    if showTodayButton {
                        Button {
                            withAnimation(.spring(duration: 0.35, bounce: 0.25)) {
                                store.goToToday()
                            }
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
                            .padding(.vertical, 8)
                        }
                        .buttonStyle(.plain)
                        .mensaGlassPill(shape: .capsule, tone: .accent)
                        .glassEffectID("today", in: glassNamespace)
                        .transition(.scale.combined(with: .opacity))
                        .accessibilityLabel(s.jumpToToday)
                    }

                    Spacer(minLength: 4)

                    Button {
                        withAnimation(.spring(duration: 0.35, bounce: 0.25)) {
                            store.shiftDate(1)
                        }
                    } label: {
                        Image(systemName: "chevron.right")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(ThemePalette.text)
                            .frame(width: 40, height: 40)
                    }
                    .buttonStyle(.plain)
                    .mensaGlassPill(shape: .circle, tone: .neutral)
                    .glassEffectID("next", in: glassNamespace)
                    .accessibilityLabel(s.nextWeekday)
                }
            }

            AdaptiveGlassContainer(spacing: 6) {
                HStack(spacing: 6) {
                    ForEach(weekdays) { item in
                        let isSelected = item.dateStr == store.date
                        Button {
                            if !isSelected {
                                withAnimation(.spring(duration: 0.32, bounce: 0.22)) {
                                    store.setDate(item.dateStr)
                                }
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
                        .glassEffectID(item.dateStr, in: glassNamespace)
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
