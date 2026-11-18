import SwiftUI
#if canImport(UIKit)
import UIKit
#endif

public enum Radii {
    public static let sm: CGFloat = 9
    public static let md: CGFloat = 14
    public static let lg: CGFloat = 18
}

public enum Spacing {
    public static let xs: CGFloat = 4
    public static let sm: CGFloat = 8
    public static let md: CGFloat = 12
    public static let lg: CGFloat = 16
    public static let xl: CGFloat = 24
}

extension Color {
    static func dynamic(lightHex: UInt32, darkHex: UInt32, lightAlpha: CGFloat = 1, darkAlpha: CGFloat = 1) -> Color {
        #if canImport(UIKit)
        return Color(
            uiColor: UIColor { traits in
                let isDark = traits.userInterfaceStyle == .dark
                let hex = isDark ? darkHex : lightHex
                let alpha = isDark ? darkAlpha : lightAlpha
                return UIColor(
                    red: CGFloat((hex >> 16) & 0xFF) / 255.0,
                    green: CGFloat((hex >> 8) & 0xFF) / 255.0,
                    blue: CGFloat(hex & 0xFF) / 255.0,
                    alpha: alpha
                )
            }
        )
        #else
        return Color(
            red: Double((lightHex >> 16) & 0xFF) / 255.0,
            green: Double((lightHex >> 8) & 0xFF) / 255.0,
            blue: Double(lightHex & 0xFF) / 255.0,
            opacity: Double(lightAlpha)
        )
        #endif
    }
}

public enum ThemePalette {
    public static let brand = Color.dynamic(lightHex: 0x007C6B, darkHex: 0x22C5AE)
    public static let brandDark = Color.dynamic(lightHex: 0x006658, darkHex: 0x16A893)
    public static let brandDeep = Color.dynamic(lightHex: 0x004D42, darkHex: 0x5CE5D1)
    public static let brandSoft = Color.dynamic(lightHex: 0xE4F4F1, darkHex: 0x13312C)
    public static let brandInk = Color.dynamic(lightHex: 0xFFFFFF, darkHex: 0x06211C)

    public static let canvas = Color.dynamic(lightHex: 0xF4F7F6, darkHex: 0x0A1210)
    public static let surface = Color.dynamic(lightHex: 0xFFFFFF, darkHex: 0x121F1C)
    public static let surfaceSoft = Color.dynamic(lightHex: 0xEDF4F2, darkHex: 0x192A26)

    public static let text = Color.dynamic(lightHex: 0x0F2622, darkHex: 0xE8F5F1)
    public static let muted = Color.dynamic(lightHex: 0x445E59, darkHex: 0x8FB4AC)
    public static let border = Color.dynamic(
        lightHex: 0x0F2622,
        darkHex: 0xE8F5F1,
        lightAlpha: 0.11,
        darkAlpha: 0.12
    )

    public static let favorite = Color.dynamic(lightHex: 0xC92A54, darkHex: 0xFF6B8B)
    public static let starColor = Color.dynamic(lightHex: 0xB87400, darkHex: 0xF5B935)
    public static let skeletonStart = Color.dynamic(lightHex: 0xE1EFEC, darkHex: 0x182B27)
    public static let skeletonEnd = Color.dynamic(lightHex: 0xCEE5E0, darkHex: 0x233C37)

    public static let veganBg = Color.dynamic(lightHex: 0xDFF5E8, darkHex: 0x103824)
    public static let veganFg = Color.dynamic(lightHex: 0x0D5C33, darkHex: 0x7DE5AA)
    public static let vegBg = Color.dynamic(lightHex: 0xE5F5D9, darkHex: 0x1C3610)
    public static let vegFg = Color.dynamic(lightHex: 0x2B5911, darkHex: 0xA4E374)
    public static let fishBg = Color.dynamic(lightHex: 0xDFEFF9, darkHex: 0x113047)
    public static let fishFg = Color.dynamic(lightHex: 0x0D4B73, darkHex: 0x7EC7F5)
    public static let meatBg = Color.dynamic(lightHex: 0xFBEAD9, darkHex: 0x3F210D)
    public static let meatFg = Color.dynamic(lightHex: 0x7C350A, darkHex: 0xF7B07C)

    public static let danger = Color.dynamic(lightHex: 0xC6284D, darkHex: 0xFF7B98)
    public static let warning = Color.dynamic(lightHex: 0x9A6000, darkHex: 0xF5B935)

    public static func mealTypeColors(_ mealType: FoodType) -> (bg: Color, fg: Color)? {
        switch mealType {
        case .vegan:
            return (veganBg, veganFg)
        case .vegetarian:
            return (vegBg, vegFg)
        case .fish:
            return (fishBg, fishFg)
        case .poultry, .beef, .beefAW, .pork, .porkAW:
            return (meatBg, meatFg)
        case .unknown:
            return nil
        }
    }
}

public enum GlassTone {
    case neutral
    case accent
    case active
}

public enum GlassShapeKind {
    case capsule
    case circle
    case roundedRectangle(CGFloat)
}

@MainActor
public func isReduceTransparencyActive() -> Bool {
    #if canImport(UIKit)
    UIAccessibility.isReduceTransparencyEnabled
    #else
    false
    #endif
}

struct GlassPillModifier: ViewModifier {
    @Environment(\.colorScheme) private var colorScheme
    let shape: GlassShapeKind
    let tone: GlassTone

    func body(content: Content) -> some View {
        let reduceTransparency = isReduceTransparencyActive()

        if #available(iOS 26.0, *), !reduceTransparency {
            let tintColor: Color = switch tone {
            case .active:
                ThemePalette.brand.opacity(colorScheme == .dark ? 0.88 : 0.86)
            case .accent:
                ThemePalette.brand.opacity(colorScheme == .dark ? 0.22 : 0.14)
            case .neutral:
                colorScheme == .dark ? Color.white.opacity(0.14) : Color.white.opacity(0.75)
            }

            switch shape {
            case .capsule:
                content
                    .contentShape(Capsule())
                    .glassEffect(.regular.tint(tintColor).interactive(), in: Capsule())
            case .circle:
                content
                    .contentShape(Circle())
                    .glassEffect(.regular.tint(tintColor).interactive(), in: Circle())
            case .roundedRectangle(let radius):
                content
                    .contentShape(RoundedRectangle(cornerRadius: radius))
                    .glassEffect(
                        .regular.tint(tintColor).interactive(),
                        in: RoundedRectangle(cornerRadius: radius)
                    )
            }
        } else {
            let fillColor: Color = switch tone {
            case .active:
                ThemePalette.brand
            case .accent:
                ThemePalette.brandSoft
            case .neutral:
                ThemePalette.surface
            }

            switch shape {
            case .capsule:
                content
                    .background(Capsule().fill(fillColor))
                    .overlay(
                        Capsule()
                            .stroke(tone == .active ? Color.clear : ThemePalette.border, lineWidth: 1)
                    )
                    .contentShape(Capsule())
            case .circle:
                content
                    .background(Circle().fill(fillColor))
                    .overlay(
                        Circle()
                            .stroke(tone == .active ? Color.clear : ThemePalette.border, lineWidth: 1)
                    )
                    .contentShape(Circle())
            case .roundedRectangle(let radius):
                content
                    .background(RoundedRectangle(cornerRadius: radius).fill(fillColor))
                    .overlay(
                        RoundedRectangle(cornerRadius: radius)
                            .stroke(tone == .active ? Color.clear : ThemePalette.border, lineWidth: 1)
                    )
                    .contentShape(RoundedRectangle(cornerRadius: radius))
            }
        }
    }
}

struct GlassSurfaceBackgroundModifier: ViewModifier {
    let cornerRadius: CGFloat
    let isDarkOverlay: Bool

    func body(content: Content) -> some View {
        let reduceTransparency = isReduceTransparencyActive()
        if #available(iOS 26.0, *), !reduceTransparency {
            content
                .glassEffect(
                    .regular.tint(isDarkOverlay ? Color(white: 0.1, opacity: 0.45) : .clear),
                    in: RoundedRectangle(cornerRadius: cornerRadius)
                )
        } else {
            content
                .background(
                    RoundedRectangle(cornerRadius: cornerRadius)
                        .fill(isDarkOverlay ? Color(red: 22/255, green: 28/255, blue: 26/255, opacity: 0.85) : ThemePalette.surface)
                )
                .overlay(
                    RoundedRectangle(cornerRadius: cornerRadius)
                        .stroke(Color.white.opacity(isDarkOverlay ? 0.16 : 0.08), lineWidth: 1)
                )
        }
    }
}

extension View {
    func mensaGlassPill(shape: GlassShapeKind, tone: GlassTone = .neutral) -> some View {
        modifier(GlassPillModifier(shape: shape, tone: tone))
    }

    func mensaGlassSurface(cornerRadius: CGFloat, isDarkOverlay: Bool = false) -> some View {
        modifier(GlassSurfaceBackgroundModifier(cornerRadius: cornerRadius, isDarkOverlay: isDarkOverlay))
    }
}

struct AdaptiveGlassContainer<Content: View>: View {
    let spacing: CGFloat
    @ViewBuilder let content: () -> Content

    init(spacing: CGFloat = 8, @ViewBuilder content: @escaping () -> Content) {
        self.spacing = spacing
        self.content = content
    }

    var body: some View {
        if #available(iOS 26.0, *), !isReduceTransparencyActive() {
            GlassEffectContainer(spacing: spacing) {
                content()
            }
        } else {
            content()
        }
    }
}
