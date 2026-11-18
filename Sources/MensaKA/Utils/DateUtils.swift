import Foundation

public struct WeekdayItem: Identifiable, Hashable, Sendable {
    public var id: String { dateStr }
    public let dateStr: String
    public let dayShort: String
    public let dayNum: Int
    public let monthShort: String
    public let isToday: Bool
}

public enum DateUtils {
    private static let gregorian = Calendar(identifier: .gregorian)
    private static let shortWeekdaysEN = ["Mon", "Tue", "Wed", "Thu", "Fri"]
    private static let shortWeekdaysDE = ["Mo", "Di", "Mi", "Do", "Fr"]

    public static func toDateString(_ date: Date) -> String {
        let comps = gregorian.dateComponents([.year, .month, .day], from: date)
        let y = comps.year ?? 2026
        let m = comps.month ?? 1
        let d = comps.day ?? 1
        return String(format: "%04d-%02d-%02d", y, m, d)
    }

    public static func parseDateInput(_ value: String) -> Date {
        let parts = value.split(separator: "-").compactMap { Int($0) }
        guard parts.count == 3 else { return Date() }
        var comps = DateComponents()
        comps.year = parts[0]
        comps.month = parts[1]
        comps.day = parts[2]
        comps.hour = 12
        return gregorian.date(from: comps) ?? Date()
    }

    public static func isWeekend(_ date: Date) -> Bool {
        let weekday = gregorian.component(.weekday, from: date)
        return weekday == 1 || weekday == 7
    }

    public static func getInitialWeekdayString(skipWeekends: Bool = true, now: Date = Date()) -> String {
        var target = gregorian.startOfDay(for: now)
        if skipWeekends {
            while isWeekend(target) {
                target = gregorian.date(byAdding: .day, value: 1, to: target) ?? target
            }
        }
        return toDateString(target)
    }

    public static func getMonday(of date: Date) -> Date {
        let start = gregorian.startOfDay(for: date)
        let weekday = gregorian.component(.weekday, from: start) // 1 = Sun, 2 = Mon, ...
        let diff = weekday == 1 ? -6 : (2 - weekday)
        return gregorian.date(byAdding: .day, value: diff, to: start) ?? start
    }

    public static func getWeekdaysForDate(_ dateStr: String, language: AppLanguage) -> [WeekdayItem] {
        let current = parseDateInput(dateStr)
        let monday = getMonday(of: current)
        let todayStr = toDateString(Date())
        let weekdays = language == .de ? shortWeekdaysDE : shortWeekdaysEN

        let monthFmt = DateFormatter()
        monthFmt.calendar = gregorian
        monthFmt.locale = Locale(identifier: language == .de ? "de_DE" : "en_GB")
        monthFmt.dateFormat = "MMM"

        return (0..<5).map { offset in
            let dayDate = gregorian.date(byAdding: .day, value: offset, to: monday) ?? monday
            let cellStr = toDateString(dayDate)
            let dayNum = gregorian.component(.day, from: dayDate)
            let rawMonth = monthFmt.string(from: dayDate).replacingOccurrences(of: ".", with: "")
            return WeekdayItem(
                dateStr: cellStr,
                dayShort: weekdays[offset],
                dayNum: dayNum,
                monthShort: rawMonth,
                isToday: cellStr == todayStr
            )
        }
    }

    public static func shiftWeekdayDate(_ dateStr: String, dayDelta: Int, skipWeekends: Bool = true) -> String {
        guard dayDelta != 0 else { return dateStr }
        let direction = dayDelta > 0 ? 1 : -1
        var remaining = abs(dayDelta)
        var current = parseDateInput(dateStr)

        while remaining > 0 {
            current = gregorian.date(byAdding: .day, value: direction, to: current) ?? current
            if !skipWeekends || !isWeekend(current) {
                remaining -= 1
            }
        }
        return toDateString(current)
    }

    public static func formatDateHeader(_ dateStr: String, language: AppLanguage) -> String {
        let date = parseDateInput(dateStr)
        let locale = Locale(identifier: language == .de ? "de_DE" : "en_GB")

        let weekdayFmt = DateFormatter()
        weekdayFmt.calendar = gregorian
        weekdayFmt.locale = locale
        weekdayFmt.dateFormat = "EEE"
        let weekday = weekdayFmt.string(from: date).replacingOccurrences(of: ".", with: "")

        let dateFmt = DateFormatter()
        dateFmt.calendar = gregorian
        dateFmt.locale = Locale(identifier: "de_DE")
        dateFmt.dateFormat = "dd.MM.yyyy"

        return "\(weekday), \(dateFmt.string(from: date))"
    }
}
