import SwiftUI

public struct LightboxView: View {
    @Environment(MensaStore.self) private var store
    @Environment(\.dismiss) private var dismiss
    @Environment(\.lightboxNamespace) private var lightboxNamespace

    public let payload: LightboxPayload

    @State private var activeIndex: Int
    @State private var chromeVisible: Bool = true
    @State private var backdropAlpha: Double = 1.0
    @State private var isZoomed: Bool = false

    public init(payload: LightboxPayload) {
        self.payload = payload
        let safeIdx = min(max(0, payload.initialIndex), max(0, payload.urls.count - 1))
        self._activeIndex = State(initialValue: safeIdx)
    }

    public var body: some View {
        let s = store.strings
        let urls = payload.urls
        let activeURLString = activeIndex < urls.count ? urls[activeIndex] : (urls.first ?? "")
        let cleanLine = MealUtils.cleanLineName(payload.lineName)

        ZStack {
            Color.black
                .opacity(0.96 * backdropAlpha)
                .ignoresSafeArea()

            TabView(selection: $activeIndex) {
                ForEach(Array(urls.enumerated()), id: \.offset) { idx, urlString in
                    ZoomablePhotoSlide(
                        urlString: urlString,
                        onSingleTap: {
                            withAnimation(.easeInOut(duration: 0.2)) {
                                chromeVisible.toggle()
                            }
                        },
                        onZoomChanged: { zoomed in
                            isZoomed = zoomed
                        },
                        onBackdropDrag: { alpha in
                            backdropAlpha = alpha
                        },
                        onDismiss: {
                            dismiss()
                        }
                    )
                    .tag(idx)
                }
            }
            .tabViewStyle(.page(indexDisplayMode: .never))
            .scrollDisabled(isZoomed)
            .ignoresSafeArea()

            VStack {
                VStack(alignment: .leading, spacing: Spacing.xs) {
                    HStack {
                        if urls.count > 1 {
                            Text("\(activeIndex + 1) / \(urls.count)")
                                .font(.system(size: 13, weight: .bold))
                                .monospacedDigit()
                                .foregroundStyle(.white)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 6)
                                .mensaGlassSurface(cornerRadius: 16, isDarkOverlay: true)
                        } else {
                            Spacer().frame(width: 1, height: 1)
                        }

                        Spacer()

                        AdaptiveGlassContainer(spacing: 8) {
                            HStack(spacing: Spacing.sm) {
                                if let shareURL = URL(string: activeURLString) {
                                    ShareLink(item: shareURL, subject: Text(payload.title)) {
                                        Image(systemName: "square.and.arrow.up")
                                            .font(.system(size: 15, weight: .semibold))
                                            .foregroundStyle(.white)
                                            .frame(width: 40, height: 40)
                                    }
                                    .buttonStyle(.plain)
                                    .mensaGlassPill(shape: .circle, tone: .neutral)
                                    .accessibilityLabel(s.lightboxShare)
                                }

                                Button {
                                    dismiss()
                                } label: {
                                    Image(systemName: "xmark")
                                        .font(.system(size: 15, weight: .bold))
                                        .foregroundStyle(.white)
                                        .frame(width: 40, height: 40)
                                }
                                .buttonStyle(.plain)
                                .mensaGlassPill(shape: .circle, tone: .neutral)
                                .accessibilityLabel(s.lightboxClose)
                            }
                        }
                    }

                    VStack(alignment: .leading, spacing: 4) {
                        if !cleanLine.isEmpty {
                            HStack(spacing: 5) {
                                Image(systemName: "fork.knife")
                                    .font(.system(size: 11, weight: .semibold))
                                    .foregroundStyle(ThemePalette.brand)
                                Text(cleanLine)
                                    .font(.system(size: 12, weight: .bold))
                                    .foregroundStyle(Color.white.opacity(0.85))
                                    .lineLimit(1)
                            }
                        }

                        Text(payload.title)
                            .font(.system(size: 15, weight: .bold))
                            .foregroundStyle(.white)
                            .lineLimit(2)
                    }
                    .padding(.horizontal, 14)
                    .padding(.vertical, 10)
                    .mensaGlassSurface(cornerRadius: Radii.md, isDarkOverlay: true)
                }
                .padding(.horizontal, Spacing.lg)
                .padding(.top, Spacing.sm)

                Spacer()

                if urls.count > 1 {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: Spacing.sm) {
                            ForEach(Array(urls.enumerated()), id: \.offset) { idx, thumbURL in
                                let active = idx == activeIndex
                                Button {
                                    Haptics.selection()
                                    withAnimation(.easeInOut(duration: 0.2)) {
                                        activeIndex = idx
                                        isZoomed = false
                                    }
                                } label: {
                                    CachedMealImage(urlString: thumbURL, contentMode: .fill)
                                        .frame(width: 52, height: 52)
                                        .clipShape(RoundedRectangle(cornerRadius: Radii.sm))
                                        .overlay(
                                            RoundedRectangle(cornerRadius: Radii.sm)
                                                .stroke(
                                                    active ? ThemePalette.brand : Color.white.opacity(0.25),
                                                    lineWidth: active ? 2.5 : 1
                                                )
                                        )
                                        .opacity(active ? 1.0 : 0.65)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                        .padding(.horizontal, Spacing.md)
                        .padding(.vertical, Spacing.sm)
                    }
                    .fixedSize(horizontal: true, vertical: false)
                    .mensaGlassSurface(cornerRadius: Radii.lg, isDarkOverlay: true)
                    .padding(.horizontal, Spacing.lg)
                    .padding(.bottom, Spacing.md)
                }
            }
            .opacity(chromeVisible ? backdropAlpha : 0)
            .allowsHitTesting(chromeVisible)
        }
        .preferredColorScheme(.dark)
        .statusBarHidden(!chromeVisible)
        .optionalZoomTransition(sourceID: payload.transitionID, in: lightboxNamespace)
        .onChange(of: activeIndex) { _, _ in
            isZoomed = false
        }
    }
}

private struct ZoomablePhotoSlide: View {
    let urlString: String
    let onSingleTap: () -> Void
    let onZoomChanged: (Bool) -> Void
    let onBackdropDrag: (Double) -> Void
    let onDismiss: () -> Void

    @State private var scale: CGFloat = 1.0
    @State private var lastScale: CGFloat = 1.0
    @State private var offset: CGSize = .zero
    @State private var lastOffset: CGSize = .zero
    @State private var dragDismissY: CGFloat = 0

    var body: some View {
        GeometryReader { geo in
            let dismissScale = max(0.82, 1.0 - (dragDismissY / 320.0) * 0.18)

            CachedMealImage(urlString: urlString, contentMode: .fit, showLoadingSpinner: true)
                .frame(width: geo.size.width, height: geo.size.height)
                .scaleEffect(scale * dismissScale)
                .offset(x: offset.width, y: offset.height + dragDismissY)
                .contentShape(Rectangle())
                .onTapGesture(count: 2) {
                    withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) {
                        if scale > 1.05 {
                            scale = 1.0
                            lastScale = 1.0
                            offset = .zero
                            lastOffset = .zero
                            onZoomChanged(false)
                        } else {
                            scale = 2.5
                            lastScale = 2.5
                            onZoomChanged(true)
                        }
                    }
                }
                .onTapGesture(count: 1) {
                    onSingleTap()
                }
                .gesture(
                    MagnifyGesture()
                        .onChanged { value in
                            let next = min(max(lastScale * value.magnification, 0.9), 4.0)
                            scale = next
                        }
                        .onEnded { _ in
                            withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) {
                                if scale <= 1.05 {
                                    scale = 1.0
                                    lastScale = 1.0
                                    offset = .zero
                                    lastOffset = .zero
                                    onZoomChanged(false)
                                } else {
                                    scale = min(scale, 4.0)
                                    lastScale = scale
                                    offset = clampedOffset(offset, scale: scale, size: geo.size)
                                    lastOffset = offset
                                    onZoomChanged(true)
                                }
                            }
                        }
                )
                .simultaneousGesture(
                    DragGesture(minimumDistance: 12)
                        .onChanged { value in
                            if lastScale > 1.05 {
                                let candidate = CGSize(
                                    width: lastOffset.width + value.translation.width,
                                    height: lastOffset.height + value.translation.height
                                )
                                offset = clampedOffset(candidate, scale: lastScale, size: geo.size)
                            } else if value.translation.height > 0 && abs(value.translation.height) > abs(value.translation.width) {
                                dragDismissY = value.translation.height
                                let alpha = max(0.2, min(1.0, 1.0 - Double(value.translation.height) / 320.0))
                                onBackdropDrag(alpha)
                            }
                        }
                        .onEnded { value in
                            if lastScale > 1.05 {
                                lastOffset = offset
                                return
                            }
                            let shouldDismiss = dragDismissY > 110 || (dragDismissY > 35 && value.velocity.height > 650)
                            if shouldDismiss {
                                withAnimation(.easeOut(duration: 0.18)) {
                                    onBackdropDrag(0)
                                    dragDismissY = geo.size.height * 0.45
                                }
                                onDismiss()
                            } else {
                                withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) {
                                    dragDismissY = 0
                                    onBackdropDrag(1.0)
                                }
                            }
                        }
                )
        }
    }

    private func clampedOffset(_ candidate: CGSize, scale: CGFloat, size: CGSize) -> CGSize {
        let maxX = max(0, (size.width * (scale - 1)) / 2)
        let maxY = max(0, (size.height * (scale - 1)) / 2)
        return CGSize(
            width: min(max(candidate.width, -maxX), maxX),
            height: min(max(candidate.height, -maxY), maxY)
        )
    }
}
