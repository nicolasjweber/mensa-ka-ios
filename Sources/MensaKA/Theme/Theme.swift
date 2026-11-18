import SwiftUI
#if canImport(UIKit)
import UIKit
#endif

public enum Radii {
    public static let sm: CGFloat = 10
    public static let md: CGFloat = 16
    public static let lg: CGFloat = 20
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
        lightAlpha: 0.10,
        darkAlpha: 0.12
    )

    public static let favorite = Color.dynamic(lightHex: 0xC92A54, darkHex: 0xFF6B8B)
    public static let favoriteInk = Color.dynamic(lightHex: 0xFFFFFF, darkHex: 0x26050E)
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
    let shape: GlassShapeKind
    let tone: GlassTone
    var activeTint: Color = ThemePalette.brand

    func body(content: Content) -> some View {
        if isReduceTransparencyActive() {
            let fillColor: Color = switch tone {
            case .active:
                activeTint
            case .accent:
                ThemePalette.brandSoft
            case .neutral:
                ThemePalette.surface
            }

            switch shape {
            case .capsule:
                content
                    .background(Capsule().fill(fillColor))
                    .overlay(Capsule().stroke(tone == .active ? Color.clear : ThemePalette.border, lineWidth: 1))
                    .contentShape(Capsule())
            case .circle:
                content
                    .background(Circle().fill(fillColor))
                    .overlay(Circle().stroke(tone == .active ? Color.clear : ThemePalette.border, lineWidth: 1))
                    .contentShape(Circle())
            case .roundedRectangle(let radius):
                content
                    .background(RoundedRectangle(cornerRadius: radius, style: .continuous).fill(fillColor))
                    .overlay(
                        RoundedRectangle(cornerRadius: radius, style: .continuous)
                            .stroke(tone == .active ? Color.clear : ThemePalette.border, lineWidth: 1)
                    )
                    .contentShape(RoundedRectangle(cornerRadius: radius, style: .continuous))
            }
        } else {
            let glassStyle: Glass = switch tone {
            case .active:
                .regular.tint(activeTint).interactive()
            case .accent:
                .regular.tint(ThemePalette.brand.opacity(0.24)).interactive()
            case .neutral:
                .regular.interactive()
            }

            switch shape {
            case .capsule:
                content
                    .contentShape(Capsule())
                    .glassEffect(glassStyle, in: Capsule())
            case .circle:
                content
                    .contentShape(Circle())
                    .glassEffect(glassStyle, in: Circle())
            case .roundedRectangle(let radius):
                let rect = RoundedRectangle(cornerRadius: radius, style: .continuous)
                content
                    .contentShape(rect)
                    .glassEffect(glassStyle, in: rect)
            }
        }
    }
}

struct GlassSurfaceBackgroundModifier: ViewModifier {
    let cornerRadius: CGFloat
    let isDarkOverlay: Bool

    func body(content: Content) -> some View {
        let shape = RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
        if isReduceTransparencyActive() {
            content
                .background(
                    shape.fill(isDarkOverlay ? Color(red: 22/255, green: 28/255, blue: 26/255, opacity: 0.88) : ThemePalette.surface)
                )
                .overlay(
                    shape.stroke(Color.white.opacity(isDarkOverlay ? 0.16 : 0.08), lineWidth: 1)
                )
        } else {
            content
                .glassEffect(
                    isDarkOverlay ? .regular.tint(Color.black.opacity(0.25)) : .regular,
                    in: shape
                )
        }
    }
}

extension View {
    func mensaGlassPill(shape: GlassShapeKind, tone: GlassTone = .neutral, activeTint: Color = ThemePalette.brand) -> some View {
        modifier(GlassPillModifier(shape: shape, tone: tone, activeTint: activeTint))
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
        GlassEffectContainer(spacing: spacing) {
            content()
        }
    }
}

// MARK: - Transition Namespaces

private struct LightboxNamespaceKey: EnvironmentKey {
    static let defaultValue: Namespace.ID? = nil
}

private struct NavZoomNamespaceKey: EnvironmentKey {
    static let defaultValue: Namespace.ID? = nil
}

extension EnvironmentValues {
    var lightboxNamespace: Namespace.ID? {
        get { self[LightboxNamespaceKey.self] }
        set { self[LightboxNamespaceKey.self] = newValue }
    }

    var navZoomNamespace: Namespace.ID? {
        get { self[NavZoomNamespaceKey.self] }
        set { self[NavZoomNamespaceKey.self] = newValue }
    }
}

extension View {
    @ViewBuilder
    func optionalMatchedTransitionSource<ID: Hashable>(id: ID, in namespace: Namespace.ID?) -> some View {
        if let namespace {
            self.matchedTransitionSource(id: id, in: namespace)
        } else {
            self
        }
    }

    @ViewBuilder
    func optionalZoomTransition<ID: Hashable>(sourceID: ID?, in namespace: Namespace.ID?) -> some View {
        if let sourceID, let namespace {
            self.navigationTransition(.zoom(sourceID: sourceID, in: namespace))
        } else {
            self
        }
    }
}
